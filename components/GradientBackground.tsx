import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: any;
}

export function GradientBackground({ children, style }: GradientBackgroundProps) {
  const { theme } = useTheme();
  
  return (
    <LinearGradient
      colors={[
        theme.colors.gradientStart,
        theme.colors.gradientMiddle,
        theme.colors.gradientEnd
      ]}
      style={[styles.gradient, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});