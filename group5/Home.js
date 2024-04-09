import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Welcome to Weather App</h1>
      <p>Get current weather information for your location.</p>
      <Link to="/weather">Go to Weather App</Link>
    </div>
  );
};

export default Home;
