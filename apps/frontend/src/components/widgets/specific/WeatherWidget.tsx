import React from 'react';
import { Widget } from '../../../types/widget';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, Thermometer, Eye } from 'lucide-react';

interface WeatherWidgetProps {
  data: any;
  widget: Widget;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ data, widget }) => {
  // Mock data structure for weather
  const mockData = {
    location: 'Алматы',
    temperature: -5,
    condition: 'snow', // sunny, cloudy, rainy, snow, windy
    description: 'Небольшой снег',
    humidity: 78,
    windSpeed: 12,
    visibility: 8,
    feelsLike: -8,
    forecast: [
      { day: 'Сегодня', temp: -5, condition: 'snow', icon: '❄️' },
      { day: 'Завтра', temp: -3, condition: 'cloudy', icon: '☁️' },
      { day: 'Послезавтра', temp: -1, condition: 'sunny', icon: '☀️' }
    ]
  };

  const weather = data || mockData;

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'snow':
        return <Snowflake className="h-6 w-6 text-blue-300" />;
      case 'windy':
        return <Wind className="h-6 w-6 text-gray-600" />;
      default:
        return <Cloud className="h-6 w-6 text-gray-500" />;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 25) return 'text-red-600';
    if (temp > 15) return 'text-orange-500';
    if (temp > 5) return 'text-yellow-500';
    if (temp > -5) return 'text-blue-500';
    return 'text-blue-700';
  };

  const getBackgroundColor = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return 'from-yellow-50 to-orange-50';
      case 'cloudy':
        return 'from-gray-50 to-slate-50';
      case 'rainy':
        return 'from-blue-50 to-indigo-50';
      case 'snow':
        return 'from-blue-50 to-cyan-50';
      case 'windy':
        return 'from-gray-50 to-blue-50';
      default:
        return 'from-gray-50 to-blue-50';
    }
  };

  return (
    <div className="h-full relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${getBackgroundColor(weather.condition)} opacity-30 rounded-lg`}></div>
      
      <div className="relative z-10 h-full flex flex-col p-1">
        {/* Main weather display */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getWeatherIcon(weather.condition)}
            <div>
              <div className={`text-2xl font-bold ${getTemperatureColor(weather.temperature)}`}>
                {weather.temperature}°C
              </div>
              <div className="text-xs text-gray-600 truncate">
                {weather.location}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-800 truncate">
              {weather.description}
            </div>
            <div className="text-xs text-gray-500">
              Ощущается {weather.feelsLike}°C
            </div>
          </div>
        </div>

        {/* Weather details */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-white/60 border border-white/80 text-center">
            <Droplets className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <div className="text-xs font-medium text-gray-700">{weather.humidity}%</div>
            <div className="text-xs text-gray-500">Влажность</div>
          </div>
          <div className="p-2 rounded-lg bg-white/60 border border-white/80 text-center">
            <Wind className="h-4 w-4 text-gray-500 mx-auto mb-1" />
            <div className="text-xs font-medium text-gray-700">{weather.windSpeed} км/ч</div>
            <div className="text-xs text-gray-500">Ветер</div>
          </div>
          <div className="p-2 rounded-lg bg-white/60 border border-white/80 text-center">
            <Eye className="h-4 w-4 text-gray-500 mx-auto mb-1" />
            <div className="text-xs font-medium text-gray-700">{weather.visibility} км</div>
            <div className="text-xs text-gray-500">Видимость</div>
          </div>
        </div>

        {/* Forecast for medium and large widgets */}
        {widget.size !== 'small' && (
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-600 mb-2">Прогноз</div>
            <div className="space-y-2">
              {weather.forecast?.slice(0, widget.size === 'medium' ? 2 : 3).map((day: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/60 border border-white/80">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{day.icon}</span>
                    <span className="text-xs font-medium text-gray-700 truncate">{day.day}</span>
                  </div>
                  <div className={`text-sm font-bold ${getTemperatureColor(day.temp)}`}>
                    {day.temp}°C
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo indicator */}
        <div className="mt-2 flex justify-end">
          <div className="px-2 py-1 bg-amber-100/80 text-amber-700 rounded text-xs font-medium">
            Demo
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
