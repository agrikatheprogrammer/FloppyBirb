import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import GameScreen from './GameScreen';

const App = () => (
  <ThemeProvider>
    <GameScreen />
  </ThemeProvider>
);

export default App;
