import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { CountryData, WorldMapData } from '../types/alumni';
import { MapPin, Users, Building, Globe } from 'lucide-react';

interface WorldMapProps {
  data: WorldMapData;
  className?: string;
}

// URL для карты мира
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Координаты стран
const countryCoordinates: Record<string, [number, number]> = {
  'US': [-95.7129, 37.0902], // США
  'GB': [-3.4360, 55.3781],  // Великобритания
  'CA': [-106.3468, 56.1304], // Канада
  'DE': [10.4515, 51.1657],  // Германия
  'AU': [133.7751, -25.2744], // Австралия
  'KR': [127.7669, 35.9078], // Южная Корея
  'SG': [103.8198, 1.3521],  // Сингапур
  'KZ': [66.9237, 48.0196],  // Казахстан
};

// Создание цвета для маркера
const getMarkerColor = (count: number) => {
  if (count >= 40) return '#dc2626'; // красный
  if (count >= 30) return '#ea580c'; // оранжевый
  if (count >= 20) return '#d97706'; // желто-оранжевый
  if (count >= 10) return '#059669'; // зеленый
  return '#3b82f6'; // синий
};

// Создание размера для маркера
const getMarkerSize = (count: number) => {
  const maxCount = 50;
  const minSize = 8;
  const maxSize = 20;
  const ratio = Math.min(count / maxCount, 1);
  return minSize + (maxSize - minSize) * ratio;
};

const WorldMap: React.FC<WorldMapProps> = ({ data, className = '' }) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const totalStudents = data.countries.reduce((sum, country) => sum + country.count, 0);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Заголовок */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
          <Globe className="h-7 w-7 mr-3 text-blue-600" />
          География наших выпускников
        </h2>
        <p className="text-gray-600">
          {totalStudents} выпускников учатся в {data.countries.length} странах мира
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Интерактивная карта */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Интерактивная карта мира
            </h3>
            <div className="bg-white rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <ComposableMap
                projectionConfig={{
                  scale: 140,
                }}
                width={800}
                height={400}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup>
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#f0f4f8"
                          stroke="#e2e8f0"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "#e0e7ff", outline: "none" },
                            pressed: { outline: "none" },
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  {/* Маркеры стран */}
                  {data.countries.map((country) => {
                    const coords = countryCoordinates[country.code];
                    if (!coords) return null;

                    return (
                      <Marker
                        key={country.code}
                        coordinates={coords}
                        onClick={() => setSelectedCountry(country)}
                        onMouseEnter={() => setHoveredCountry(country.code)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        style={{ default: { cursor: 'pointer' } }}
                      >
                        <circle
                          r={getMarkerSize(country.count)}
                          fill={getMarkerColor(country.count)}
                          stroke="#ffffff"
                          strokeWidth={2}
                          opacity={hoveredCountry === country.code ? 0.8 : 1}
                          style={{
                            transition: 'all 0.2s ease-in-out',
                            transform: hoveredCountry === country.code ? 'scale(1.1)' : 'scale(1)',
                          }}
                        />
                        <text
                          textAnchor="middle"
                          y={0}
                          fontSize="10"
                          fill="white"
                          fontWeight="bold"
                          dy="0.35em"
                        >
                          {country.count}
                        </text>
                      </Marker>
                    );
                  })}
                </ZoomableGroup>
              </ComposableMap>

              {/* Подсказка при наведении */}
              {hoveredCountry && (
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-2 rounded text-sm pointer-events-none">
                  {data.countries.find(c => c.code === hoveredCountry)?.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Боковая панель с информацией */}
        <div className="space-y-4">
          {/* Легенда */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Легенда карты</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                <span className="text-sm text-gray-600">40+ студентов</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-600 rounded-full"></div>
                <span className="text-sm text-gray-600">30-39 студентов</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
                <span className="text-sm text-gray-600">20-29 студентов</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                <span className="text-sm text-gray-600">10-19 студентов</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-600">1-9 студентов</span>
              </div>
            </div>
          </div>

          {/* Топ стран */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Топ стран
            </h3>
            <div className="space-y-2">
              {data.countries
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((country) => (
                  <div
                    key={country.code}
                    className="flex items-center justify-between p-2 bg-white rounded cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => setSelectedCountry(country)}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {country.name}
                    </span>
                    <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">
                      {country.count}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Статистика */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Статистика</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Всего стран:</span>
                <span className="font-medium">{data.countries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Всего студентов:</span>
                <span className="font-medium">{totalStudents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">За рубежом:</span>
                <span className="font-medium">
                  {data.countries.filter(c => c.code !== 'KZ').reduce((sum, c) => sum + c.count, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Детали выбранной страны */}
      {selectedCountry && (
        <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center">
              <Building className="h-6 w-6 mr-2" />
              {selectedCountry.name}
            </h3>
            <button
              onClick={() => setSelectedCountry(null)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ✕ Закрыть
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center text-blue-800 mb-2">
              <Users className="h-5 w-5 mr-2" />
              <span className="text-lg font-medium">Студентов: {selectedCountry.count}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedCountry.universities.map((university, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="font-medium text-gray-900 mb-1">{university.name}</div>
                {university.city && (
                  <div className="text-sm text-gray-600 mb-2">{university.city}</div>
                )}
                <div className="text-sm text-blue-600 font-semibold">
                  Студентов: {university.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Мобильная адаптивность - список стран для мобильных устройств */}
      {isMobile && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Страны обучения</h3>
          <div className="grid grid-cols-2 gap-3">
            {data.countries.map((country) => (
              <div
                key={country.code}
                className="bg-gray-50 rounded-lg p-3 text-center cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => setSelectedCountry(country)}
              >
                <div className="font-medium text-gray-900 text-sm">{country.name}</div>
                <div className="text-xs text-gray-600 mt-1">{country.count} студентов</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldMap;
