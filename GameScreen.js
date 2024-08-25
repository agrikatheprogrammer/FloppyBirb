import React, { useEffect, useState } from 'react';
import { useWindowDimensions, StyleSheet, View, Pressable, Image as RNImage } from 'react-native';
import { Canvas, useImage, Image, Group } from '@shopify/react-native-skia';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme } from './contexts/ThemeContext'; // Import the hook
import { useSharedValue, withTiming, Easing, withSequence, withRepeat, useFrameCallback, interpolate, Extrapolation, useDerivedValue } from 'react-native-reanimated';

const GRAVITY = 1000;
const JUMP_SENSITIVITY = -500;

// Import images
const lightIcon = require('./assets/lighticon.png');
const darkIcon = require('./assets/darkicon.png');

const GameScreen = () => {
  const { width, height } = useWindowDimensions();
  const { theme, toggleTheme } = useTheme(); // Destructure theme and toggleTheme

  const [bgKey, setBgKey] = useState(Date.now()); // Key to force re-render
  const [buttonImage, setButtonImage] = useState(lightIcon); // Default image
  const bg = useImage(theme.backgroundImage);

  // Update background key to force re-render when backgroundImage changes
  useEffect(() => {
    setBgKey(Date.now());
  }, [theme.backgroundImage]);

  // Update button image based on theme
  useEffect(() => {
    var newImage=null
    if (theme.backgroundImage==1) {
      newImage=darkIcon
    } else {
      newImage=lightIcon
    }
    setButtonImage(newImage);
  }, [theme.backgroundImage]); // Update when theme changes

  const bird = useImage(require('./assets/BirdSpriteUpWay.png'));
  const pipe = useImage(require('./assets/pipe-red.png'));
  const pipeTop = useImage(require('./assets/pipe-red_upside.png'));
  const road = useImage(require('./assets/road.png'));

  const pipeOffset = 0;
  const x = useSharedValue(width);
  const birdY = useSharedValue(height / 2.5);
  const birdYVelocity = useSharedValue(0);
  const birdTransform = useDerivedValue(() => {
    return [{ rotate: interpolate(birdYVelocity.value, [-500, 500], [-0.5, 0.5], Extrapolation.CLAMP) }];
  });
  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + 30, y: birdY.value + 25 };
  });

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt) {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(-150, { duration: 3000, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ),
      -1
    );
  }, []);

  const gesture = Gesture.Tap().onStart(() => {
    birdYVelocity.value = JUMP_SENSITIVITY;
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Game Canvas */}
        <GestureDetector gesture={gesture}>
          <Canvas style={{ width, height }}>
            <Image image={bg} width={width} height={height} fit={'fill'} key={bgKey} />
            <Image image={pipeTop} y={pipeOffset - 320} x={x} width={103} height={640} />
            <Image image={road} width={width} height={100} y={height - 82} x={0} fit={'cover'} />
            <Image image={pipe} y={height - 320 + pipeOffset} x={x} width={103} height={640} />
            <Group transform={birdTransform} origin={birdOrigin}>
              <Image image={bird} y={birdY} x={120} width={60} height={50} />
            </Group>
          </Canvas>
        </GestureDetector>

        {/* Pressable Button */}
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
});


export default GameScreen;
