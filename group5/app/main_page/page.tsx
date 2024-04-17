"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
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

  // Varaibles used throughout the page, as well as their setters
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [savedLocations, setSavedLocations] = useState<any[]>([]);

  // username grabbed from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('username');

  // if username is null, redirect to login page
  if (username === null) {
    window.location.href = '/';
  }

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${searchTerm}.json?access_token=${mapboxgl.accessToken}`);
      if (!response.ok) {
        throw new Error('Failed to fetch location data.');
      }
      const data = await response.json();
      if (data.features.length === 0) {
        throw new Error('Location not found.');
      }
      const longitude = data.features[0].center[0];
      const latitude = data.features[0].center[1];
      
      setLocationData({ latitude, longitude });
      setErrorMessage(null);
      getWeather(latitude, longitude);
      
      if (map) {
        map.flyTo({
          center: [longitude, latitude],
          essential: true, // animate the transition
          zoom: 13
        });
      }

      } catch (error) {
      console.log(error);
    }
  };

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
          if (map) {
            map.flyTo({
              center: [longitude, latitude],
              essential: true, // animate the transition
              zoom: 13
            });
          }
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

  const getWeatherDataAndMove = async (latitude: number, longitude: number) => {
    setLocationData({ latitude, longitude });
    setErrorMessage(null);
    getWeather(latitude, longitude);
    if (map) {
      map.flyTo({
        center: [longitude, latitude],
        essential: true, // animate the transition
        zoom: 13
      });
    }
  
  }
  const addCurrentLocation = async () => {
    if (locationData) {
      // Send a request to your backend API to add the current location to the user
      try {
        const response = await fetch('http://localhost:5000/add_location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username,
            latitude: locationData.latitude,
            longitude: locationData.longitude
          })
        });
        if (!response.ok) {
          throw new Error('Failed to add location.');
        }
        console.log('Location added successfully');
        // Optionally, you can provide feedback to the user here
      } catch (error) {
        console.error('Error adding location:', error);
        // Optionally, you can provide feedback to the user here
      }
    } else {
      console.error('Location data is not available');
      // Optionally, you can provide feedback to the user here
    }
  };


  const getSavedLocations = async () => {
    try {
      const response = await fetch('http://localhost:5000/get_locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch saved locations');
      }
  
      const savedLocations = await response.json();
  
      // Fetch location names for each saved location
      const locationsWithNames = await Promise.all(
        savedLocations.map(async (location: number[]) => {
          try {
            const locationName = await reverseGeocode(location[0], location[1]);
            return [...location, locationName]; // Append location name to the location array
          } catch (error) {
            console.error('Error fetching location name:', error);
            return [...location, 'Location Name Unavailable']; // Provide a placeholder if location name cannot be fetched
          }
        })
      );
  
      setSavedLocations(locationsWithNames);
      console.log('Saved locations:', locationsWithNames);
    } catch (error) {
      console.error('Error fetching saved locations:', error);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxgl.accessToken}`);
    if (!response.ok) {
      throw new Error('Failed to reverse geocode coordinates.');
    }
    const data = await response.json();
    if (data.features.length === 0) {
      throw new Error('Location not found.');
    }
    // Assuming the city and state are in the first place of the returned features
    const city = data.features[0].context.find((context: any) => context.id.startsWith('place')).text;
    const state = data.features[0].context.find((context: any) => context.id.startsWith('region')).text;
    return `${city}, ${state}`;
  };


  useEffect(() => {
    getLocation(); // Fetch location when the component mounts
    getSavedLocations();
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

      // Set the map to the state
      setMap(map);
    };

    if (locationData && !map) {
      initializeMap();
    }
  }, [locationData]);

  return (
    <div>
      <div className="container">
        <div className="weather_container">
          <h1>Weather App</h1>
          <h3>Welcome, {username}</h3>
          <button onClick={getLocation}>Home</button>
          <button onClick={addCurrentLocation}>Add Current Location</button>
          {errorMessage && <p>{errorMessage}</p>}
          {locationData && (
            <div>
              <h2>Location Information</h2>
              <p>Latitude: {locationData.latitude}</p>
              <p>Longitude: {locationData.longitude}</p>
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
      </div>
      <div className='search_container'>
        <form onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Enter location..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button type="submit">Search</button>
        </form>
      </div>
      <div className='locations_container'>
        <h2>Saved Locations</h2>
        <ul>
          {savedLocations.map((location, index) => (
          <li key={index} onClick={() => getWeatherDataAndMove(location[0], location[1])}>
             {location[2]}
          </li>
        ))}
        </ul>
      </div>
      <div id="map" className="map-container"></div> {/* Map container */}
    </div>
  );
}

export default Page;