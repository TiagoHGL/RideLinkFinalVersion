import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles } from '@/contexts/ThemeContext';

interface SafeAreaWrapperProps {
  children: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: any;
}

export function SafeAreaWrapper({ 
  children, 
  edges = ['top', 'bottom', 'left', 'right'],
  style 
}: SafeAreaWrapperProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  const safeAreaStyle = {
    paddingTop: edges.includes('top') ? Math.max(insets.top, Platform.OS === 'android' ? 24 : 0) : 0,
    paddingBottom: edges.includes('bottom') ? Math.max(insets.bottom, 0) : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.container, safeAreaStyle, style]}>
      {children}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});