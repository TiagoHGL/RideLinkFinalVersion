import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';

interface RideAppButtonProps {
  appName: string;
  icon: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function RideAppButton({ appName, icon, color, onPress, disabled = false }: RideAppButtonProps) {
  const { t } = useLanguage();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.button,
        { backgroundColor: disabled ? '#e5e7eb' : color },
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.8}
    >
      <View style={styles.content}>
        <Text style={[styles.icon, { opacity: disabled ? 0.5 : 1 }]}>{icon}</Text>
        <Text style={[styles.text, { color: disabled ? '#9ca3af' : '#ffffff' }]}>
          {t('main.openIn')} {appName}
        </Text>
      </View>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 56,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: Math.min(screenWidth * 0.06, 24),
    marginRight: 12,
  },
  text: {
    fontFamily: 'Inter-SemiBold',
    fontSize: Math.min(screenWidth * 0.04, 16),
    textAlign: 'center',
  },
});