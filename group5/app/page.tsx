import React, { useState } from 'react';

interface WeatherData {
  location: string;
  temperature_c: number;
  temperature_f: number;
  icon: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
}



const api_Key = 'bba90656b0dc4ae2996162721241104';

const Page: React.FC<{ locationData: LocationData; weatherData: WeatherData; }> = ({ locationData, weatherData}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getWeather = async () => {
    if (!locationData) {
      setErrorMessage('Location data is not available.');
      return;
    }
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${api_Key}&q=${locationData.latitude},${locationData.longitude}&aqi=no`
      );
      const data = await response.json();
      weatherData = {
        location: data.location.name,
        temperature_c: data.current.temp_c,
        temperature_f: data.current.temp_f,
        icon: data.current.condition.icon,
      };
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Error fetching weather data.');
    }
  };

  const getLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setErrorMessage(null);
        },
        (error) => {
          setErrorMessage(`Error: ${error.message}`);
        }
      );
    } else {
      setErrorMessage('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div>
      <h1>Weather App</h1>
      {/* Wrap the buttons with dynamic imports */}
      {typeof window !== 'undefined' && (
        <button onClick={getLocation}>Get Location</button>
      )}
      {typeof window !== 'undefined' && (
        <button onClick={getWeather}>Get Weather</button>
      )}
      {errorMessage && <p>{errorMessage}</p>}
      {weatherData && (
        <div>
          <h2>{weatherData.location}</h2>
          <p>{weatherData.temperature_c}°C</p>
          <p>{weatherData.temperature_f}°F</p>
          <img src={weatherData.icon} alt="weather icon" />
        </div>
      )}
    </div>
  );
}

export default Page;
