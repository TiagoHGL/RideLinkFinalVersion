import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Platform, Animated, TextInput, FlatList, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { MapPin, Navigation, Check, Copy, Crosshair } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemedStyles } from '@/contexts/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';

interface GooglePlacesInputProps {
  label: string;
  placeholder: string;
  icon: 'pickup' | 'destination';
  onPlaceSelected: (address: string, coordinates?: { latitude: number; longitude: number }, placeId?: string) => void;
  value?: string;
  userLocation?: { latitude: number; longitude: number };
  showSuccess?: boolean;
  showCopyButton?: boolean; // New prop to control copy button visibility
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const { width: screenWidth } = Dimensions.get('window');

export const GooglePlacesInput = forwardRef<any, GooglePlacesInputProps>(({ 
  label, 
  placeholder, 
  icon, 
  onPlaceSelected, 
  value = '',
  userLocation,
  showSuccess = false,
  showCopyButton = true // Default to true for backward compatibility
}, ref) => {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);
  const inputRef = useRef<TextInput>(null);
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const checkAnimation = useRef(new Animated.Value(0)).current;
  const copyFeedbackAnimation = useRef(new Animated.Value(0)).current;
  const locationPulseAnimation = useRef(new Animated.Value(1)).current;
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (showSuccess) {
      setIsSelected(true);
      Animated.sequence([
        Animated.timing(checkAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(checkAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsSelected(false);
      });
    }
  }, [showSuccess]);

  // Check location permission on mount for pickup fields
  useEffect(() => {
    if (icon === 'pickup') {
      checkLocationPermission();
    }
  }, [icon]);

  const checkLocationPermission = async () => {
    if (Platform.OS === 'web') {
      setLocationPermissionGranted(true);
      return;
    }

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermissionGranted(status === 'granted');
    } catch (error) {
      console.log('❌ Permission check error:', error);
      setLocationPermissionGranted(false);
    }
  };

  const IconComponent = icon === 'pickup' ? MapPin : Navigation;

  // Get the API key from environment variables
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleCopyAddress = async () => {
    if (!inputValue.trim() || !showCopyButton) {
      return;
    }

    try {
      await Clipboard.setStringAsync(inputValue);
      
      // Show copy feedback animation
      setShowCopyFeedback(true);
      Animated.sequence([
        Animated.timing(copyFeedbackAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(copyFeedbackAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setShowCopyFeedback(false);
      });

      // Show toast-like feedback
      if (Platform.OS === 'web') {
        const toastMessage = icon === 'pickup' 
          ? t('main.pickupCopied') || 'Pickup address copied!'
          : t('main.destinationCopied') || 'Destination address copied!';
        
        // Create a temporary toast element for web
        const toast = document.createElement('div');
        toast.textContent = toastMessage;
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 2000);
      } else {
        console.log('Address copied to clipboard:', inputValue);
      }
    } catch (error) {
      console.error('Failed to copy address:', error);
      if (Platform.OS === 'web' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(inputValue);
        } catch (webError) {
          console.error('Web clipboard fallback failed:', webError);
        }
      }
    }
  };

