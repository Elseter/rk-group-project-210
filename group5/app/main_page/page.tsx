"use client";
import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';


// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoicmtpbmczNDI1IiwiYSI6ImNsdXZubnNjeTA1N2wybG90MGdybjdqc2UifQ.cYnE4YkUPPTBM-4uvTlyMQ';
const api_Key = 'bba90656b0dc4ae2996162721241104';

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

const defaultLatitude = 0; // Default latitude value
const defaultLongitude = 0; // Default longitude value

const Page: React.FC = () => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const getWeather = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${api_Key}&q=${latitude},${longitude}&aqi=no`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch weather data.');
      }
      const data = await response.json();
      const newWeatherData: WeatherData = {
        location: data.location.name,
        temperature_c: data.current.temp_c,
        temperature_f: data.current.temp_f,
        icon: data.current.condition.icon,
      };
      setWeatherData(newWeatherData);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Error fetching weather data');
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setLocationData({ latitude, longitude });
          setErrorMessage(null);
          getWeather(latitude, longitude);
        },
        (error) => {
          setErrorMessage(`Error getting location: ${error.message}`);
          // Set default latitude and longitude values
          setLocationData({ latitude: defaultLatitude, longitude: defaultLongitude });
          // Fetch weather data using default values
          getWeather(defaultLatitude, defaultLongitude);
        }
      );
    } else {
      setErrorMessage('Geolocation is not supported by this browser.');
      // Set default latitude and longitude values
      setLocationData({ latitude: defaultLatitude, longitude: defaultLongitude });
      // Fetch weather data using default values
      getWeather(defaultLatitude, defaultLongitude);
    }
  };

  useEffect(() => {
    getLocation(); // Fetch location when the component mounts
  }, []);

  useEffect(() => {
    // Initialize the map when the component mounts
    const initializeMap = () => {
      const map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
        center: [locationData?.longitude || 0, locationData?.latitude || 0], // starting position [lng, lat]
        zoom: 15 // starting zoom
      });

      // Add navigation controls to the map
      map.addControl(new mapboxgl.NavigationControl());

      if (locationData){
        new mapboxgl.Marker().setLngLat([locationData.longitude, locationData.latitude]).addTo(map);
      }

      map.on('dblclick', async (e) => {
        const { lng, lat } = e.lngLat;
        setLocationData({ latitude: lat, longitude: lng });
        try {
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${api_Key}&q=${lat},${lng}&aqi=no`
          );
          if (!response.ok) {
            throw new Error('Failed to fetch weather data.');
          }
          const data = await response.json();
          const newWeatherData: WeatherData = {
            location: data.location.name,
            temperature_c: data.current.temp_c,
            temperature_f: data.current.temp_f,
            icon: data.current.condition.icon,
          };
          setWeatherData(newWeatherData);
          setErrorMessage(null);
        } catch (error) {
          setErrorMessage('Error fetching weather data');
        }
      });

      const marker = new mapboxgl.Marker().setLngLat([43.2431, 76.9136]).addTo(map);

      // Set the map to the state
      setMap(map);
    };

    if (locationData) {
      initializeMap();
    }
  }, [locationData]);

  return (
    <div>
      <div className="container">
        <h1>Weather App</h1>
        <button onClick={getLocation}>Get Location</button>
        {errorMessage && <p>{errorMessage}</p>}
        {locationData && (
          <div>
            <h2>Location Information</h2>
            <p>Latitude: {locationData.latitude.toFixed(4)}</p>
            <p>Longitude: {locationData.longitude.toFixed(4)}</p>
          </div>
        )}
        {weatherData && (
          <div>
            <h2>Weather Information</h2>
            <p>Location: {weatherData.location}</p>
            <p>Temperature (C): {weatherData.temperature_c}</p>
            <p>Temperature (F): {weatherData.temperature_f}</p>
            <img src={weatherData.icon} alt="Weather icon" />
          </div>
        )}
      </div>
      <div id="map" className="map-container"></div> {/* Map container */}
    </div>
  );
}

export default Page;