import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Modal,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { GooglePlacesInput } from '@/components/GooglePlacesInput';
import { RouteManagerModal } from '@/components/RouteManagerModal';
import { useFavorites, FavoriteDestination } from '@/hooks/useFavorites';
import { useRouteFavorites, FavoriteRoute } from '@/hooks/useRouteFavorites';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { useAutoFill } from '@/contexts/AutoFillContext';
import { Star, Plus, Trash2, CreditCard as Edit3, MapPin, Navigation, Route, ArrowRight } from 'lucide-react-native';
import * as Location from 'expo-location';

const { width: screenWidth } = Dimensions.get('window');

type TabType = 'places' | 'routes';

export default function FavoritesScreen() {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { favorites, loading, addFavorite, removeFavorite, updateFavorite } = useFavorites();
  const { routeFavorites, loading: routesLoading, removeRouteFavorite, updateRouteFavorite } = useRouteFavorites();
  const { setAutoFillData } = useAutoFill();
  const [activeTab, setActiveTab] = useState<TabType>('places');
  const [modalVisible, setModalVisible] = useState(false);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<FavoriteDestination | null>(null);
  const [editingRoute, setEditingRoute] = useState<FavoriteRoute | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [placeId, setPlaceId] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get user location for address search bias
  React.useEffect(() => {
    getCurrentLocation();
  }, []);

  // Debug log for route favorites
  React.useEffect(() => {
    console.log('🔍 Route favorites state updated:', {
      count: routeFavorites.length,
      loading: routesLoading,
      routes: routeFavorites.map(r => ({ id: r.id, name: r.name }))
    });
  }, [routeFavorites, routesLoading]);

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

  const handleAddFavorite = () => {
    setEditingFavorite(null);
    setName('');
    setAddress('');
    setCoordinates(null);
    setPlaceId(undefined);
    setModalVisible(true);
  };

  const handleEditFavorite = (favorite: FavoriteDestination) => {
    setEditingFavorite(favorite);
    setName(favorite.name);
    setAddress(favorite.address);
    setCoordinates(
      favorite.latitude && favorite.longitude 
        ? { latitude: favorite.latitude, longitude: favorite.longitude }
        : null
    );
    setPlaceId(undefined);
    setModalVisible(true);
  };

  const handleEditRoute = (route: FavoriteRoute) => {
    setEditingRoute(route);
    setRouteModalVisible(true);
  };

  const handleUseFavoritePlace = (favorite: FavoriteDestination) => {
    console.log('🎯 Using favorite place:', favorite.name);
    
    // Set auto-fill data for destination
    setAutoFillData({
      destination: {
        address: favorite.address,
        coordinates: favorite.latitude && favorite.longitude 
          ? { latitude: favorite.latitude, longitude: favorite.longitude }
          : undefined,
        placeId: favorite.placeId,
      },
      source: 'favorite-place',
      timestamp: Date.now(),
    });

    // Navigate to main screen
    router.push('/(tabs)');
  };

  const handleUseRoute = (route: FavoriteRoute) => {
    console.log('🎯 Using favorite route:', route.name);
    
    // Set auto-fill data for both pickup and destination
    setAutoFillData({
      pickup: {
        address: route.pickup.address,
        coordinates: route.pickup.latitude && route.pickup.longitude 
          ? { latitude: route.pickup.latitude, longitude: route.pickup.longitude }
          : undefined,
        placeId: route.pickup.placeId,
      },
      destination: {
        address: route.destination.address,
        coordinates: route.destination.latitude && route.destination.longitude 
          ? { latitude: route.destination.latitude, longitude: route.destination.longitude }
          : undefined,
        placeId: route.destination.placeId,
      },
      source: 'favorite-route',
      timestamp: Date.now(),
    });

    // Navigate to main screen
    router.push('/(tabs)');
  };

  const handleAddressSelected = (selectedAddress: string, selectedCoordinates?: { latitude: number; longitude: number }, selectedPlaceId?: string) => {
    setAddress(selectedAddress);
    setCoordinates(selectedCoordinates || null);
    setPlaceId(selectedPlaceId);
  };

  const handleSaveFavorite = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert(t('favorites.requiredFields'), t('favorites.requiredFields'));
      return;
    }

    try {
      if (editingFavorite) {
        await updateFavorite(editingFavorite.id, { 
          name: name.trim(), 
          address: address.trim(),
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
        });
      } else {
        await addFavorite(name.trim(), address.trim(), coordinates);
      }
      setModalVisible(false);
      setName('');
      setAddress('');
      setCoordinates(null);
      setPlaceId(undefined);
      setEditingFavorite(null);
    } catch (error) {
      Alert.alert(t('alert.error'), t('favorites.saveError'));
    }
  };

  const handleDeleteFavorite = (favorite: FavoriteDestination) => {
    Alert.alert(
      t('favorites.deleteFavorite'),
      `${t('favorites.deleteConfirm')} "${favorite.name}"?`,
      [
        { text: t('alert.cancel'), style: 'cancel' },
        { text: t('favorites.delete'), style: 'destructive', onPress: () => removeFavorite(favorite.id) },
      ]
    );
  };

  const handleDeleteRoute = (route: FavoriteRoute) => {
    Alert.alert(
      t('routeFavorites.deleteRoute'),
      `${t('routeFavorites.deleteConfirm')} "${route.name}"?`,
      [
        { text: t('alert.cancel'), style: 'cancel' },
        { 
          text: t('routeFavorites.delete'), 
          style: 'destructive', 
          onPress: () => removeRouteFavorite(route.id) 
        },
      ]
    );
  };

  const renderFavoriteItem = ({ item: favorite }: { item: FavoriteDestination }) => (
    <View style={styles.favoriteItem}>
      <TouchableOpacity 
        style={styles.favoriteContent}
        onPress={() => handleUseFavoritePlace(favorite)}
        activeOpacity={0.7}
      >
        <View style={styles.favoriteHeader}>
          <Star size={20} color={styles.starColor.color} fill={styles.starColor.color} />
          <Text style={styles.favoriteName} numberOfLines={1}>{favorite.name}</Text>
        </View>
        <View style={styles.favoriteAddress}>
          <MapPin size={16} color={styles.mapPinColor.color} />
          <Text style={styles.favoriteAddressText} numberOfLines={2}>{favorite.address}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.favoriteActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditFavorite(favorite)}
        >
          <Edit3 size={18} color={styles.editColor.color} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteFavorite(favorite)}
        >
          <Trash2 size={18} color={styles.deleteColor.color} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRouteItem = ({ item: route }: { item: FavoriteRoute }) => (
    <View style={styles.routeItem}>
      <TouchableOpacity
        style={styles.routeContent}
        onPress={() => handleUseRoute(route)}
        activeOpacity={0.7}
      >
        <View style={styles.routeHeader}>
          <Route size={20} color={styles.routeIconColor.color} />
          <Text style={styles.routeName} numberOfLines={1}>{route.name}</Text>
        </View>
        
        <View style={styles.routeDetails}>
          <View style={styles.addressRow}>
            <MapPin size={14} color={styles.pickupIconColor.color} />
            <Text style={styles.addressText} numberOfLines={1}>
              {route.pickup.address}
            </Text>
          </View>
          
          <View style={styles.arrowContainer}>
            <ArrowRight size={16} color={styles.arrowColor.color} />
          </View>
          
          <View style={styles.addressRow}>
            <Navigation size={14} color={styles.destinationIconColor.color} />
            <Text style={styles.addressText} numberOfLines={1}>
              {route.destination.address}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.routeActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditRoute(route)}
        >
          <Edit3 size={18} color={styles.editColor.color} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteRoute(route)}
        >
          <Trash2 size={18} color={styles.deleteColor.color} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPlacesContent = () => {
    if (loading) {
      return <Text style={styles.loadingText}>{t('favorites.loading')}</Text>;
    }

    if (favorites.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Star size={48} color={styles.emptyIconColor.color} />
          <Text style={styles.emptyTitle}>{t('favorites.noFavorites')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('favorites.noFavoritesSubtitle')}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={false}
      />
    );
  };

  const renderRoutesContent = () => {
    console.log('🎨 Rendering routes content:', { 
      loading: routesLoading, 
      count: routeFavorites.length,
      routes: routeFavorites 
    });

    if (routesLoading) {
      return <Text style={styles.loadingText}>{t('routeFavorites.loading')}</Text>;
    }

    if (routeFavorites.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Route size={48} color={styles.emptyIconColor.color} />
          <Text style={styles.emptyTitle}>{t('routeFavorites.noRoutes')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('routeFavorites.noRoutesSubtitle')}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={routeFavorites}
        renderItem={renderRouteItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={false}
      />
    );
  };

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('favorites.title')}</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={activeTab === 'places' ? handleAddFavorite : () => setRouteModalVisible(true)}
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'places' && styles.activeTab]}
            onPress={() => setActiveTab('places')}
          >
            <Star size={20} color={activeTab === 'places' ? styles.activeTabIconColor.color : styles.inactiveTabIconColor.color} />
            <Text style={[
              styles.tabText, 
              activeTab === 'places' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              {t('favorites.places')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'routes' && styles.activeTab]}
            onPress={() => setActiveTab('routes')}
          >
            <Route size={20} color={activeTab === 'routes' ? styles.activeTabIconColor.color : styles.inactiveTabIconColor.color} />
            <Text style={[
              styles.tabText, 
              activeTab === 'routes' ? styles.activeTabText : styles.inactiveTabText
            ]}>
              {t('favorites.routes')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {activeTab === 'places' ? renderPlacesContent() : renderRoutesContent()}
          </View>
        </ScrollView>

        {/* Places Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancel}>{t('alert.cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingFavorite ? t('favorites.editFavorite') : t('favorites.addFavorite')}
              </Text>
              <TouchableOpacity onPress={handleSaveFavorite}>
                <Text style={styles.modalSave}>{t('favorites.save')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('favorites.nameLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('favorites.namePlaceholder')}
                  placeholderTextColor={styles.placeholderColor.color}
                />
              </View>

              <View style={styles.addressInputGroup}>
                <GooglePlacesInput
                  label={t('favorites.addressLabel')}
                  placeholder={t('favorites.addressPlaceholder')}
                  icon="destination"
                  onPlaceSelected={handleAddressSelected}
                  value={address}
                  userLocation={userLocation}
                  showCopyButton={false}
                />
              </View>

              {coordinates && (
                <View style={styles.coordinatesInfo}>
                  <Text style={styles.coordinatesTitle}>📍 {t('favorites.coordinatesDetected')}</Text>
                  <Text style={styles.coordinatesText}>
                    {t('favorites.latitude')}: {coordinates.latitude.toFixed(6)}{'\n'}
                    {t('favorites.longitude')}: {coordinates.longitude.toFixed(6)}
                  </Text>
                </View>
              )}

              <View style={styles.helpBox}>
                <Text style={styles.helpTitle}>💡 {t('favorites.tip')}</Text>
                <Text style={styles.helpText}>
                  {t('favorites.tipDescription')}
                </Text>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Routes Modal */}
        <RouteManagerModal
          visible={routeModalVisible}
          onClose={() => {
            setRouteModalVisible(false);
            setEditingRoute(null);
          }}
          editingRoute={editingRoute}
          onRouteSelected={(pickup, destination) => {
            // This could be used to navigate back to main screen with pre-filled data
            console.log('Route selected:', pickup, destination);
          }}
        />
      </View>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: Math.min(screenWidth * 0.08, 32),
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginLeft: 8,
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  inactiveTabText: {
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    minHeight: 400,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    flex: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: screenWidth * 0.7,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  favoriteContent: {
    flex: 1,
    marginRight: 12,
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoriteName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
  },
  favoriteAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  favoriteAddressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 6,
    flex: 1,
    lineHeight: 20,
  },
  favoriteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Route item styles
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  routeContent: {
    flex: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
  },
  routeDetails: {
    gap: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  routeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  addressInputGroup: {
    marginBottom: 24,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  coordinatesInfo: {
    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0',
  },
  coordinatesTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.success,
    marginBottom: 8,
  },
  coordinatesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: theme.colors.success,
    lineHeight: 18,
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
  starColor: {
    color: theme.colors.warning,
  },
  mapPinColor: {
    color: theme.colors.textSecondary,
  },
  editColor: {
    color: theme.colors.primary,
  },
  deleteColor: {
    color: theme.colors.error,
  },
  emptyIconColor: {
    color: theme.colors.textTertiary,
  },
  placeholderColor: {
    color: theme.colors.textTertiary,
  },
  activeTabIconColor: {
    color: theme.colors.primary,
  },
  inactiveTabIconColor: {
    color: 'rgba(255,255,255,0.8)',
  },
  routeIconColor: {
    color: theme.colors.primary,
  },
  pickupIconColor: {
    color: theme.colors.primary,
  },
  destinationIconColor: {
    color: theme.colors.warning,
  },
  arrowColor: {
    color: theme.colors.textTertiary,
  },
});