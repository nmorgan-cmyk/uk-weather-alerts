import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, MapPin, Bell, Plus, X, RefreshCw, Wind, Droplets, Eye, Search, Calendar, Sunrise, Sunset } from 'lucide-react';

export default function WeatherAlerts() {
  const [locations, setLocations] = useState([
    { id: 1, name: 'Lake District', lat: 54.4609, lon: -3.0886 },
    { id: 2, name: 'Snowdonia', lat: 53.0687, lon: -3.8758 }
  ]);
  const [weatherData, setWeatherData] = useState({});
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const fetchWeather = async () => {
    setLoading(true);
    const newWeatherData = {};
    const newAlerts = [];

    for (const loc of locations) {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,relative_humidity_2m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=Europe/London&forecast_days=3`
        );
        const data = await response.json();
        
        const current = {
          temp: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          code: data.current.weather_code,
          cloudCover: data.current.cloud_cover,
          windSpeed: Math.round(data.current.wind_speed_10m),
          windDirection: data.current.wind_direction_10m,
          humidity: data.current.relative_humidity_2m,
          uvIndex: data.current.uv_index,
          isBlueSky: isBlueSkyDay(data.current.weather_code, data.current.cloud_cover)
        };

        const forecast = data.daily.weather_code.map((code, idx) => ({
          date: new Date(data.daily.time[idx]),
          code: code,
          tempMax: Math.round(data.daily.temperature_2m_max[idx]),
          tempMin: Math.round(data.daily.temperature_2m_min[idx]),
          precipProb: data.daily.precipitation_probability_max[idx],
          windSpeed: Math.round(data.daily.wind_speed_10m_max[idx]),
          uvIndex: data.daily.uv_index_max[idx],
          isBlueSky: code <= 1
        }));
        
        newWeatherData[loc.id] = {
          current,
          forecast,
          lastUpdated: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        };
        
        // Check for blue sky alerts in next 3 days
        forecast.forEach((day, idx) => {
          if (day.isBlueSky) {
            newAlerts.push({
              id: `${loc.id}-${idx}`,
              location: loc.name,
              day: idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : day.date.toLocaleDateString('en-GB', { weekday: 'short' }),
              temp: day.tempMax,
              windSpeed: day.windSpeed
            });
          }
        });
      } catch (error) {
        console.error(`Error fetching weather for ${loc.name}:`, error);
      }
    }

    setWeatherData(newWeatherData);
    setAlerts(newAlerts);
    setLoading(false);
  };

  const searchLocation = async () => {
    if (!newLocation.trim()) return;
    
    setSearching(true);
    try {
      // Use Open-Meteo's geocoding API
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(newLocation)}&count=1&language=en&format=json`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        
        // Check if location already exists
        if (locations.some(loc => 
          Math.abs(loc.lat - result.latitude) < 0.01 && 
          Math.abs(loc.lon - result.longitude) < 0.01
        )) {
          alert('This location is already added!');
          setSearching(false);
          return;
        }
        
        const newLoc = {
          id: Date.now(),
          name: result.name + (result.admin1 ? `, ${result.admin1}` : ''),
          lat: result.latitude,
          lon: result.longitude
        };
        
        setLocations([...locations, newLoc]);
        setNewLocation('');
      } else {
        alert('Location not found. Try being more specific (e.g., "Scafell Pike", "Pembrokeshire Coast", "Ben Nevis")');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Error searching for location. Please try again.');
    }
    setSearching(false);
  };

  const isBlueSkyDay = (weatherCode, cloudCover) => {
    return weatherCode <= 1 && cloudCover < 30;
  };

  const getWeatherInfo = (code) => {
    if (code === 0) return { icon: Sun, desc: 'Clear sky', color: 'text-yellow-500', bg: 'from-yellow-400 to-orange-400' };
    if (code === 1) return { icon: Sun, desc: 'Mainly clear', color: 'text-yellow-400', bg: 'from-yellow-300 to-orange-300' };
    if (code === 2) return { icon: Cloud, desc: 'Partly cloudy', color: 'text-gray-400', bg: 'from-blue-200 to-gray-300' };
    if (code === 3) return { icon: Cloud, desc: 'Overcast', color: 'text-gray-500', bg: 'from-gray-300 to-gray-400' };
    if (code >= 45 && code <= 48) return { icon: Cloud, desc: 'Foggy', color: 'text-gray-400', bg: 'from-gray-200 to-gray-300' };
    if (code >= 51 && code <= 67) return { icon: CloudRain, desc: 'Rainy', color: 'text-blue-400', bg: 'from-blue-300 to-blue-500' };
    if (code >= 71 && code <= 77) return { icon: CloudRain, desc: 'Snowy', color: 'text-blue-300', bg: 'from-blue-100 to-blue-300' };
    if (code >= 80 && code <= 99) return { icon: CloudRain, desc: 'Showers', color: 'text-blue-500', bg: 'from-blue-400 to-blue-600' };
    return { icon: Cloud, desc: 'Cloudy', color: 'text-gray-400', bg: 'from-gray-300 to-gray-400' };
  };

  const getWindDirection = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getUVLevel = (uvIndex) => {
    if (uvIndex <= 2) return { level: 'Low', color: 'text-green-600' };
    if (uvIndex <= 5) return { level: 'Moderate', color: 'text-yellow-600' };
    if (uvIndex <= 7) return { level: 'High', color: 'text-orange-600' };
    if (uvIndex <= 10) return { level: 'Very High', color: 'text-red-600' };
    return { level: 'Extreme', color: 'text-purple-600' };
  };

  const removeLocation = (id) => {
    if (locations.length <= 1) {
      alert('You must keep at least one location!');
      return;
    }
    setLocations(locations.filter(loc => loc.id !== id));
    const newData = { ...weatherData };
    delete newData[id];
    setWeatherData(newData);
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [locations.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-2xl p-6 md:p-8 mb-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-2xl backdrop-blur-sm">
                <Sun className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Blue Sky Alerts</h1>
                <p className="text-blue-100 text-sm md:text-base">Perfect days for outdoor adventures</p>
              </div>
            </div>
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white rounded-xl transition disabled:opacity-50 text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-3xl shadow-xl p-6 mb-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-7 h-7 text-white" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">Blue Sky Days Ahead!</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-white bg-opacity-95 rounded-2xl p-4 shadow-lg">
                  <p className="text-gray-800 font-bold text-lg mb-1">
                    ☀️ {alert.location}
                  </p>
                  <p className="text-gray-600 font-medium">{alert.day}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {alert.temp}°C • Wind: {alert.windSpeed} km/h
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Location */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            Add Any Location
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                placeholder="Search any place (e.g., Snowdon, Durdle Door, Peak District...)"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
            <button
              onClick={searchLocation}
              disabled={searching}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition font-semibold shadow-lg disabled:opacity-50"
            >
              {searching ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            💡 Try: Mountains (Ben Nevis, Snowdon), Coasts (Jurassic Coast, Cornwall), Parks (Lake District, Yorkshire Dales)
          </p>
        </div>

        {/* Locations Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {locations.map(loc => {
            const weather = weatherData[loc.id];
            if (!weather) return null;

            const currentInfo = getWeatherInfo(weather.current.code);
            const CurrentIcon = currentInfo.icon;
            const uvInfo = getUVLevel(weather.current.uvIndex);

            return (
              <div key={loc.id} className="bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Location Header */}
                <div className={`bg-gradient-to-r ${currentInfo.bg} p-6 text-white relative`}>
                  <button
                    onClick={() => removeLocation(loc.id)}
                    className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm p-2 rounded-full transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-start gap-4">
                    <CurrentIcon className="w-16 h-16 drop-shadow-lg" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">{loc.name}</h3>
                      <p className="text-white text-opacity-90 text-lg">{currentInfo.desc}</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-5xl font-bold">{weather.current.temp}°</span>
                        <span className="text-xl opacity-80">feels {weather.current.feelsLike}°</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Details */}
                <div className="p-6 border-b border-gray-100">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <Wind className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Wind</p>
                      <p className="font-bold text-gray-800">{weather.current.windSpeed} km/h</p>
                      <p className="text-xs text-gray-500">{getWindDirection(weather.current.windDirection)}</p>
                    </div>
                    <div className="text-center">
                      <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Humidity</p>
                      <p className="font-bold text-gray-800">{weather.current.humidity}%</p>
                    </div>
                    <div className="text-center">
                      <Sun className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">UV Index</p>
                      <p className={`font-bold ${uvInfo.color}`}>{weather.current.uvIndex}</p>
                      <p className="text-xs text-gray-500">{uvInfo.level}</p>
                    </div>
                  </div>
                </div>

                {/* 3-Day Forecast */}
                <div className="p-6">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    3-Day Forecast
                  </h4>
                  <div className="space-y-3">
                    {weather.forecast.map((day, idx) => {
                      const dayInfo = getWeatherInfo(day.code);
                      const DayIcon = dayInfo.icon;
                      const dayLabel = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : day.date.toLocaleDateString('en-GB', { weekday: 'short' });
                      
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between p-4 rounded-2xl transition ${
                            day.isBlueSky ? 'bg-gradient-to-r from-yellow-50 to-orange-50 ring-2 ring-yellow-400' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <DayIcon className={`w-8 h-8 ${dayInfo.color}`} />
                            <div className="flex-1">
                              <p className="font-bold text-gray-800">{dayLabel}</p>
                              <p className="text-sm text-gray-600">{dayInfo.desc}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-800">
                              {day.tempMax}° <span className="text-sm text-gray-500">/ {day.tempMin}°</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              💨 {day.windSpeed} km/h • 💧 {day.precipProb}%
                            </p>
                            {day.isBlueSky && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-bold rounded-full">
                                BLUE SKY
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                  <p className="text-xs text-gray-400 text-center">
                    Last updated: {weather.lastUpdated}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 text-sm text-gray-600">
          <p className="font-semibold mb-2 text-gray-800">🌤️ About Blue Sky Days:</p>
          <p className="mb-3">Perfect conditions for hiking, climbing, photography, and outdoor adventures - clear skies with less than 30% cloud cover.</p>
          <p className="text-gray-500 text-xs">Weather data from Open-Meteo API • Updates every 30 minutes • Geocoding powered by Open-Meteo</p>
        </div>
      </div>
    </div>
  );
}