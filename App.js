import { registerRootComponent } from 'expo';
import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import GameScreen from './GameScreen';

const App = () => (
  <ThemeProvider>
    <GameScreen />
  </ThemeProvider>
);

// Register the main component
registerRootComponent(App);

export default App;
