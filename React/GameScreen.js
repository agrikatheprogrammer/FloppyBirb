import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from './contexts/ThemeContext';
import './GameScreen.css'; // Import CSS for styles

const GRAVITY = 1000;
const JUMP_SENSITIVITY = -500;

const GameScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const [score, setScore] = useState(0);
  const [birdY, setBirdY] = useState(window.innerHeight / 2.5);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [pipeX, setPipeX] = useState(window.innerWidth);
  const [backgroundKey, setBackgroundKey] = useState(Date.now());
  
  const birdRef = useRef();
  const pipeInterval = useRef(null);

  const birdSize = { width: 30, height: 25 };
  const pipeSize = { width: 53, height: 200 };

  useEffect(() => {
    const updateBackgroundKey = () => setBackgroundKey(Date.now());
    updateBackgroundKey();
  }, [theme.backgroundImage]);

  // Reset game
  const restartGame = () => {
    setBirdY(window.innerHeight / 2.5);
    setBirdVelocity(0);
    setIsGameOver(false);
    setPipeX(window.innerWidth);
    setScore(0);
    startPipeMovement();
  };

  // Pipe movement logic
  const startPipeMovement = () => {
    clearInterval(pipeInterval.current);
    pipeInterval.current = setInterval(() => {
      setPipeX((prev) => {
        if (prev <= -pipeSize.width) {
          setScore((prevScore) => prevScore + 1);
          return window.innerWidth;
        }
        return prev - 5;
      });
    }, 30);
  };

  useEffect(() => {
    startPipeMovement();
    return () => clearInterval(pipeInterval.current);
  }, []);

  // Game loop for bird movement
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isGameOver) {
        setBirdY((y) => y + (birdVelocity * 0.016) + (GRAVITY * 0.016 * 0.016));
        setBirdVelocity((v) => v + GRAVITY * 0.016);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [isGameOver, birdVelocity]);

  // Collision detection
  useEffect(() => {
    const birdRect = {
      x: window.innerWidth / 4,
      y: birdY,
      width: birdSize.width,
      height: birdSize.height,
    };
    const pipeRects = [
      // Top pipe
      {
        x: pipeX,
        y: -pipeSize.height / 2,
        width: pipeSize.width,
        height: pipeSize.height,
      },
      // Bottom pipe
      {
        x: pipeX,
        y: window.innerHeight - 200,
        width: pipeSize.width,
        height: pipeSize.height,
      },
    ];

    const isColliding = pipeRects.some((pipe) => {
      return (
        birdRect.x < pipe.x + pipe.width &&
        birdRect.x + birdRect.width > pipe.x &&
        birdRect.y < pipe.y + pipe.height &&
        birdRect.y + birdRect.height > pipe.y
      );
    });

    if (isColliding || birdY > window.innerHeight - 80 || birdY < 0) {
      setIsGameOver(true);
      clearInterval(pipeInterval.current);
    }
  }, [birdY, pipeX]);

  // Bird jump logic
  const handleJump = () => {
    if (isGameOver) {
      restartGame();
    } else {
      setBirdVelocity(JUMP_SENSITIVITY);
    }
  };

  return (
    <div className="game-container" style={{ backgroundImage: `url(${theme.backgroundImage})` }}>
      <div className="score">{score}</div>

      {/* Game canvas */}
      <div className="game-area" onClick={handleJump}>
        {/* Bird */}
        <img
          src="/assets/BirdSpriteUpWay.jpg"
          alt="Bird"
          className="bird"
          style={{ top: `${birdY}px`, left: `${window.innerWidth / 4}px` }}
          ref={birdRef}
        />

        {/* Pipes */}
        <img
          src="/assets/pipe-red_upside.jpg"
          alt="Top Pipe"
          className="pipe top-pipe"
          style={{ left: `${pipeX}px`, top: `-20px` }}
        />
        <img
          src="/assets/pipe-red.jpg"
          alt="Bottom Pipe"
          className="pipe bottom-pipe"
          style={{ left: `${pipeX}px`, bottom: `0px` }}
        />
      </div>

      {/* Toggle Theme Button */}
      <button className="theme-button" onClick={toggleTheme}>
        <img src={theme.backgroundImage === 1 ? '/assets/darkicon.jpg' : '/assets/lighticon.jpg'} alt="Toggle Theme" />
      </button>
    </div>
  );
};

export default GameScreen;
