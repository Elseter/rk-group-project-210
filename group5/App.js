import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import WeatherApp from './components/WeatherApp';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/weather" component={WeatherApp} />
      </Switch>
    </Router>
  );
};

export default App;
