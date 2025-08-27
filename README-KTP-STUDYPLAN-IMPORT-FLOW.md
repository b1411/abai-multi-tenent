# Импорт учебного плана из КТП (docx/pdf)

Цель: из файла календарно‑тематического планирования (КТП) создать:
1. StudyPlan
2. Lessons
3. CurriculumPlan (CurriculumPlan = КТП структура)
4. Отдавать прогресс (upload → extract → ai → plan → lessons → curriculum → finish) без моков.

## Текущая реализация (уже есть)

Сервис `StudyPlansService.importFromFile` и async версия `importFromFileWithProgress`:
- Извлекает текст (`pdf-parse` / `mammoth`)
- AI (`AiAssistantService.parseKtpRawText`) → `KtpImportedStructure`:
  ```ts
  interface KtpImportedStructure {
    courseName?: string;
    description?: string;
    sections?: {
      title?: string;
      description?: string;
      lessons?: {
        title?: string;
        description?: string;
        duration?: number;
        week?: number;
        date?: string;
        materials?: string[];
        objectives?: string[];
        methods?: string[];
        homework?: string;
      }[];
    }[];
  }
  ```
- Создаёт StudyPlan
- Создаёт Lesson для каждого lesson в секциях
- Строит `plannedLessons` (sections → lessons) и сохраняет в `CurriculumPlan`
- Прогресс обновляется через `ImportProgressService` (in‑memory Map)

## Маппинг (AI → БД)

| Поле AI | StudyPlan | Lesson | CurriculumPlan.plannedLessons[*].lessons[*] |
|---------|-----------|--------|---------------------------------------------|
| courseName | name | — | sectionTitle fallback |
| description | description | — | sectionDescription fallback |
| sections[].title | — | — | sectionTitle |
| sections[].description | — | — | sectionDescription |
| sections[].lessons[].title | — | name | title |
| sections[].lessons[].description | — | description | description |
| duration | — | (нет отдельного поля в Lesson) | duration (для UI / анализа) |
| week | — | (косвенно для сортировки) | week |
| date | date (если есть) | date | date |
| materials | — | (сейчас не маппим) | materials |
| objectives | — | — | objectives |
| methods | — | — | methods |
| homework | — | — | homework |
| status (отсутствует) | — | — | 'planned' по умолчанию |

Примечание: модель `Lesson` не хранит duration/week/objectives/methods — они остаются только внутри JSON `plannedLessons` CurriculumPlan.

## Расчёт `totalLessons`
`sum(sections.lessons.length)`

## Улучшения (рекомендуемые)

1. Транзакция
   - Обернуть цепочку (create StudyPlan → lessons → curriculumPlan) в `prisma.$transaction` чтобы избежать частичных артефактов при падении.
2. Идемпотентность
   - Хэш файла (SHA256) и таблица import_logs: если уже импортирован — вернуть ссылку (опционально).
3. Валидация структуры AI
   - Минимум 1 section, 1 lesson иначе ошибка `AI_STRUCTURE_INVALID`.
4. Авто‑дата
   - Если нет `date`: вычислять от стартовой даты курса (передавать в DTO) + (week, позиция).
5. Настраиваемая стратегия дат:
   - DTO: `dateStrategy: 'now' | 'sequential' | 'keep'`
6. Установка нормативной нагрузки (если есть sum(duration)).
7. Прогресс percent
   - Рассчитывать процент по завершённым шагам (шагов фиксировано 7).
8. Ошибки AI
   - Логировать сырой текст + truncated AI ответ (для диагностики).
9. Роли / RBAC
   - Ограничить импорт: `ADMIN` / `TEACHER` (с проверкой teacherId == current teacher если роль TEACHER).
10. Ограничение размера файла и типа (миме whitelist).
11. Квота по количеству импортов в сутки (anti‑abuse).
12. Массовый импорт (zip) — отдельный пакет/очередь (позже).

## Асинхронный поток (подтверждение дизайна)

1. POST `/study-plans/import-file-async` (multipart)
   - Создаёт jobId
   - upload -> done (100%)
   - setImmediate запускает фоновую задачу
2. Клиент сразу начинает polling `/study-plans/import-progress/:jobId`
3. По завершении:
   ```json
   {
     "jobId": "...",
     "finished": true,
     "result": {
       "studyPlanId": 12,
       "curriculumPlanId": 34,
       "totalLessons": 48
     }
   }
   ```
4. UI может сделать redirect/refresh списка.

## Обработка ошибок

| Сценарий | Статус шага | Error |
|----------|-------------|-------|
| Ошибка извлечения текста | extract = error | AI_PARSE_FAILED / SHORT_TEXT |
| Ошибка AI | ai = error | message |
| FK teacher/group | plan = error | BAD_REQUEST |
| Создание lessons | lessons = error | message |
| CurriculumPlan | curriculum = error | message |

Публичный ответ прогресса содержит `error` и последний step = `error`.

## Pseudo-code (улучшенная транзакция)

```ts
async importFromFileWithProgress(jobId, progress, file, dto) {
  try {
    progress.done('upload');
    progress.active('extract');

    const raw = await extractPlainText(file);
    if (!validRaw(raw)) throw new BadRequestException('EXTRACT_FAILED');
    progress.done('extract');
    progress.active('ai');

    const structured = await ai.parseKtpRawText(raw);
    validateStructured(structured);
    progress.done('ai');
    progress.active('plan');

    await this.prisma.$transaction(async tx => {
      const teacherId = await resolveTeacher(tx, dto.teacherId);
      const studyPlan = await tx.studyPlan.create({ data: {...} });

      progress.done('plan');
      progress.active('lessons');

      let index = 0;
      for (const s of structured.sections ?? []) {
        for (const l of s.lessons ?? []) {
          index++;
          await tx.lesson.create({ data: mapLesson(l, studyPlan.id, index) });
        }
      }

      progress.done('lessons');
      progress.active('curriculum');

      const plannedSections = buildPlannedSections(structured);
      const totalLessons = calcTotal(plannedSections);

      await tx.curriculumPlan.create({
        data: {
          studyPlanId: studyPlan.id,
          totalLessons,
          plannedLessons: plannedSections,
          actualLessons: [],
          completionRate: 0
        }
      });
    });

    progress.done('curriculum');
    progress.active('finish');
    progress.complete(jobId, { studyPlanId, curriculumPlanId, totalLessons });
  } catch (e) {
    progress.fail(jobId, e.message || 'IMPORT_FAILED');
  }
}
```

## Эндпоинты (итог)

- POST `/study-plans/import-file` (синхронный, уже есть) — опционально оставить
- POST `/study-plans/import-file-async` — async
- GET `/study-plans/import-progress/:jobId` — polling

## Frontend (ключевые моменты)

1. После upload:
   - Немедленный `getImportProgress(jobId)`
   - Интервал 800–1000 мс
2. Отображать `active` / `done` / `error`
3. Кнопка "Перейти к плану" после finish
4. Если `error` — показать текст ошибки, кнопка повторить.

## Ответ на вопрос "как мы можем сделать импорт учебных планов из КТП?"

Используем текущую схему:
- Файл КТП → извлечение текста → AI структурирует → создаём учебный план + уроки + CurriculumPlan в транзакции → отслеживаем прогресс через in‑memory сервис + polling на фронте. Маппинг описан выше.

## Дальнейшие шаги (если нужно внедрить улучшения)

1. Добавить транзакцию
2. Валидация структуры AI
3. Расчёт percent в прогрессе
4. Немедленный первый poll на фронте
5. Рефакторинг в отдельный Importer (класс) для тестируемости
6. Логирование и метрики (время шагов)
