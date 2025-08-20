// Экспорт страниц
export { default as AlumniList } from './pages/AlumniList';
export { default as AlumniDetail } from './pages/AlumniDetail';

// Экспорт компонентов
export { default as AlumniCard } from './components/AlumniCard';
export { default as AlumniStats } from './components/AlumniStats';
export { default as AlumniFilters } from './components/AlumniFilters';
export { default as WorldMap } from './components/WorldMap';

// Экспорт хуков
export * from './hooks/useAlumni';

// Экспорт типов
export * from './types/alumni';

// Экспорт сервисов
export { alumniService } from './services/alumniService';
