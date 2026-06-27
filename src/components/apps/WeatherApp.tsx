import React, { useState } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Thermometer, RefreshCw } from 'lucide-react';

interface WeatherAppProps {
  onClose: () => void;
  accentClass: string;
}

interface CityWeather {
  name: string;
  tempF: number;
  condition: string;
  humidity: number;
  windSpeed: string;
  forecast: { day: string; tempF: number; icon: string }[];
}

const WEATHER_DATA: Record<string, CityWeather> = {
  helsinki: {
    name: 'Helsinki',
    tempF: 62,
    condition: 'Cloudy',
    humidity: 78,
    windSpeed: '12 mph',
    forecast: [
      { day: 'Sun', tempF: 64, icon: 'cloudy' },
      { day: 'Mon', tempF: 60, icon: 'rain' },
      { day: 'Tue', tempF: 58, icon: 'rain' },
      { day: 'Wed', tempF: 61, icon: 'sunny' },
      { day: 'Thu', tempF: 65, icon: 'sunny' }
    ]
  },
  seattle: {
    name: 'Seattle',
    tempF: 72,
    condition: 'Sunny',
    humidity: 45,
    windSpeed: '4 mph',
    forecast: [
      { day: 'Sun', tempF: 74, icon: 'sunny' },
      { day: 'Mon', tempF: 76, icon: 'sunny' },
      { day: 'Tue', tempF: 71, icon: 'cloudy' },
      { day: 'Wed', tempF: 68, icon: 'rain' },
      { day: 'Thu', tempF: 73, icon: 'sunny' }
    ]
  },
  tokyo: {
    name: 'Tokyo',
    tempF: 81,
    condition: 'Thunderstorm',
    humidity: 90,
    windSpeed: '18 mph',
    forecast: [
      { day: 'Sun', tempF: 79, icon: 'lightning' },
      { day: 'Mon', tempF: 83, icon: 'cloudy' },
      { day: 'Tue', tempF: 85, icon: 'sunny' },
      { day: 'Wed', tempF: 82, icon: 'rain' },
      { day: 'Thu', tempF: 80, icon: 'lightning' }
    ]
  },
  london: {
    name: 'London',
    tempF: 64,
    condition: 'Showers',
    humidity: 85,
    windSpeed: '15 mph',
    forecast: [
      { day: 'Sun', tempF: 66, icon: 'rain' },
      { day: 'Mon', tempF: 63, icon: 'rain' },
      { day: 'Tue', tempF: 65, icon: 'cloudy' },
      { day: 'Wed', tempF: 68, icon: 'sunny' },
      { day: 'Thu', tempF: 64, icon: 'cloudy' }
    ]
  },
  sydney: {
    name: 'Sydney',
    tempF: 54,
    condition: 'Windy',
    humidity: 50,
    windSpeed: '22 mph',
    forecast: [
      { day: 'Sun', tempF: 55, icon: 'cloudy' },
      { day: 'Mon', tempF: 52, icon: 'sunny' },
      { day: 'Tue', tempF: 50, icon: 'sunny' },
      { day: 'Wed', tempF: 53, icon: 'cloudy' },
      { day: 'Thu', tempF: 56, icon: 'sunny' }
    ]
  }
};

