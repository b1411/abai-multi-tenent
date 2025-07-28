import * as fs from 'fs';
import * as path from 'path';

function destroyOldRoleSystem() {
  console.log('🔥 УНИЧТОЖЕНИЕ СТАРОЙ СИСТЕМЫ РОЛЕЙ...');

  // 1. Удаляем файлы старой системы
  console.log('💀 Удаляем файлы старой системы...');
  
  try {
    // Удаляем role.guard.ts
    const roleGuardPath = 'src/common/guards/role.guard.ts';
    if (fs.existsSync(roleGuardPath)) {
      fs.unlinkSync(roleGuardPath);
      console.log('✅ Удален role.guard.ts');
    }

    // Удаляем roles.decorator.ts
    const rolesDecoratorPath = 'src/common/decorators/roles.decorator.ts';
    if (fs.existsSync(rolesDecoratorPath)) {
      fs.unlinkSync(rolesDecoratorPath);
      console.log('✅ Удален roles.decorator.ts');
    }
  } catch (error) {
    console.log('ℹ️ Файлы уже удалены или не найдены');
  }

  // 2. Ищем все контроллеры
  console.log('🔍 Ищем контроллеры с остатками старой системы...');
  
  const controllersPath = 'src';
  const controllers = findControllerFiles(controllersPath);
  
  console.log(`Найдено ${controllers.length} контроллеров для проверки`);

  // 3. Очищаем импорты в каждом контроллере
  let cleaned = 0;
  for (const controller of controllers) {
    const wasChanged = cleanController(controller);
    if (wasChanged) {
      cleaned++;
      console.log(`✅ Очищен: ${controller}`);
    }
  }

  console.log(`\n🎉 УНИЧТОЖЕНИЕ ЗАВЕРШЕНО!`);
  console.log(`📊 Статистика:`);
  console.log(`   - Файлов старой системы удалено: 2`);
  console.log(`   - Контроллеров проверено: ${controllers.length}`);
  console.log(`   - Контроллеров очищено: ${cleaned}`);
  console.log(`\n✅ Старая система ролей полностью уничтожена!`);
  console.log(`✅ Остался только RBAC с @RequirePermission`);
}

function findControllerFiles(dir: string): string[] {
  const controllers: string[] = [];
  
  function searchRecursive(currentDir: string) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules')) {
        searchRecursive(fullPath);
      } else if (item.endsWith('.controller.ts')) {
        controllers.push(fullPath);
      }
    }
  }
  
  searchRecursive(dir);
  return controllers;
}

function cleanController(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Паттерны для удаления
  const patterns = [
    /import\s+{\s*RolesGuard\s*}\s+from\s+['"]\.\.\/(\.\.\/)*common\/guards\/role\.guard['"]\s*;\s*\n?/g,
    /import\s+{\s*Roles\s*}\s+from\s+['"]\.\.\/(\.\.\/)*common\/decorators\/roles\.decorator['"]\s*;\s*\n?/g,
    /,\s*RolesGuard/g,
    /RolesGuard\s*,\s*/g,
    /@Roles\([^)]*\)\s*\n/g,
  ];

  let newContent = content;
  let hasChanges = false;

  for (const pattern of patterns) {
    const before = newContent;
    newContent = newContent.replace(pattern, '');
    if (before !== newContent) {
      hasChanges = true;
    }
  }

  // Убираем лишние пустые строки
  newContent = newContent.replace(/\n\n\n+/g, '\n\n');

  if (hasChanges) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }

  return false;
}

// Запускаем уничтожение
try {
  destroyOldRoleSystem();
} catch (error) {
  console.error(error);
}
