import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { GooglePlacesInput } from '@/components/GooglePlacesInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { useRouteFavorites, FavoriteRoute } from '@/hooks/useRouteFavorites';
import * as Location from 'expo-location';

const { width: screenWidth } = Dimensions.get('window');

interface RouteManagerModalProps {
  visible: boolean;
  onClose: () => void;
  editingRoute?: FavoriteRoute | null;
  onRouteSelected?: (pickup: any, destination: any) => void;
}

export function RouteManagerModal({ visible, onClose, editingRoute, onRouteSelected }: RouteManagerModalProps) {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { addRouteFavorite, updateRouteFavorite } = useRouteFavorites();
  
  const [routeName, setRouteName] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pickupPlaceId, setPickupPlaceId] = useState<string | undefined>();
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationPlaceId, setDestinationPlaceId] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get user location for address search bias
  React.useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  // Load editing route data
  React.useEffect(() => {
    if (editingRoute) {
      setRouteName(editingRoute.name);
      setPickupAddress(editingRoute.pickup.address);
      setPickupCoords(
        editingRoute.pickup.latitude && editingRoute.pickup.longitude
          ? { latitude: editingRoute.pickup.latitude, longitude: editingRoute.pickup.longitude }
          : null
      );
      setPickupPlaceId(editingRoute.pickup.placeId);
      setDestinationAddress(editingRoute.destination.address);
      setDestinationCoords(
        editingRoute.destination.latitude && editingRoute.destination.longitude
          ? { latitude: editingRoute.destination.latitude, longitude: editingRoute.destination.longitude }
          : null
      );
      setDestinationPlaceId(editingRoute.destination.placeId);
    } else {
      resetForm();
    }
  }, [editingRoute, visible]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 10000,
          maximumAge: 30000,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.log('Could not get location for address search bias:', error);
    }
  };

  const handlePickupSelected = (address: string, coordinates?: { latitude: number; longitude: number }, placeId?: string) => {
    console.log('🎯 Pickup selected for route:', { address, coordinates, placeId });
    setPickupAddress(address);
    setPickupCoords(coordinates || null);
    setPickupPlaceId(placeId);
  };

  const handleDestinationSelected = (address: string, coordinates?: { latitude: number; longitude: number }, placeId?: string) => {
    console.log('🎯 Destination selected for route:', { address, coordinates, placeId });
    setDestinationAddress(address);
    setDestinationCoords(coordinates || null);
    setDestinationPlaceId(placeId);
  };

  const resetForm = () => {
    setRouteName('');
    setPickupAddress('');
    setPickupCoords(null);
    setPickupPlaceId(undefined);
    setDestinationAddress('');
    setDestinationCoords(null);
    setDestinationPlaceId(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim() || !pickupAddress.trim() || !destinationAddress.trim()) {
      Alert.alert(t('alert.error'), t('routeFavorites.requiredFields'));
      return;
    }

    setIsSaving(true);
    try {
      const routeData = {
        name: routeName.trim(),
        pickup: {
          address: pickupAddress,
          latitude: pickupCoords?.latitude,
          longitude: pickupCoords?.longitude,
          placeId: pickupPlaceId,
        },
        destination: {
          address: destinationAddress,
          latitude: destinationCoords?.latitude,
          longitude: destinationCoords?.longitude,
          placeId: destinationPlaceId,
        }
      };

      if (editingRoute) {
        console.log('✏️ Updating route favorite:', routeData);
        await updateRouteFavorite(editingRoute.id, routeData);
        console.log('✅ Route favorite updated successfully');
      } else {
        console.log('💾 Adding new route favorite:', routeData);
        await addRouteFavorite(
          routeData.name,
          routeData.pickup,
          routeData.destination
        );
        console.log('✅ Route favorite added successfully');
      }

      // Reset form and close modal
      resetForm();
      onClose();

      // Show success message
      Alert.alert(
        t('routeFavorites.title'),
        `${editingRoute ? t('routeFavorites.updated') : t('routeFavorites.save')} "${routeName.trim()}" ${t('favorites.save').toLowerCase()}!`,
        [{ text: t('alert.ok') }]
      );
    } catch (error) {
      console.error('❌ Error saving route favorite:', error);
      Alert.alert(t('alert.error'), t('routeFavorites.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = routeName.trim() && pickupAddress.trim() && destinationAddress.trim();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.modalCancel}>{t('alert.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingRoute ? t('routeFavorites.editRoute') : t('routeFavorites.addRoute')}
          </Text>
          <TouchableOpacity 
            onPress={handleSaveRoute}
            disabled={!canSave || isSaving}
          >
            <Text style={[
              styles.modalSave, 
              (!canSave || isSaving) && styles.modalSaveDisabled
            ]}>
              {isSaving ? t('routeFavorites.saving') : t('favorites.save')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.modalContent}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>
              {editingRoute ? t('routeFavorites.editRoute') : t('routeFavorites.newRoute')}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('routeFavorites.routeName')}</Text>
              <TextInput
                style={styles.input}
                value={routeName}
                onChangeText={setRouteName}
                placeholder={t('routeFavorites.routeNamePlaceholder')}
                placeholderTextColor={styles.placeholderColor.color}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.addressInputGroup}>
              <GooglePlacesInput
                label={t('routeFavorites.pickupLabel')}
                placeholder={t('routeFavorites.pickupPlaceholder')}
                icon="pickup"
                onPlaceSelected={handlePickupSelected}
                value={pickupAddress}
                userLocation={userLocation}
                showCopyButton={false}
              />
            </View>

            <View style={styles.addressInputGroup}>
              <GooglePlacesInput
                label={t('routeFavorites.destinationLabel')}
                placeholder={t('routeFavorites.destinationPlaceholder')}
                icon="destination"
                onPlaceSelected={handleDestinationSelected}
                value={destinationAddress}
                userLocation={userLocation}
                showCopyButton={false}
              />
            </View>

            <View style={styles.helpBox}>
              <Text style={styles.helpTitle}>💡 {t('routeFavorites.tip')}</Text>
              <Text style={styles.helpText}>
                {editingRoute ? t('routeFavorites.editTip') : t('routeFavorites.creationTip')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 4,
  },
  modalCancel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: theme.colors.text,
  },
  modalSave: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.primary,
  },
  modalSaveDisabled: {
    color: theme.colors.textTertiary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  addForm: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  formTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  addressInputGroup: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 10,
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  helpBox: {
    backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#bae6fd',
  },
  helpTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.info,
    marginBottom: 8,
  },
  helpText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: theme.colors.info,
    lineHeight: 18,
  },
  // Color helpers
  placeholderColor: {
    color: theme.colors.textTertiary,
  },
});