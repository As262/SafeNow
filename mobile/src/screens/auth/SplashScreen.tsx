import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { colors, fontSize } from '../../styles/theme';

type SplashScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const fadeAnim = new Animated.Value(1);
  const scaleAnim = new Animated.Value(0.8);
  const bounce1 = new Animated.Value(0);
  const bounce2 = new Animated.Value(0);
  const bounce3 = new Animated.Value(0);

  useEffect(() => {
    // Scale up animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Bounce animations for dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce1, {
          toValue: -10,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(bounce1, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce2, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bounce2, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 150);

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounce3, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bounce3, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 300);

    // Fade out and navigate
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 800);

    setTimeout(() => {
      navigation.replace('Login');
    }, 1200);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[colors.dark[950], colors.dark[900], colors.dark[950]]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Animated Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary[500], colors.primary[700]]}
              style={styles.logoGradient}
            >
              <Shield color="#fff" size={80} strokeWidth={2} />
            </LinearGradient>
          </Animated.View>

          {/* App Name */}
          <Text style={styles.title}>SafeNow</Text>

          {/* Tagline */}
          <Text style={styles.subtitle}>Your Safety, Our Priority</Text>

          {/* Loading Dots */}
          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [{ translateY: bounce1 }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [{ translateY: bounce2 }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [{ translateY: bounce3 }],
                },
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoGradient: {
    width: 128,
    height: 128,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary[500],
    marginBottom: 12,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.dark[400],
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
});

export default SplashScreen;
