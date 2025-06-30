import React from 'react';
import { Platform, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { MapPin, Star, Settings, User } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthGuard } from '@/components/AuthGuard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Types
interface TabConfig {
  name: string;
  titleKey: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  accessibilityLabelKey: string;
}

// Constants
const COLORS = {
  background: '#ffffff',
  border: '#e5e7eb',
  active: '#2563eb',
  inactive: '#6b7280',
  shadow: 'rgba(0, 0, 0, 0.1)',
} as const;

const TAB_CONFIG: TabConfig[] = [
  {
    name: 'index',
    titleKey: 'nav.rideLauncher',
    icon: MapPin,
    accessibilityLabelKey: 'nav.rideLauncher',
  },
  {
    name: 'favorites',
    titleKey: 'nav.favorites',
    icon: Star,
    accessibilityLabelKey: 'nav.favorites',
  },
  {
    name: 'profile',
    titleKey: 'nav.profile',
    icon: User,
    accessibilityLabelKey: 'nav.profile',
  },
  {
    name: 'settings',
    titleKey: 'nav.settings',
    icon: Settings,
    accessibilityLabelKey: 'nav.settings',
  },
];

// Utility function to get responsive dimensions
const getTabBarDimensions = (screenWidth: number, screenHeight: number, bottomInset: number) => {
  const isTablet = screenWidth >= 768;
  
  return {
    height: Platform.select({
      ios: isTablet ? 80 : 70,
      android: isTablet ? 75 : 65,
      default: 70,
    }) + bottomInset,
    paddingBottom: Math.max(bottomInset, Platform.select({
      ios: isTablet ? 12 : 8,
      android: isTablet ? 10 : 6,
      default: 8,
    })),
    paddingTop: Platform.select({
      ios: isTablet ? 12 : 8,
      android: isTablet ? 10 : 6,
      default: 8,
    }),
    fontSize: isTablet ? 14 : 12,
    iconSize: isTablet ? 26 : 22,
  };
};

// Custom hook for tab bar styling
const useTabBarStyles = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  return React.useMemo(() => {
    const dimensions = getTabBarDimensions(width, height, insets.bottom);
    
    return {
      tabBarStyle: {
        backgroundColor: COLORS.background,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        paddingBottom: dimensions.paddingBottom,
        paddingTop: dimensions.paddingTop,
        height: dimensions.height,
        // Enhanced shadow for better visual separation
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
      },
      tabBarLabelStyle: {
        fontSize: dimensions.fontSize,
        fontWeight: '600' as const,
        fontFamily: Platform.select({
          ios: 'System',
          android: 'Roboto-Medium',
          default: 'System',
        }),
      },
      iconSize: dimensions.iconSize,
    };
  }, [width, height, insets.bottom]);
};

// Tab icon component with error boundary
const TabIcon: React.FC<{
  IconComponent: React.ComponentType<{ size: number; color: string }>;
  size: number;
  color: string;
  accessibilityLabel: string;
}> = ({ IconComponent, size, color, accessibilityLabel }) => {
  try {
    return (
      <IconComponent 
        size={size} 
        color={color}
        accessibilityLabel={accessibilityLabel}
      />
    );
  } catch (error) {
    console.error('Tab icon render error:', error);
    // Fallback icon or empty view
    return null;
  }
};

export default function TabLayout() {
  const { t } = useLanguage();
  const { tabBarStyle, tabBarLabelStyle, iconSize } = useTabBarStyles();

  const screenOptions = React.useMemo(() => ({
    headerShown: false,
    tabBarStyle,
    tabBarActiveTintColor: COLORS.active,
    tabBarInactiveTintColor: COLORS.inactive,
    tabBarLabelStyle,
    // Enhanced accessibility
    tabBarAccessibilityLabel: 'Main navigation',
    tabBarHideOnKeyboard: Platform.OS === 'android',
    // Better animation
    tabBarAnimation: 'shift' as const,
    // Prevent tab bar from being affected by keyboard
    tabBarKeyboardHidesTabBar: false,
  }), [tabBarStyle, tabBarLabelStyle]);

  return (
    <AuthGuard requireAuth={true}>
      <Tabs screenOptions={screenOptions}>
        {TAB_CONFIG.map(({ name, titleKey, icon: IconComponent, accessibilityLabelKey }) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: t(titleKey),
              tabBarIcon: ({ size, color, focused }) => (
                <TabIcon
                  IconComponent={IconComponent}
                  size={focused ? iconSize + 2 : iconSize}
                  color={color}
                  accessibilityLabel={t(accessibilityLabelKey)}
                />
              ),
              tabBarAccessibilityLabel: t(accessibilityLabelKey),
              // Add badge support for future use
              tabBarBadge: undefined,
              // Improve touch target using TouchableOpacity instead of div
              tabBarButton: (props) => (
                <TouchableOpacity
                  {...props}
                  style={[
                    props.style,
                    {
                      minHeight: 44, // Ensure minimum touch target size
                      minWidth: 44,
                    }
                  ]}
                />
              ),
            }}
          />
        ))}
      </Tabs>
    </AuthGuard>
  );
}