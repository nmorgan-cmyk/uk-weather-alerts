import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, MapPin, Bell, Plus, X, RefreshCw } from 'lucide-react';

export default function WeatherAlerts() {
  const [locations, setLocations] = useState([
    { id: 1, name: 'London', lat: 51.5074, lon: -0.1278 },
    { id: 2, name: 'Manchester', lat: 53.4808, lon: -2.2426 }
  ]);
  const [weatherData, setWeatherData] = useState({});
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Fetch weather for all locations
  const fetchWeather = async () => {
    setLoading(true);
    const newWeatherData = {};
    const newAlerts = [];

    for (const loc of locations) {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code,cloud_cover&timezone=Europe/London`
        );
        const data = await response.json();
        
        const weather = {
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
          cloudCover: data.current.cloud_cover,
          isBlueSky: isBlueSkyDay(data.current.weather_code, data.current.cloud_cover)
        };
        
        newWeatherData[loc.id] = weather;
        
        // Check for blue sky alert
        if (weather.isBlueSky) {
          newAlerts.push({
            id: loc.id,
            location: loc.name,
            temp: weather.temp,
            cloudCover: weather.cloudCover
          });
        }
      } catch (error) {
        console.error(`Error fetching weather for ${loc.name}:`, error);
      }
    }

    setWeatherData(newWeatherData);
    setAlerts(newAlerts);
    setLoading(false);
  };

  // Determine if it's a blue sky day
  const isBlueSkyDay = (weatherCode, cloudCover) => {
    // Weather codes: 0-1 = clear/mainly clear, cloud cover < 30%
    return weatherCode <= 1 && cloudCover < 30;
  };

  // Get weather icon and description
  const getWeatherInfo = (code) => {
    if (code === 0) return { icon: Sun, desc: 'Clear sky', color: 'text-yellow-500' };
    if (code === 1) return { icon: Sun, desc: 'Mainly clear', color: 'text-yellow-400' };
    if (code <= 3) return { icon: Cloud, desc: 'Cloudy', color: 'text-gray-400' };
    return { icon: CloudRain, desc: 'Rain', color: 'text-blue-400' };
  };

  // Add new location (simplified - in real app would geocode the name)
  const addLocation = () => {
    if (!newLocation.trim()) return;
    
    // Simple UK cities database
    const ukCities = {
      'birmingham': { lat: 52.4862, lon: -1.8904 },
      'leeds': { lat: 53.8008, lon: -1.5491 },
      'glasgow': { lat: 55.8642, lon: -4.2518 },
      'liverpool': { lat: 53.4084, lon: -2.9916 },
      'edinburgh': { lat: 55.9533, lon: -3.1883 },
      'bristol': { lat: 51.4545, lon: -2.5879 },
      'cardiff': { lat: 51.4816, lon: -3.1791 },
      'brighton': { lat: 50.8225, lon: -0.1372 },
      'oxford': { lat: 51.7520, lon: -1.2577 },
      'cambridge': { lat: 52.2053, lon: 0.1218 }
    };

    const cityKey = newLocation.toLowerCase().trim();
    if (ukCities[cityKey]) {
      const newLoc = {
        id: Date.now(),
        name: newLocation.charAt(0).toUpperCase() + newLocation.slice(1).toLowerCase(),
        ...ukCities[cityKey]
      };
      setLocations([...locations, newLoc]);
      setNewLocation('');
    } else {
      alert('City not found. Try: Birmingham, Leeds, Glasgow, Liverpool, Edinburgh, Bristol, Cardiff, Brighton, Oxford, or Cambridge');
    }
  };

  const removeLocation = (id) => {
    setLocations(locations.filter(loc => loc.id !== id));
    const newData = { ...weatherData };
    delete newData[id];
    setWeatherData(newData);
  };

  useEffect(() => {
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [locations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sun className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-800">UK Blue Sky Alerts</h1>
            </div>
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <p className="text-gray-600">Get notified when there are beautiful clear days in your favorite UK locations</p>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-6 h-6 text-white animate-pulse" />
              <h2 className="text-2xl font-bold text-white">Blue Sky Alert!</h2>
            </div>
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-white bg-opacity-90 rounded-lg p-4">
                  <p className="text-gray-800 font-semibold text-lg">
                    ☀️ Beautiful conditions in {alert.location}!
                  </p>
                  <p className="text-gray-600">
                    {alert.temp}°C • {alert.cloudCover}% cloud cover
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Location */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add Location</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLocation()}
              placeholder="Enter UK city name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addLocation}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Try: Birmingham, Leeds, Glasgow, Liverpool, Edinburgh, Bristol, Cardiff, Brighton, Oxford, Cambridge
          </p>
        </div>

        {/* Locations Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {locations.map(loc => {
            const weather = weatherData[loc.id];
            const weatherInfo = weather ? getWeatherInfo(weather.code) : null;
            const WeatherIcon = weatherInfo?.icon || Cloud;

            return (
              <div
                key={loc.id}
                className={`bg-white rounded-xl shadow-lg p-6 transition-all ${
                  weather?.isBlueSky ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-800">{loc.name}</h3>
                  </div>
                  <button
                    onClick={() => removeLocation(loc.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {weather ? (
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <WeatherIcon className={`w-12 h-12 ${weatherInfo.color}`} />
                      <div>
                        <p className="text-4xl font-bold text-gray-800">{weather.temp}°C</p>
                        <p className="text-gray-600">{weatherInfo.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Cloud cover: {weather.cloudCover}%</span>
                      {weather.isBlueSky && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
                          Blue Sky Day!
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">Loading...</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 text-sm text-gray-600">
          <p className="font-semibold mb-2">About Blue Sky Days:</p>
          <p>A blue sky day is defined as clear or mainly clear conditions with less than 30% cloud cover. Perfect for outdoor activities, photography, or simply enjoying the British sunshine!</p>
        </div>
      </div>
    </div>
  );
}