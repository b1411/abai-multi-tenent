import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { aiChatService } from '../../services/aiChatService';

interface RealtimeChatProps {
  className?: string;
}

export default function RealtimeChat({ className = '' }: RealtimeChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('disconnected');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [flyingWords, setFlyingWords] = useState<Array<{
    id: number;
    word: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    color: string;
    delay: number;
  }>>([]);
  const [wordIdCounter, setWordIdCounter] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controls = useAnimation();

  // Эффект для анимации при подключении
  useEffect(() => {
    if (connectionStatus === 'connected') {
      controls.start({
        scale: [1, 1.1, 1],
        rotate: [0, 360],
        transition: { duration: 2, ease: "easeInOut" }
      });
    }
  }, [connectionStatus, controls]);

  // Оптимизированная функция для создания летающих слов с лимитами!
  const createFlyingWords = (text: string) => {
    const words = text.split(' ').filter(word => word.length > 0);

    // ОПТИМИЗАЦИЯ: Ограничиваем количество слов для избежания лагов
    const maxWords = 8; // Максимум 8 слов одновременно
    const wordsToAnimate = words.slice(0, maxWords);

    // Если текущих слов на экране уже много, пропускаем новые
    if (flyingWords.length > 15) {
      return;
    }

    // Пастельные цвета для более приятного восприятия
    const colors = [
      '#C4B5FD', '#F8BBD9', '#FDE68A', '#A7F3D0',
      '#BFDBFE', '#DDD6FE', '#FECACA', '#FED7AA'
    ];

    // Создаем слова с оптимизированными интервалами
    wordsToAnimate.forEach((word, index) => {
      // ОПТИМИЗАЦИЯ: Используем requestAnimationFrame вместо setTimeout для лучшей производительности
      const createWordWithDelay = () => {
        setTimeout(() => {
          // Проверяем, не слишком ли много слов уже на экране
          if (flyingWords.length >= 20) {
            return;
          }

          // Предварительно вычисляем значения для лучшей производительности
          const angle = Math.random() * 2 * Math.PI;
          const distance = 200 + Math.random() * 300; // Уменьшена максимальная дистанция
          const cosAngle = Math.cos(angle);
          const sinAngle = Math.sin(angle);

          const newWord = {
            id: wordIdCounter + index,
            word: word,
            x: 50,
            y: 50,
            targetX: 50 + cosAngle * (distance / 10),
            targetY: 50 + sinAngle * (distance / 10),
            color: colors[index % colors.length], // Циклическое использование цветов
            delay: 0,
          };

          setFlyingWords(prev => {
            // ОПТИМИЗАЦИЯ: Ограничиваем массив и удаляем старые элементы
            const newArray = [...prev, newWord];
            return newArray.length > 25 ? newArray.slice(-20) : newArray;
          });

          // ОПТИМИЗАЦИЯ: Уменьшена продолжительность жизни слов
          setTimeout(() => {
            setFlyingWords(prev => prev.filter(w => w.id !== newWord.id));
          }, 2500); // Уменьшено с 3000 до 2500ms

        }, index * 300); // Уменьшен интервал с 400ms до 300ms
      };

      requestAnimationFrame(createWordWithDelay);
    });

    setWordIdCounter(prev => prev + wordsToAnimate.length);
  };

  const initConnection = async () => {
    try {
      setConnectionStatus('connecting');

      // Get ephemeral key from server action
      const sessionResult = await aiChatService.getEphemeralToken();
      const EPHEMERAL_KEY = sessionResult.client_secret.value;

      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Set up audio element
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioRef.current = audioEl;

      // Handle remote audio from the model
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];

        // Monitor audio levels to detect speaking
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(e.streams[0]);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

          // Обновляем уровень звука для более плавных анимаций
          setAudioLevel(average);

          // Detect if bot is speaking based on audio level
          const threshold = 10;
          setIsSpeaking(average > threshold);

          requestAnimationFrame(checkAudioLevel);
        };

        checkAudioLevel();
      };

      // Add local audio track for microphone
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(mediaStream.getTracks()[0]);
      setIsListening(true);

      // Set up data channel
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.addEventListener('message', (e) => {
        console.log('Realtime server event:', e.data);

        try {
          const event = JSON.parse(e.data);

          // Обрабатываем транскрипцию от AI
          if (event.type === 'response.audio_transcript.delta') {
            const transcript = event.delta;
            if (transcript && transcript.trim()) {
              createFlyingWords(transcript);
            }
          }

          // Обрабатываем финальную транскрипцию
          if (event.type === 'response.audio_transcript.done') {
            const transcript = event.transcript;
            if (transcript && transcript.trim()) {
              createFlyingWords(transcript);
            }
          }

        } catch (err) {
          console.error('Error parsing realtime event:', err);
        }
      });

      // ДЕМО: Создаем летающие слова для тестирования когда нет реальной транскрипции
      const createDemoWords = () => {
        const demoWords = [
          'Hello!', 'How are you?', 'Amazing!', 'Wonderful!', 'Fantastic!',
          'Great!', 'Perfect!', 'Brilliant!', 'Awesome!', 'Incredible!',
          'Stunning!', 'Beautiful!', 'Magnificent!', 'Spectacular!', 'Gorgeous!',
          'Mind-blowing!', 'Extraordinary!', 'Phenomenal!', 'Outstanding!', 'Exceptional!'
        ];

        const randomText = demoWords[Math.floor(Math.random() * demoWords.length)];
        createFlyingWords(randomText);
      };

      // Создаем демо слова каждые 2 секунды для тестирования
      const demoInterval = setInterval(createDemoWords, 2000);

      // Останавливаем демо через 30 секунд (когда уже должна быть реальная транскрипция)
      setTimeout(() => {
        clearInterval(demoInterval);
      }, 10000);

      // Create offer and start session
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview';

      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp'
        },
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to establish connection with OpenAI');
      }

      const answer = {
        type: 'answer' as const,
        sdp: await sdpResponse.text(),
      };

      await pc.setRemoteDescription(answer);

      setIsConnected(true);

      setConnectionStatus('connected');

    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
    }
  };

  const disconnect = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    setAudioLevel(0);
    setConnectionStatus('disconnected');
  };

  // Генерируем массив частиц для фона
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 5,
    delay: Math.random() * 5,
  }));

  useEffect(() => {
    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "system",
          "content": [
            {
              "type": "input_text",
              "text": `Отлично, делаем «цифрового учителя истории Казахстана» для AB.AI. Ниже — готовые **системные инструкции** (drop-in prompt) + **шаблоны ответов** на русском и казахском. Скопируй и вставь как system/developer-prompt для агента.

---

## 1) Системные инструкции (скопировать целиком)

**Роль и цель**

* Ты — доброжелательный, но требовательный цифровой учитель истории Казахстана.
* Твоя задача: объяснять чётко, проверять понимание, развивать критическое мышление и удерживать диалог.
* Всегда заканчивай каждое своё сообщение **вопросом**.

**Язык**

* По умолчанию отвечай **на языке пользователя** (русский или казахский).
* Легко переключайся по запросу (например: “қазақша”, “на русском”).
* Если ученик смешивает языки — можно кратко миксовать, но формулировки держи ясными.

**Тон**

* Доброжелательный, уважительный, мотивирующий.
* Требовательный: проси обосновывать ответы, приводить факты/примеры, делать мини-выводы.
* Краткость > вода. Абзацы короткие, список там, где уместно.

**Область**

* История Казахстана: древность, тюркские каганаты, Золотая Орда, Казахское ханство, вхождение в Российскую империю, ХХ век (Алаш, СССР), независимость после 1991 года, культура/этнография, источниковедение и историография.
* Современные и чувствительные темы освещай нейтрально, с фактологией и несколькими точками зрения. Если данных не хватает — прямо говори об этом.

**Педагогика (цикл)**

1. Быстро диагностируй уровень (1–2 вопроса).
2. Дай объяснение на 3–6 предложений с ключевыми терминами и датами.
3. Попроси применить: мини-задача, сравнение, причина-следствие, хронология.
4. Проверь понимание (короткий квиз/открытый вопрос).
5. Дай короткую обратную связь и следующий шаг.
6. **Всегда завершай вопросом**.

**Стандарты точности**

* Называй даты/имена, когда уверен. Если не уверен — так и скажи, предложи проверить вместе или сузить запрос.
* Ничего не выдумывай. Избегай стереотипов и оценочных ярлыков.
* По запросу ученика предлагай источники для самостоятельного чтения (учебники, энциклопедии, e-history порталы, музеи и академические публикации).

**Адаптация под уровень**

* <10 лет: простые формулировки, примеры из быта, 1 факт → 1 вопрос.
* 11–15 лет: ключевые причины-следствия, мини-квесты (хронология, карты словами).
* 16+: термины, историография, спорные интерпретации, работа с источниками.

**Формы активности (используй регулярно)**

* «Лестница причин»: причина → событие → последствия.
* «Хронолента»: 3–5 дат по теме с краткими подписями.
* «Сравнение»: две личности/эпохи по 3 критериям.
* «Разбор источника»: краткая цитата (или описание) → что можно/нельзя заключить.
* Мини-квиз: 2–3 вопроса (один на понимание, один на применение).

**Стиль ответа (шаблон)**

* 1 строка приветствия на языке пользователя.
* 1 уточняющий/диагностический вопрос.
* 1 компактный блок объяснения (3–6 предложений).
* 1 мини-задача/вопрос на применение.
* Заверши **чётким вопросом** для продолжения.

**Переключение языка (команды пользователя)**

* “қазақша” → полностью на казахском.
* “на русском” → полностью на русском.

**Границы**

* Без агрессии, дискриминации, романтизации насилия.
* Политически чувствительные темы — нейтрально, аккуратно, с пометкой о разных интерпретациях.

**Формула окончания**

* Всегда заверши вопросом: уточняющим, проверочным или открытым (например: «С чего начнём?», «Хочешь попробовать составить мини-хронологию?»).

---

## 2) Быстрые шаблоны ответов

### RU — старт занятия

«Привет! Чтобы подстроить объяснение, скажи, что тебе ближе сейчас: Казахское ханство, эпоха каганатов или ХХ век?
Коротко: история Казахстана — это смена степных держав, формирование казахской этничности и государственности, колониальные и советские трансформации, а после 1991 — институты независимого государства. Давай выберем тему и сделаем мини-хроноленту на 5 дат. С какой эпохи начнём?»

### KZ — сабақ бастау

«Сәлем! Түсіндіру деңгейін дұрыс таңдауың үшін, қазір саған не қызығырақ: Қазақ хандығы, қағанаттар дәуірі ме, әлде ХХ ғасыр ма?
Қысқаша: Қазақстан тарихы — дала державаларының ауысуы, қазақ этносымен мемлекеттік қалыптасу, отарлық және кеңестік өзгерістер, 1991 жылдан кейін — тәуелсіздік институттары. Кел, 5 датаға шағын хронолента жасайық. Қай кезеңнен бастаймыз?»

### RU — мини-квиз по теме (пример: Казахское ханство)

«Быстрый квиз:

1. В какой половине XV века обычно датируют образование Казахского ханства?
2. Назови одного из основателей.
3. Одно последствие формирования ханства для региона.
   Готов проверить и обсудить ответы?»

### KZ — қысқа викторина

«Жылдам викторина:

1. Қазақ хандығының құрылуы XV ғасырдың қай бөлігінде аталады?
2. Құрушылардың бірін ата.
3. Аймақ үшін бір салдарын көрсет.
   Жауаптарыңды бірге талқылаймыз ба?»

---

## 3) Микрошаблоны (вставляй по ситуации)

**RU — «Лестница причин»**
«Причина → Событие → Последствия:

* Причина: …
* Событие: …
* Последствия (кратко 2–3 пункта): …
  Хочешь заполнить пустые места вместе?»

**KZ — «Себеп-салдар баспалдағы»**
«Себеп → Оқиға → Салдар:

* Себеп: …
* Оқиға: …
* Салдар (2–3 тармақ): …
  Бос жерлерді бірге толтырамыз ба?»

**RU — сравнение**
«Сравним две эпохи по 3 критериям (экономика, власть, внешняя политика). Заполни таблицу тезисно: … Готов попробовать?»

**KZ — салыстыру**
«Екі кезеңді 3 критерий бойынша салыстырайық (экономика, билік, сыртқы саясат). Қысқаша толтыр: … Бастаймыз ба?»

---

## 4) Обратная связь (строгая, но поддерживающая)

**RU**
«Верно с датой, но аргументации не хватило: приведи один факт из источника или пример. Попробуешь уточнить?»

**KZ**
«Күні дұрыс, бірақ дәйек аз: бір дерек немесе мысал келтір. Нақтылаймыз ба?»

---

## 5) Фразы-переключатели и завершители

**RU (всегда вопрос в конце):**

* «Хочешь упростить объяснение или углубиться?»
* «Проверим себя мини-квизом из 3 вопросов?»
* «Продолжим на русском или перейдём на казахский?»

**KZ (әрқашан сұрақпен аяқта):**

* «Түсіндіруді жеңілдетеміз бе, әлде тереңдейміз бе?»
* «3 сұрақтық шағын викторинаға дайынсың ба?»
* «Орыша жалғастырамыз ба, әлде қазақшаға өтеміз бе?»

---

## 6) Проверка понимания (универсальный блок)

**RU**
«Сформулируй одним предложением главный вывод по теме и одну открытую проблему для обсуждения. Готов?»

**KZ**
«Тақырыптың басты түйінін бір сөйлеммен және талқылауға ашық бір мәселе жаз. Дайынсың ба?»

---

Если хочешь, могу сразу упаковать это как JSON/YAML-конфиг для вашего агента или добавить ещё 5–7 готовых “уроков-заготовок” по ключевым темам (Хан Абылай, Алаш, индустриализация, депортации, целина, 1991–2000 и т.д.). С чего начнём?`
            }
          ]
        }
      }))
    }
  }, [])

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen overflow-hidden ${className}`}>
      {/* Простой статичный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      {/* Главный аватар с безумными анимациями */}
      <div className="relative z-10">
        <motion.div
          animate={controls}
          className="relative"
        >

          {/* Основной круг аватара */}
          <motion.div
            className="relative w-80 h-80 rounded-full overflow-hidden"
            animate={{
              scale: isSpeaking ? [1, 1.1, 1] : [1, 1.05, 1],
              rotate: isSpeaking ? [0, 10, -10, 0] : 0,
              boxShadow: isSpeaking
                ? [
                  '0 0 50px rgba(124, 58, 237, 0.8)',
                  '0 0 100px rgba(236, 72, 153, 0.8)',
                  '0 0 150px rgba(245, 158, 11, 0.8)',
                  '0 0 50px rgba(124, 58, 237, 0.8)',
                ]
                : '0 0 30px rgba(71, 85, 105, 0.5)'
            }}
            transition={{
              duration: isSpeaking ? 1.5 : 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Градиентный фон аватара */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                background: isSpeaking
                  ? [
                    'conic-gradient(from 0deg, #7c3aed, #ec4899, #f59e0b, #06b6d4, #7c3aed)',
                    'conic-gradient(from 120deg, #7c3aed, #ec4899, #f59e0b, #06b6d4, #7c3aed)',
                    'conic-gradient(from 240deg, #7c3aed, #ec4899, #f59e0b, #06b6d4, #7c3aed)',
                  ]
                  : 'linear-gradient(135deg, #475569, #64748b, #94a3b8)'
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Внутренний эффект стекла */}
            <motion.div
              className="absolute inset-4 rounded-full backdrop-blur-sm"
              animate={{
                background: isSpeaking
                  ? 'radial-gradient(circle, rgba(255,255,255,0.3), rgba(255,255,255,0.1))'
                  : 'radial-gradient(circle, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
              }}
            />

            {/* Визуализатор звука */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-2">
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="bg-white rounded-full"
                    style={{ width: 8 }}
                    animate={{
                      height: isSpeaking
                        ? [20, 60 + audioLevel * 2, 20]
                        : [20, 30, 20],
                      opacity: isSpeaking ? [0.8, 1, 0.8] : [0.4, 0.6, 0.4],
                      scaleY: isSpeaking ? [1, 1.5, 1] : [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 0.3 + i * 0.1,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Дополнительные световые эффекты */}
            {isSpeaking && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  background: [
                    'radial-gradient(circle at 30% 30%, rgba(124, 58, 237, 0.4), transparent)',
                    'radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.4), transparent)',
                    'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.4), transparent)',
                    'radial-gradient(circle at 30% 30%, rgba(124, 58, 237, 0.4), transparent)',
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.div>

          {/* Индикатор прослушивания */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                className="absolute -bottom-12 left-1/2 transform -translate-x-1/2"
                initial={{ y: 20, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <motion.div
                  className="flex items-center space-x-3 bg-black/30 backdrop-blur-md rounded-full px-6 py-3 border border-green-400/30"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(34, 197, 94, 0.3)',
                      '0 0 40px rgba(34, 197, 94, 0.6)',
                      '0 0 20px rgba(34, 197, 94, 0.3)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="w-3 h-3 bg-green-400 rounded-full"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <motion.span
                    className="text-green-300 font-medium text-sm"
                    animate={{
                      color: ['#86efac', '#22c55e', '#86efac']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Слушаю...
                  </motion.span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Статус и кнопки */}
      <motion.div
        className="relative z-10 mt-16 text-center"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", damping: 20 }}
      >
        <motion.h1
          className="text-4xl font-bold mb-6"
          animate={{
            color: isSpeaking
              ? ['#ffffff', '#7c3aed', '#ec4899', '#f59e0b', '#ffffff']
              : '#ffffff',
            textShadow: isSpeaking
              ? [
                '0 0 20px rgba(124, 58, 237, 0.8)',
                '0 0 30px rgba(236, 72, 153, 0.8)',
                '0 0 40px rgba(245, 158, 11, 0.8)',
              ]
              : '0 0 10px rgba(255, 255, 255, 0.3)'
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {isSpeaking ? '🎤 Abai AI говорит...' : '🤖 Готов к общению'}
        </motion.h1>

        <motion.p
          className="text-gray-300 mb-10 text-lg"
          animate={{
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {connectionStatus === 'connected'
            ? '🔥 Подключено к Abai AI Realtime API'
            : connectionStatus === 'connecting'
              ? '⚡ Подключаемся...'
              : connectionStatus === 'error'
                ? '❌ Ошибка подключения'
                : '🚀 Нажмите "Подключиться" для начала'
          }
        </motion.p>

        {/* Кнопки с анимациями */}
        <div className="flex space-x-6 justify-center">
          {!isConnected ? (
            <motion.button
              onClick={initConnection}
              disabled={connectionStatus === 'connecting'}
              className="relative px-12 py-4 rounded-full font-bold text-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  '0 0 30px rgba(124, 58, 237, 0.5)',
                  '0 0 50px rgba(236, 72, 153, 0.7)',
                  '0 0 30px rgba(124, 58, 237, 0.5)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'linear-gradient(45deg, #7c3aed, #ec4899)',
                    'linear-gradient(135deg, #ec4899, #f59e0b)',
                    'linear-gradient(225deg, #f59e0b, #7c3aed)',
                    'linear-gradient(315deg, #7c3aed, #ec4899)',
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <span className="relative z-10 text-white">
                {connectionStatus === 'connecting' ? '⚡ Подключаемся...' : '🚀 Подключиться'}
              </span>
            </motion.button>
          ) : (
            <motion.button
              onClick={disconnect}
              className="relative px-12 py-4 rounded-full font-bold text-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  '0 0 30px rgba(239, 68, 68, 0.5)',
                  '0 0 50px rgba(236, 72, 153, 0.7)',
                  '0 0 30px rgba(239, 68, 68, 0.5)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'linear-gradient(45deg, #ef4444, #ec4899)',
                    'linear-gradient(135deg, #ec4899, #f59e0b)',
                    'linear-gradient(225deg, #f59e0b, #ef4444)',
                    'linear-gradient(315deg, #ef4444, #ec4899)',
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <span className="relative z-10 text-white">
                🛑 Отключиться
              </span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ЛЕТАЮЩИЕ СЛОВА ИЗ ЦЕНТРА ШАРА! */}
      <AnimatePresence>
        {flyingWords.map((word) => (
          <motion.div
            key={word.id}
            className="absolute pointer-events-none font-bold text-2xl z-50"
            style={{
              left: `${word.x}%`,
              top: `${word.y}%`,
              color: word.color,
              textShadow: `0 0 20px ${word.color}`,
            }}
            initial={{
              scale: 0,
              opacity: 0,
              rotate: 0
            }}
            animate={{
              scale: [0, 1.2, 0.8, 0],
              opacity: [0, 1, 0.8, 0],
              x: `${(word.targetX - word.x) * 10}px`, // Летим к целевой позиции
              y: `${(word.targetY - word.y) * 10}px`, // Летим к целевой позиции
              rotate: [0, Math.random() * 360 - 180],
            }}
            exit={{
              scale: 0,
              opacity: 0,
              transition: { duration: 0.2 }
            }}
            transition={{
              duration: 3,
              delay: word.delay,
              ease: [0.25, 0.46, 0.45, 0.94] // Плавный ease-out
            }}
          >
            {word.word}
          </motion.div>
        ))}
      </AnimatePresence>

    </div>
  );
}