export default function WeatherApp({ onClose, accentClass }: WeatherAppProps) {
  const [selectedCity, setSelectedCity] = useState('seattle');
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentCity = WEATHER_DATA[selectedCity] || WEATHER_DATA.seattle;

  const toggleUnit = () => {
    setTempUnit(prev => prev === 'F' ? 'C' : 'F');
  };

  const convertTemp = (tempInF: number) => {
    if (tempUnit === 'F') return `${tempInF}°F`;
    const inC = Math.round((tempInF - 32) * 5 / 9);
    return `${inC}°C`;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const renderWeatherIcon = (condition: string, sizeClass = 'w-16 h-16') => {
    const term = condition.toLowerCase();
    if (term.includes('sunny') || term.includes('clear')) {
      return <Sun className={`${sizeClass} text-yellow-400`} />;
    }
    if (term.includes('rain') || term.includes('showers')) {
      return <CloudRain className={`${sizeClass} text-cyan-400`} />;
    }
    if (term.includes('snow')) {
      return <CloudSnow className={`${sizeClass} text-blue-200`} />;
    }
    if (term.includes('lightning') || term.includes('storm')) {
      return <CloudLightning className={`${sizeClass} text-purple-400`} />;
    }
    return <Cloud className={`${sizeClass} text-gray-400`} />;
  };

  return (
    <div className="h-full flex flex-col bg-black text-white p-6 select-none font-sans relative overflow-hidden">
      {/* App Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-light text-3xl tracking-tight uppercase">WEATHER</h1>
          <p className="text-xs text-gray-400 font-mono tracking-wider">LIVE FORECAST WIDGET</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={toggleUnit}
            className="px-3 py-1 border border-zinc-700 hover:border-white transition-colors text-xs font-mono"
          >
            UNIT: °{tempUnit}
          </button>
          <button 
            onClick={onClose}
            className="px-3 py-1 border border-white hover:bg-white hover:text-black transition-colors text-xs font-mono"
          >
            BACK
          </button>
        </div>
      </div>

      {/* City Selector Flat Hub */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-6 no-scrollbar border-b border-zinc-900 scroll-smooth">
        {Object.keys(WEATHER_DATA).map((key) => {
          const isSelected = key === selectedCity;
          return (
            <button
              key={key}
              onClick={() => setSelectedCity(key)}
              className={`px-4 py-2 border text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all ${
                isSelected 
                  ? 'border-cyan-400 bg-cyan-950/20 text-cyan-400 font-bold' 
                  : 'border-zinc-850 text-gray-400 hover:border-zinc-600 hover:text-white'
              }`}
            >
              {WEATHER_DATA[key].name}
            </button>
          );
        })}
      </div>

      {/* Main Temp Card */}
      <div className="flex-1 flex flex-col justify-between py-4 animate-[fadeIn_0.3s_ease-out]">
        <div className="flex flex-col items-center text-center">
          {/* Animated Weather Ring */}
          <div className="relative w-32 h-32 flex items-center justify-center mb-6">
            <div className={`absolute inset-0 border border-zinc-850 rounded-none ${isRefreshing ? 'animate-spin' : ''}`} />
            {renderWeatherIcon(currentCity.condition, 'w-20 h-20')}
          </div>

          <h2 className="text-4xl font-light tracking-wide">{currentCity.name}</h2>
          <p className="text-sm font-mono text-cyan-400 uppercase tracking-widest mt-1.5">{currentCity.condition}</p>
          <h3 className="text-7xl font-light mt-4 tracking-tighter">{convertTemp(currentCity.tempF)}</h3>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto w-full my-6 p-4 border border-zinc-850 bg-zinc-950 font-mono text-xs text-gray-400">
          <div className="flex flex-col gap-1">
            <span>HUMIDITY</span>
            <span className="text-sm font-bold text-white">{currentCity.humidity}%</span>
          </div>
          <div className="flex flex-col gap-1">
            <span>WIND SPEED</span>
            <span className="text-sm font-bold text-white">{currentCity.windSpeed}</span>
          </div>
        </div>

        {/* 5-Day Horizontal Forecast Grid */}
        <div className="border-t border-zinc-900 pt-6">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-gray-500 uppercase">
            <span>5-Day Forecast</span>
            <button onClick={handleRefresh} className="p-1 hover:text-white flex items-center gap-1 active:scale-95">
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>SYNC</span>
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {currentCity.forecast.map((fc, idx) => (
              <div key={idx} className="p-3 border border-zinc-850 bg-zinc-950 flex flex-col items-center text-center gap-2">
                <span className="text-[10px] font-mono text-gray-500 uppercase">{fc.day}</span>
                {renderWeatherIcon(fc.icon, 'w-6 h-6')}
                <span className="text-xs font-bold font-mono">{convertTemp(fc.tempF).split('°')[0]}°</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
