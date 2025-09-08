import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

interface ConfettiProps {
  trigger: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Confetti: React.FC<ConfettiProps> = ({ trigger }) => {
  const particles = useRef<Animated.ValueXY[]>([]);
  const opacities = useRef<Animated.Value[]>([]);
  const rotations = useRef<Animated.Value[]>([]);

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const particleCount = 50;

  useEffect(() => {
    // Initialize particles
    particles.current = Array.from({ length: particleCount }, () => new Animated.ValueXY({ x: 0, y: 0 }));
    opacities.current = Array.from({ length: particleCount }, () => new Animated.Value(1));
    rotations.current = Array.from({ length: particleCount }, () => new Animated.Value(0));
  }, []);

  useEffect(() => {
    if (trigger > 0) {
      startConfetti();
    }
  }, [trigger]);

  const startConfetti = () => {
    const animations = particles.current.map((particle, index) => {
      const startX = Math.random() * screenWidth;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = screenHeight + 100;

      particle.setValue({ x: startX, y: -20 });
      opacities.current[index].setValue(1);
      rotations.current[index].setValue(0);

      return Animated.parallel([
        Animated.timing(particle, {
          toValue: { x: endX, y: endY },
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: false,
        }),
        Animated.timing(opacities.current[index], {
          toValue: 0,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: false,
        }),
        Animated.timing(rotations.current[index], {
          toValue: 360 * (2 + Math.random() * 3),
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: false,
        }),
      ]);
    });

    Animated.stagger(50, animations).start();
  };

  if (trigger === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle, index) => {
        const color = colors[index % colors.length];
        const size = 6 + Math.random() * 4;
        
        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                backgroundColor: color,
                width: size,
                height: size,
                borderRadius: size / 2,
                opacity: opacities.current[index],
                transform: [
                  { translateX: particle.x as any },
                  { translateY: particle.y as any },
                  {
                    rotate: rotations.current[index].interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
  },
});

export default Confetti;
export { Confetti };