  const handleUseCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        Alert.alert(t('alert.error'), 'Geolocation is not supported in this browser.');
        return;
      }

      setLoadingLocation(true);
      
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(locationPulseAnimation, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(locationPulseAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            
            console.log('🌐 Current location (web):', { 
              latitude, 
              longitude, 
              accuracy: `${accuracy}m` 
            });
            
            await reverseGeocodeLocation(latitude, longitude);
          } catch (error) {
            Alert.alert(t('alert.error'), 'Could not get the address for your location.');
          } finally {
            setLoadingLocation(false);
            locationPulseAnimation.stopAnimation();
            locationPulseAnimation.setValue(1);
          }
        },
        (error) => {
          setLoadingLocation(false);
          locationPulseAnimation.stopAnimation();
          locationPulseAnimation.setValue(1);
          
          let errorMessage = t('alert.locationError');
          
          console.log('❌ Geolocation error (web):', error);
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = t('alert.permissionDenied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = t('alert.locationUnavailable');
              break;
            case error.TIMEOUT:
              errorMessage = t('alert.locationTimeout');
              break;
          }
          
          Alert.alert(t('alert.error'), errorMessage);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 25000, 
          maximumAge: 5000 
        }
      );
    } else {
      try {
        setLoadingLocation(true);
        
        // Start pulse animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(locationPulseAnimation, {
              toValue: 1.3,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(locationPulseAnimation, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
        
        if (!locationPermissionGranted) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(t('alert.error'), 'We need location permission to use this feature.');
            setLoadingLocation(false);
            locationPulseAnimation.stopAnimation();
            locationPulseAnimation.setValue(1);
            return;
          }
          setLocationPermissionGranted(true);
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          timeout: 25000,
          maximumAge: 5000,
        });

        const { latitude, longitude, accuracy } = currentLocation.coords;

        console.log('📱 Current location (mobile):', { 
          latitude, 
          longitude, 
          accuracy: `${accuracy}m` 
        });

        await reverseGeocodeLocation(latitude, longitude);
      } catch (error) {
        console.log('❌ Location error:', error);
        Alert.alert(t('alert.error'), t('alert.locationError'));
      } finally {
        setLoadingLocation(false);
        locationPulseAnimation.stopAnimation();
        locationPulseAnimation.setValue(1);
      }
    }
  };

  const reverseGeocodeLocation = async (latitude: number, longitude: number) => {
    try {
      if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en&result_type=street_address&location_type=ROOFTOP`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          let bestResult = null;
          
          for (const result of data.results) {
            const hasStreetNumber = result.address_components.some(
              (component: any) => component.types.includes('street_number')
            );
            const isRooftop = result.geometry.location_type === 'ROOFTOP';
            
            if (hasStreetNumber && isRooftop) {
              bestResult = result;
              break;
            }
          }
          
          if (!bestResult) {
            for (const result of data.results) {
              const hasStreetNumber = result.address_components.some(
                (component: any) => component.types.includes('street_number')
              );
              const isRangeInterpolated = result.geometry.location_type === 'RANGE_INTERPOLATED';
              
              if (hasStreetNumber && isRangeInterpolated) {
                bestResult = result;
                break;
              }
            }
          }
          
          if (!bestResult) {
            bestResult = data.results.find((result: any) => 
              result.address_components.some((component: any) => 
                component.types.includes('street_number')
              )
            ) || data.results[0];
          }
          
          const address = bestResult.formatted_address;
          const placeId = bestResult.place_id;
          
          setInputValue(address);
          onPlaceSelected(address, { latitude, longitude }, placeId);
          
          console.log('📍 Current location address:', {
            address,
            placeId,
            locationType: bestResult.geometry.location_type
          });
        } else {
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setInputValue(fallbackAddress);
          onPlaceSelected(fallbackAddress, { latitude, longitude });
        }
      } else if (Platform.OS !== 'web') {
        const addressResult = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (addressResult.length > 0) {
          const addr = addressResult[0];
          const formattedAddress = [
            addr.street && addr.streetNumber ? `${addr.street}, ${addr.streetNumber}` : addr.street,
            addr.district,
            addr.city,
            addr.region
          ].filter(Boolean).join(', ');
          
          const finalAddress = formattedAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setInputValue(finalAddress);
          onPlaceSelected(finalAddress, { latitude, longitude });
        } else {
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setInputValue(fallbackAddress);
          onPlaceSelected(fallbackAddress, { latitude, longitude });
        }
      } else {
        const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setInputValue(fallbackAddress);
        onPlaceSelected(fallbackAddress, { latitude, longitude });
      }
    } catch (addressError) {
      console.log('❌ Address error:', addressError);
      const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      setInputValue(fallbackAddress);
      onPlaceSelected(fallbackAddress, { latitude, longitude });
    }
  };

  const searchPlaces = async (input: string) => {
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || input.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      setIsLoading(true);
      
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&language=en&types=address`;
      
      if (userLocation) {
        const { latitude, longitude } = userLocation;
        url += `&location=${latitude},${longitude}&radius=50000&strictbounds=false`;
        console.log('🎯 Using location bias:', { latitude, longitude });
      }
      
      url += '&components=country:us|country:br|country:ca';

      console.log('🔍 Searching places with URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        setPredictions(data.predictions);
        setShowPredictions(true);
        console.log('✅ Found predictions:', data.predictions.length);
      } else if (data.status === 'ZERO_RESULTS') {
        setPredictions([]);
        setShowPredictions(false);
        console.log('ℹ️ No results found for:', input);
      } else {
        console.warn('⚠️ Places API error:', data.status, data.error_message);
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error('❌ Error searching places:', error);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string): Promise<{ coordinates: { latitude: number; longitude: number }; address: string } | null> => {
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=geometry,formatted_address&language=en`;
      
      console.log('📍 Getting place details for:', placeId);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const result = {
          coordinates: {
            latitude: data.result.geometry.location.lat,
            longitude: data.result.geometry.location.lng,
          },
          address: data.result.formatted_address,
        };
        
        console.log('✅ Place details retrieved:', result);
        return result;
      } else {
        console.warn('⚠️ Place details error:', data.status, data.error_message);
      }
    } catch (error) {
      console.error('❌ Error getting place details:', error);
    }
    return null;
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      if (text.trim().length >= 2) {
        searchPlaces(text.trim());
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    }, 300);

    setDebounceTimer(timer);
  };

  const handlePredictionPress = async (prediction: PlacePrediction) => {
    console.log('🎯 Address selected:', {
      description: prediction.description,
      place_id: prediction.place_id
    });

    setInputValue(prediction.description);
    setShowPredictions(false);
    setPredictions([]);

    const details = await getPlaceDetails(prediction.place_id);
    
    if (details) {
      console.log('📍 Coordinates obtained:', details.coordinates);
      setInputValue(details.address);
      onPlaceSelected(details.address, details.coordinates, prediction.place_id);
    } else {
      console.log('⚠️ Using fallback without coordinates');
      onPlaceSelected(prediction.description, undefined, prediction.place_id);
    }
  };

  const handleFocus = () => {
    if (inputValue.length >= 2) {
      searchPlaces(inputValue);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowPredictions(false);
    }, 200);
  };

  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => handlePredictionPress(item)}
      activeOpacity={0.7}
    >
      <MapPin size={16} color={styles.predictionIconColor.color} style={styles.predictionIcon} />
      <View style={styles.predictionContent}>
        <Text style={styles.predictionMain} numberOfLines={1}>
          {item.structured_formatting.main_text}
        </Text>
        <Text style={styles.predictionSecondary} numberOfLines={1}>
          {item.structured_formatting.secondary_text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Show API key setup instructions if not configured
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, styles.errorContainer]}>
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>{t('apiKey.required')}</Text>
            <Text style={styles.errorText}>
              {t('apiKey.instructions')}
            </Text>
            <Text style={styles.errorSteps}>
              {t('apiKey.steps')}
            </Text>
            <Text style={styles.errorLink}>
              {t('apiKey.link')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TouchableOpacity 
          style={styles.iconContainer}
          onPress={icon === 'pickup' ? handleUseCurrentLocation : undefined}
          disabled={icon !== 'pickup' || loadingLocation}
          activeOpacity={icon === 'pickup' ? 0.7 : 1}
        >
          <Animated.View style={[
            styles.iconWrapper,
            icon === 'pickup' && {
              transform: [{ scale: locationPulseAnimation }]
            }
          ]}>
            {icon === 'pickup' ? (
              loadingLocation ? (
                <Crosshair size={20} color={styles.locationActiveIconColor.color} />
              ) : (
                <MapPin 
                  size={20} 
                  color={styles.locationIconColor.color}
                  fill={styles.locationIconFill.color}
                />
              )
            ) : (
              <IconComponent size={20} color={styles.inputIconColor.color} />
            )}
          </Animated.View>
        </TouchableOpacity>
        
        {isSelected && (
          <Animated.View 
            style={[
              styles.checkContainer,
              {
                opacity: checkAnimation,
                transform: [{
                  scale: checkAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  })
                }]
              }
            ]}
          >
            <Check size={20} color={styles.checkColor.color} />
          </Animated.View>
        )}
        {showCopyFeedback && (
          <Animated.View 
            style={[
              styles.copyFeedbackContainer,
              {
                opacity: copyFeedbackAnimation,
                transform: [{
                  scale: copyFeedbackAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  })
                }]
              }
            ]}
          >
            <Check size={16} color={styles.copyFeedbackColor.color} />
          </Animated.View>
        )}
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            Platform.OS === 'web' && { outlineStyle: 'none' },
            // Adjust padding based on whether copy button is shown
            showCopyButton ? styles.textInputWithCopy : styles.textInputNoCopy
          ]}
          value={inputValue}
          onChangeText={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={styles.placeholderColor.color}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
        />
        {inputValue.trim().length > 0 && showCopyButton && (
          <TouchableOpacity
            style={styles.copyIconContainer}
            onPress={handleCopyAddress}
            activeOpacity={0.7}
          >
            <Copy 
              size={18} 
              color={styles.copyIconColor.color}
              fill={styles.copyIconFill.color}
            />
          </TouchableOpacity>
        )}
        {showPredictions && predictions.length > 0 && (
          <View style={styles.predictionsContainer}>
            <FlatList
              data={predictions}
              renderItem={renderPrediction}
              keyExtractor={(item) => item.place_id}
              style={styles.predictionsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            />
          </View>
        )}
        {isLoading && showPredictions && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: 20,
    position: 'relative',
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: Math.min(screenWidth * 0.045, 18),
    color: theme.colors.text,
    marginBottom: 12,
  },
  inputWrapper: {
    position: 'relative',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.1)' : '#fef3c7',
    borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.3)' : '#f59e0b',
    borderWidth: 2,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.warning,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.warning,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSteps: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: theme.colors.warning,
    textAlign: 'left',
    lineHeight: 18,
    marginBottom: 8,
  },
  errorLink: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: theme.colors.info,
    textAlign: 'center',
  },
  iconContainer: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 2,
    padding: 4,
    borderRadius: 8,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkContainer: {
    position: 'absolute',
    right: 52,
    top: 18,
    zIndex: 2,
    backgroundColor: theme.isDark ? 'rgba(52, 211, 153, 0.1)' : '#f0fdf4',
    borderRadius: 10,
    padding: 2,
  },
  copyFeedbackContainer: {
    position: 'absolute',
    right: 16,
    top: 20,
    zIndex: 3,
    backgroundColor: theme.isDark ? 'rgba(52, 211, 153, 0.2)' : '#dcfce7',
    borderRadius: 8,
    padding: 4,
  },
  textInput: {
    backgroundColor: 'transparent',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 52,
    paddingVertical: 16,
    fontFamily: 'Inter-Regular',
    fontSize: Math.min(screenWidth * 0.04, 16),
    color: theme.colors.text,
    borderWidth: 0,
  },
  textInputWithCopy: {
    paddingRight: 88, // Space for copy button
  },
  textInputNoCopy: {
    paddingRight: 52, // No space for copy button
  },
  copyIconContainer: {
    position: 'absolute',
    right: 16,
    top: 18,
    zIndex: 2,
    padding: 4,
    borderRadius: 8,
  },
  predictionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 250,
    zIndex: 999,
    ...Platform.select({
      web: {
        position: 'absolute' as any,
        zIndex: 999,
      },
    }),
  },
  predictionsList: {
    maxHeight: 250,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  predictionIcon: {
    marginRight: 12,
  },
  predictionContent: {
    flex: 1,
  },
  predictionMain: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 2,
  },
  predictionSecondary: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 999,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  // Color helpers
  inputIconColor: {
    color: theme.colors.textSecondary,
  },
  locationIconColor: {
    color: theme.colors.primary,
  },
  locationIconFill: {
    color: theme.isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.1)',
  },
  locationActiveIconColor: {
    color: theme.colors.success,
  },
  checkColor: {
    color: theme.colors.success,
  },
  copyFeedbackColor: {
    color: theme.colors.success,
  },
  copyIconColor: {
    color: theme.colors.primary,
  },
  copyIconFill: {
    color: theme.isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.08)',
  },
  placeholderColor: {
    color: theme.colors.textTertiary,
  },
  predictionIconColor: {
    color: theme.colors.textSecondary,
  },
});