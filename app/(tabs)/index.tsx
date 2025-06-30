import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Platform, 
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GooglePlacesInput } from '@/components/GooglePlacesInput';
import { RideAppButton } from '@/components/RideAppButton';
import { useRideApps } from '@/hooks/useRideApps';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { useAutoFill } from '@/contexts/AutoFillContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import * as Location from 'expo-location';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
}

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function RideLauncherScreen() {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { autoFillData, clearAutoFillData } = useAutoFill();
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pickupPlaceId, setPickupPlaceId] = useState<string | undefined>();
  const [showPickupSuccess, setShowPickupSuccess] = useState(false);
  
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationPlaceId, setDestinationPlaceId] = useState<string | undefined>();
  const [showDestinationSuccess, setShowDestinationSuccess] = useState(false);
  
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  
  const destinationInputRef = useRef<any>(null);
  
  // Use the reactive hook that automatically updates when app preferences change
  const { rideApps, openRideApp, isLoading } = useRideApps();

  // Animation values for feedback
  const pickupGlowAnimation = useSharedValue(0);
  const destinationGlowAnimation = useSharedValue(0);
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(50);

  // Check location permission and get current location on app start
  useEffect(() => {
    checkLocationPermissionAndGetLocation();
  }, []);

  // Handle auto-fill from favorites
  useEffect(() => {
    if (autoFillData) {
      console.log('🎯 Auto-filling from favorites:', autoFillData);
      
      let feedbackMessage = '';
      
      // Fill pickup if provided
      if (autoFillData.pickup) {
        setPickupAddress(autoFillData.pickup.address);
        setPickupCoords(autoFillData.pickup.coordinates || null);
        setPickupPlaceId(autoFillData.pickup.placeId);
        
        // Trigger pickup glow animation
        pickupGlowAnimation.value = withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 1500 })
        );
      }
      
      // Fill destination if provided
      if (autoFillData.destination) {
        setDestinationAddress(autoFillData.destination.address);
        setDestinationCoords(autoFillData.destination.coordinates || null);
        setDestinationPlaceId(autoFillData.destination.placeId);
        
        // Trigger destination glow animation
        destinationGlowAnimation.value = withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 1500 })
        );
      }
      
      // Show feedback message
      if (autoFillData.source === 'favorite-place') {
        feedbackMessage = '⭐ Destino preenchido com base no favorito selecionado';
      } else if (autoFillData.source === 'favorite-route') {
        feedbackMessage = '🛣️ Rota preenchida com base no favorito selecionado';
      }
      
      // Show toast feedback
      if (feedbackMessage) {
        showToastFeedback(feedbackMessage);
      }
      
      // Clear auto-fill data after processing
      clearAutoFillData();
    }
  }, [autoFillData]);

  const showToastFeedback = (message: string) => {
    // Show toast with animation
    toastOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 300 })
    );
    
    toastTranslateY.value = withSequence(
      withTiming(0, { duration: 300 }),
      withTiming(0, { duration: 1500 }),
      withTiming(50, { duration: 300 })
    );
  };

  const checkLocationPermissionAndGetLocation = async () => {
    if (Platform.OS === 'web') {
      // For web, we'll handle geolocation differently
      setLocationPermissionGranted(true);
      await getCurrentLocationSilently();
      return;
    }

    try {
      // Check if permission is already granted
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermissionGranted(true);
        // Get current location immediately if permission is already granted
        await getCurrentLocationSilently();
      } else {
        setLocationPermissionGranted(false);
      }
    } catch (error) {
      console.log('❌ Permission check error:', error);
      setLocationPermissionGranted(false);
    }
  };

  const getCurrentLocationSilently = async () => {
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });
            console.log('🌐 Current location obtained (web):', { 
              latitude, 
              longitude,
              accuracy: position.coords.accuracy 
            });
          },
          (error) => {
            console.log('⚠️ Silent location error (web):', error);
          },
          { 
            enableHighAccuracy: true, 
            timeout: 20000, 
            maximumAge: 10000 
          }
        );
      } else {
        if (!locationPermissionGranted) return;

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation, // Highest accuracy available
          timeout: 20000,
          maximumAge: 10000,
        });

        const { latitude, longitude } = currentLocation.coords;
        setUserLocation({ latitude, longitude });
        console.log('📱 Current location obtained (mobile):', { 
          latitude, 
          longitude,
          accuracy: currentLocation.coords.accuracy 
        });
      }
    } catch (error) {
      console.log('⚠️ Silent location error:', error);
    }
  };

  const handlePickupPlaceSelected = (address: string, coordinates?: { latitude: number; longitude: number }, placeId?: string) => {
    console.log('🎯 Pickup address selected:', {
      address,
      placeId,
      coordinates
    });
    setPickupAddress(address);
    setPickupCoords(coordinates || null);
    setPickupPlaceId(placeId);
    setShowPickupSuccess(true);
    setShowLocationWarning(false);
    
    // Auto-focus to destination field after a short delay
    setTimeout(() => {
      if (destinationInputRef.current) {
        destinationInputRef.current.focus();
      }
    }, 500);
  };

  const handleDestinationPlaceSelected = (address: string, coordinates?: { latitude: number; longitude: number }, placeId?: string) => {
    console.log('🎯 Destination address selected:', {
      address,
      placeId,
      coordinates
    });
    setDestinationAddress(address);
    setDestinationCoords(coordinates || null);
    setDestinationPlaceId(placeId);
    setShowDestinationSuccess(true);
  };

  const handleRideAppPress = (appIndex: number) => {
    if (!pickupAddress.trim() || !destinationAddress.trim()) {
      Alert.alert(t('alert.error'), t('alert.requiredAddresses'));
      return;
    }

    // Check if we have coordinates for both locations
    if (!pickupCoords || !destinationCoords) {
      Alert.alert(
        t('alert.error'), 
        t('alert.coordinatesRequired')
      );
      return;
    }

    const pickupLocation: LocationData = {
      address: pickupAddress,
      latitude: pickupCoords.latitude,
      longitude: pickupCoords.longitude,
      placeId: pickupPlaceId,
    };

    const destinationLocation: LocationData = {
      address: destinationAddress,
      latitude: destinationCoords.latitude,
      longitude: destinationCoords.longitude,
      placeId: destinationPlaceId,
    };

    console.log('🚗 Opening ride app with locations:', { 
      app: rideApps[appIndex].name,
      pickupLocation, 
      destinationLocation 
    });
    openRideApp(rideApps[appIndex], pickupLocation, destinationLocation);
  };

  // Animated styles
  const pickupGlowStyle = useAnimatedStyle(() => {
    return {
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: pickupGlowAnimation.value * 0.5,
      shadowRadius: pickupGlowAnimation.value * 20,
      elevation: pickupGlowAnimation.value * 8,
    };
  });

  const destinationGlowStyle = useAnimatedStyle(() => {
    return {
      shadowColor: '#f59e0b',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: destinationGlowAnimation.value * 0.5,
      shadowRadius: destinationGlowAnimation.value * 20,
      elevation: destinationGlowAnimation.value * 8,
    };
  });

  const toastStyle = useAnimatedStyle(() => {
    return {
      opacity: toastOpacity.value,
      transform: [{ translateY: toastTranslateY.value }],
    };
  });

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{t('app.title')}</Text>
                <LanguageSelector compact />
              </View>
              <Text style={styles.subtitle}>{t('app.subtitle')}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.addressSection}>
                <Animated.View style={[styles.pickupContainer, pickupGlowStyle]}>
                  <GooglePlacesInput
                    label={t('main.pickupLabel')}
                    placeholder={t('main.pickupPlaceholder')}
                    icon="pickup"
                    onPlaceSelected={handlePickupPlaceSelected}
                    value={pickupAddress}
                    userLocation={userLocation}
                    showSuccess={showPickupSuccess}
                  />

                  {showLocationWarning && (
                    <View style={styles.locationWarning}>
                      <Text style={styles.locationWarningText}>
                        {t('location.warning')}
                      </Text>
                    </View>
                  )}
                </Animated.View>

                <Animated.View style={[styles.destinationContainer, destinationGlowStyle]}>
                  <GooglePlacesInput
                    label={t('main.destinationLabel')}
                    placeholder={t('main.destinationPlaceholder')}
                    icon="destination"
                    onPlaceSelected={handleDestinationPlaceSelected}
                    value={destinationAddress}
                    userLocation={userLocation}
                    ref={destinationInputRef}
                    showSuccess={showDestinationSuccess}
                  />
                </Animated.View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('main.chooseRideApp')}</Text>
                <View style={styles.rideAppsContainer}>
                  {rideApps.length > 0 ? (
                    rideApps.map((app, index) => (
                      <RideAppButton
                        key={app.id}
                        appName={app.name}
                        icon={app.icon}
                        color={app.color}
                        onPress={() => handleRideAppPress(index)}
                        disabled={isLoading || !pickupAddress.trim() || !destinationAddress.trim() || !pickupCoords || !destinationCoords}
                      />
                    ))
                  ) : (
                    <View style={styles.noAppsContainer}>
                      <Text style={styles.noAppsTitle}>📱 {t('appManager.noAppsEnabled')}</Text>
                      <Text style={styles.noAppsText}>
                        {t('appManager.enableAppsInSettings')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.tipBox}>
                <Text style={styles.tipTitle}>{t('howTo.title')}</Text>
                <Text style={styles.tipText}>
                  {t('howTo.step1')}{'\n'}
                  {t('howTo.step2')}{'\n'}
                  {t('howTo.step3')}{'\n'}
                  {t('howTo.step4')}
                </Text>
              </View>

              {(!pickupCoords || !destinationCoords) && (pickupAddress || destinationAddress) && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningTitle}>⚠️ {t('alert.error')}</Text>
                  <Text style={styles.warningText}>
                    {t('location.coordinatesRequired')}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Toast Feedback */}
        <Animated.View style={[styles.toastContainer, toastStyle]} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>
              ⭐ Endereços preenchidos com base no favorito selecionado
            </Text>
          </View>
        </Animated.View>
      </View>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    minHeight: screenHeight * 0.9,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: Math.min(screenWidth * 0.08, 32),
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    flex: 1,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: Math.min(screenWidth * 0.035, 14),
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: screenWidth * 0.85,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: Math.min(screenWidth * 0.05, 20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 20,
    flex: 1,
  },
  addressSection: {
    marginBottom: 20,
  },
  pickupContainer: {
    position: 'relative',
    zIndex: 10,
    marginBottom: 20,
  },
  destinationContainer: {
    position: 'relative',
    zIndex: 5,
  },
  locationWarning: {
    backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.1)' : '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.2)' : '#fbbf24',
    zIndex: 1,
  },
  locationWarningText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: theme.colors.warning,
    lineHeight: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
  },
  rideAppsContainer: {
    gap: 8,
  },
  noAppsContainer: {
    backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#bae6fd',
  },
  noAppsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.info,
    marginBottom: 8,
    textAlign: 'center',
  },
  noAppsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.info,
    textAlign: 'center',
    lineHeight: 20,
  },
  tipBox: {
    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0',
    marginBottom: 16,
  },
  tipTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.success,
    marginBottom: 8,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: theme.colors.success,
    lineHeight: 16,
  },
  warningBox: {
    backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.1)' : '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.2)' : '#fbbf24',
  },
  warningTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.warning,
    marginBottom: 8,
  },
  warningText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: theme.colors.warning,
    lineHeight: 16,
  },
  toastContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
});