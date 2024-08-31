import React, { useEffect, useState } from 'react';
import { useWindowDimensions, StyleSheet, View, Pressable, Image as RNImage, Text} from 'react-native';
import { Canvas, useImage, Image, Group} from '@shopify/react-native-skia';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme } from './contexts/ThemeContext'; // Import the hook
import { useSharedValue, withTiming, Easing, withSequence, withRepeat, useFrameCallback, interpolate, Extrapolation, useDerivedValue, useAnimatedReaction, runOnJS, getAnimatedStyle, cancelAnimation} from 'react-native-reanimated';

const GRAVITY = 1000;
const JUMP_SENSITIVITY = -500;

const GameScreen = () => {
  const { width, height } = useWindowDimensions();
  const { theme, toggleTheme } = useTheme(); // Destructure theme and toggleTheme
  const [score,setScore]=useState(0)

  const [bgKey, setBgKey] = useState(Date.now()); // Key to force re-render
  const [buttonImage, setButtonImage] = useState(require('./assets/darkicon.png')); // Default image
  const bg = useImage(theme.backgroundImage);

  const birdPos={x:width/4,};

  // Update background key to force re-render when backgroundImage changes
  useEffect(() => {
    setBgKey(Date.now());
  }, [theme.backgroundImage]);

  // Update button image based on theme
  useEffect(() => {
    var newImage=null
    if (theme.backgroundImage==1) {
      newImage=require('./assets/darkicon.png');
    } else {
      newImage=require('./assets/lighticon.png');
    }
    setButtonImage(newImage);
  }, [theme.backgroundImage]); // Update when theme changes

  const bird = useImage(require('./assets/BirdSpriteUpWay.png'));
  const pipe = useImage(require('./assets/pipe-red.png'));
  const pipeTop = useImage(require('./assets/pipe-red_upside.png'));
  const road = useImage(require('./assets/road.png'));

  const pipeWidth = 103;
  const pipeHeight = 640;
  const pipeOffset = useSharedValue(0);
  const topY=useDerivedValue(()=>pipeOffset.value-320);
  const bottomY=useDerivedValue(()=>height-320+pipeOffset.value);
  const gameOver=useSharedValue(false);
  const pipeX = useSharedValue(width);
  const birdY = useSharedValue(height / 2.5);
  const birdYVelocity = useSharedValue(0);

  const obstacles = useDerivedValue(() => [
    // bottom pipe
    {
      x: pipeX.value,
      y: bottomY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
    // top pipe
    {
      x: pipeX.value,
      y: topY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
  ]);

  useEffect(() => {
    moveTheMap();
  }, []);

  const moveTheMap =()=>{
    pipeX.value = withRepeat(
      withSequence(
        withTiming(-150, { duration: 3000, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ),
      -1
    );
  }

  useAnimatedReaction(
    ()=>pipeX.value
    ,
    (currentValue,previousValue)=>{
      const mid=birdPos.x;
      if (currentValue!=previousValue && previousValue>mid&&currentValue<=mid){
        runOnJS(setScore)(score+1)
      }
    }
  )

  const isPointCollidingWithRect = (point, rect) => {
    'worklet';
    return (
      point.x >= rect.x && // right of the left edge AND
      point.x <= rect.x + rect.w && // left of the right edge AND
      point.y >= rect.y && // below the top AND
      point.y <= rect.y + rect.h // above the bottom
    );
  };

  useAnimatedReaction(()=> birdY.value,
  (currentValue,previousValue)=>{
    const center = {
      x: birdPos.x + 30,
      y: birdY.value + 25,
    };

    // Ground & sky collision detection
    if (currentValue > height - 80 || currentValue < 0) {
      gameOver.value = true;
    }

    const isColliding = obstacles.value.some((rect) =>
      isPointCollidingWithRect(center, rect)
    );

    if (isColliding) {
      gameOver.value = true;
    }
  }  
  )

  useAnimatedReaction(()=> gameOver.value,
  (currentValue,previousValue)=>{
    if (currentValue&&!previousValue){
      cancelAnimation(pipeX)
    }
  }  
  )

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value) {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  const restartGame = () => {
    'worklet';
    birdY.value = height / 2.5;
    birdYVelocity.value = 0;
    gameOver.value = false;
    pipeX.value = width;
    runOnJS(moveTheMap)();
    runOnJS(setScore)(0);
  };

  const gesture = Gesture.Tap().onStart(() => {
    if (gameOver.value) 
      restartGame();
    else   
      birdYVelocity.value = JUMP_SENSITIVITY;
  });

  const birdTransform = useDerivedValue(() => {
    return [{ rotate: interpolate(birdYVelocity.value, [-500, 500], [-0.5, 0.5], Extrapolation.CLAMP) }];
  });
  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + 30, y: birdY.value + 25 };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Game Canvas */}
        <GestureDetector gesture={gesture}>
          <Canvas style={{ width, height }}>
            
            <Image image={bg} width={width} height={height} fit={'fill'} key={bgKey} />
            <Image image={pipeTop} y={topY} x={pipeX} width={pipeWidth} height={pipeHeight} />
            <Image image={road} width={width} height={100} y={height - 82} x={0} fit={'fill'} />
            <Image image={pipe} y={bottomY} x={pipeX} width={pipeWidth} height={pipeHeight} />
            <Group transform={birdTransform} origin={birdOrigin}>
              <Image image={bird} y={birdY} x={birdPos.x} width={60} height={50} />
            </Group> 
          </Canvas>
        </GestureDetector>

        {/* Score Text */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>

        {/* Pressable Button To Toggle Theme */}
        <Pressable style={styles.buttonContainer} onPress={toggleTheme}>
          <RNImage
            source={buttonImage}
            style={styles.buttonImage}
            fit={'fill'}
          />
        </Pressable>
        
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    top: 50, // Distance from the top of the screen
    right: 25, // Distance from the right of the screen
    zIndex: 1, // Ensure the button is above other components
  },
  buttonImage: {
    width: 58, // Adjust width as needed
    height: 25, // Adjust height as needed
    borderRadius: 15, // Oval shape
  },
  scoreContainer: {
    position: 'absolute',
    top: 50, // Distance from the top of the screen
    left: '55%', // Center horizontally
    transform: [{ translateX: -50 }], // Center horizontally
    zIndex: 1, // Ensure the text is above other components
  },
  scoreText: {
    fontSize: 40, // font size
    color: 'black', // text color
    fontWeight: 'bold',
  },
});


export default GameScreen;
