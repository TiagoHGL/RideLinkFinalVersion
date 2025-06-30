import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import * as Location from 'expo-location';
import { MapPin, Navigation } from 'lucide-react-native';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationServiceProps {
  onLocationUpdate: (location: LocationData) => void;
}

export function LocationService({ onLocationUpdate }: LocationServiceProps) {
  const [address, setAddress] = useState<string>('Rua Senador Vergueiro 218, Rio de Janeiro');
  const [loading, setLoading] = useState(false);
  const [hasTriedGPS, setHasTriedGPS] = useState(false);

  // Initialize with default address
  useEffect(() => {
    const defaultLocation: LocationData = {
      latitude: -22.9068,
      longitude: -43.1729,
      address: 'Rua Senador Vergueiro 218, Rio de Janeiro',
    };
    onLocationUpdate(defaultLocation);
  }, []);

  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      // On web, just keep the default address
      return;
    }

    try {
      setLoading(true);
      setHasTriedGPS(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      // Get current location with timeout
      const currentLocation = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
          maximumAge: 60000,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]) as Location.LocationObject;

      const locationData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      // Try to get address
      try {
        const addressResult = await Location.reverseGeocodeAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });

        if (addressResult.length > 0) {
          const addr = addressResult[0];
          const formattedAddress = [
            addr.street && addr.streetNumber ? `${addr.street}, ${addr.streetNumber}` : addr.street,
            addr.district,
            addr.city,
            addr.region
          ].filter(Boolean).join(', ');
          
          if (formattedAddress) {
            locationData.address = formattedAddress;
            setAddress(formattedAddress);
          }
        }
      } catch (addressError) {
        console.log('Could not fetch address:', addressError);
      }

      onLocationUpdate(locationData);
    } catch (error) {
      console.log('Location error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (text: string) => {
    setAddress(text);
    const locationData: LocationData = {
      latitude: -22.9068,
      longitude: -43.1729,
      address: text,
    };
    onLocationUpdate(locationData);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>📍 Endereço de Partida</Text>
      
      <View style={styles.inputContainer}>
        <Navigation size={20} color="#6b7280" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={handleAddressChange}
          placeholder="Digite seu endereço de partida..."
          placeholderTextColor="#9ca3af"
          multiline
        />
      </View>
      
      {Platform.OS !== 'web' && (
        <TouchableOpacity 
          style={styles.locationButton} 
          onPress={getCurrentLocation}
          disabled={loading}
        >
          <MapPin size={16} color="#ffffff" />
          <Text style={styles.locationButtonText}>
            {loading ? 'Obtendo localização...' : 'Usar Localização Atual'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#374151',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#374151',
    minHeight: 24,
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 12,
  },
  locationButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
  },
});