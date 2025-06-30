import 'react-native-get-random-values';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AutoFillProvider } from '@/contexts/AutoFillContext';

SplashScreen.preventAutoHideAsync();

// Global error handlers
if (Platform.OS === 'web') {
  // Handle unhandled promise rejections on web
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
    console.error('Promise:', event.promise);
    console.error('Stack trace:', event.reason?.stack || 'No stack trace available');
    
    // Prevent the default browser behavior
    event.preventDefault();
    
    // Show user-friendly error message
    const errorMessage = event.reason?.message || event.reason?.toString() || 'Unknown error occurred';
    console.warn('User-friendly error:', errorMessage);
  });

  // Handle uncaught errors on web
  window.addEventListener('error', (event) => {
    console.error('🚨 Uncaught Error:', event.error);
    console.error('Message:', event.message);
    console.error('Filename:', event.filename);
    console.error('Line:', event.lineno);
    console.error('Column:', event.colno);
  });
} else {
  // Handle unhandled promise rejections on mobile
  const originalHandler = global.ErrorUtils?.getGlobalHandler?.();
  
  global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    console.error('🚨 Global Error Handler:', error);
    console.error('Is Fatal:', isFatal);
    console.error('Stack trace:', error?.stack || 'No stack trace available');
    
    // Call original handler if it exists
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Request location permission on app startup with proper error handling
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'web') {
          // For web, we'll handle geolocation permission when needed
          console.log('🌐 Web platform - location permission will be requested when needed');
          return;
        }

        console.log('📍 Requesting location permission on app startup...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          console.log('✅ Location permission granted');
          
          // Optionally get current location silently in background
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
              timeout: 10000,
              maximumAge: 30000,
            });
            console.log('📍 Initial location obtained:', {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            });
          } catch (locationError) {
            console.log('⚠️ Could not get initial location:', locationError);
            // Don't throw here, just log the error
          }
        } else {
          console.warn('❌ Location permission denied');
        }
      } catch (error) {
        console.error('❌ Error requesting location permission:', error);
        // Don't throw here, just log the error
      }
    };

    // Execute with proper error handling
    requestLocationPermission().catch((error) => {
      console.error('❌ Failed to request location permission:', error);
    });
  }, []);

  useEffect(() => {
    const hideSplashScreen = async () => {
      try {
        if (fontsLoaded || fontError) {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('❌ Error hiding splash screen:', error);
        // Continue anyway, don't block the app
      }
    };

    hideSplashScreen().catch((error) => {
      console.error('❌ Failed to hide splash screen:', error);
    });
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AutoFillProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </AutoFillProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}