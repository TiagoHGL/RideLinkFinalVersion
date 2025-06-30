import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppManager, RideAppConfig } from './useAppManager';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
}

export function useRideApps() {
  const { t } = useLanguage();
  const { rideApps: allApps, loading: appsLoading } = useAppManager();
  const [isLoading, setIsLoading] = useState(false);

  // Filter enabled apps reactively
  const rideApps = allApps.filter(app => app.enabled);

  const createDeepLink = (app: RideAppConfig, pickup: LocationData, destination: LocationData): string => {
    const pickupAddress = encodeURIComponent(pickup.address);
    const destinationAddress = encodeURIComponent(destination.address);
    const { latitude: latO, longitude: lngO } = pickup;
    const { latitude: latD, longitude: lngD } = destination;

    switch (app.id) {
      case 'uber':
        if (Platform.OS !== 'web') {
          // Mobile deep link with proper URL encoding
          // Format: uber://?action=setPickup&pickup[formatted_address]={origem}&dropoff[formatted_address]={destino}
          const uberDeepLink = `uber://?action=setPickup&pickup[formatted_address]=${pickupAddress}&dropoff[formatted_address]=${destinationAddress}`;
          console.log('🚗 Uber deep link:', uberDeepLink);
          return uberDeepLink;
        }
        // Web fallback - use Uber's web interface
        const uberParams = new URLSearchParams();
        uberParams.append('action', 'setPickup');
        uberParams.append('pickup[formatted_address]', pickup.address);
        uberParams.append('dropoff[formatted_address]', destination.address);
        if (latO && lngO) {
          uberParams.append('pickup[latitude]', latO.toString());
          uberParams.append('pickup[longitude]', lngO.toString());
        }
        if (latD && lngD) {
          uberParams.append('dropoff[latitude]', latD.toString());
          uberParams.append('dropoff[longitude]', lngD.toString());
        }
        return `https://m.uber.com/ul/?${uberParams.toString()}`;

      case '99':
        return `taxis99://call?pickup_latitude=${latO}&pickup_longitude=${lngO}&pickup_title=${pickupAddress}&dropoff_latitude=${latD}&dropoff_longitude=${lngD}&dropoff_title=${destinationAddress}`;

      case 'taxirio':
        return `br.gov.rj.taxi.rio.passenger://ride`;

      case 'indriver':
        // inDriver doesn't support deep links with route, so we just open the app
        return `indriver://open`;

      case 'lyft':
        return `lyft://ridetype?id=lyft&pickup[latitude]=${latO}&pickup[longitude]=${lngO}&destination[latitude]=${latD}&destination[longitude]=${lngD}`;

      case 'bolt':
        return `bolt://ride?pickup_lat=${latO}&pickup_lng=${lngO}&destination_lat=${latD}&destination_lng=${lngD}`;

      case 'grab':
        return `grab://open?screenType=BOOK&type=TRANSPORT&pickup.latitude=${latO}&pickup.longitude=${lngO}&dropoff.latitude=${latD}&dropoff.longitude=${lngD}`;

      case 'careem':
        return `careem://ride?pickup_latitude=${latO}&pickup_longitude=${lngO}&dropoff_latitude=${latD}&dropoff_longitude=${lngD}`;

      case 'ola':
        return `olacabs://app/setpickup?lat=${latO}&lng=${lngO}&drop_lat=${latD}&drop_lng=${lngD}`;

      case 'yandex':
        return `yandextaxi://route?start-lat=${latO}&start-lon=${lngO}&end-lat=${latD}&end-lon=${lngD}`;

      default:
        return '';
    }
  };

  const openRideApp = useCallback(async (
    app: RideAppConfig,
    pickup: LocationData,
    destination: LocationData
  ) => {
    setIsLoading(true);

    try {
      const deepLink = createDeepLink(app, pickup, destination);
      console.log(`🚗 Opening ${app.name} with deep link:`, deepLink);

      // Special handling for web platform
      if (Platform.OS === 'web') {
        if (app.id === 'uber') {
          await WebBrowser.openBrowserAsync(deepLink);
          console.log(`✅ ${app.name} opened in browser`);
        } else {
          // For other apps on web, show message and open Play Store
          Alert.alert(
            `${app.name} ${t('rideApp.notInstalled')}`,
            t('rideApp.webNotSupported'),
            [
              { text: t('alert.cancel'), style: 'cancel' },
              { text: t('alert.openPlayStore'), onPress: () => window.open(app.playStoreUrl.replace('market://', 'https://play.google.com/store/apps/'), '_blank') },
            ]
          );
        }
        return;
      }

      // For mobile platforms, try deep link first
      try {
        const canOpen = await Linking.canOpenURL(deepLink);
        
        if (canOpen) {
          await Linking.openURL(deepLink);
          console.log(`✅ ${app.name} app opened successfully`);
          
          // Show success message for apps that support route pre-filling
          if (['uber', '99', 'lyft', 'bolt', 'grab', 'careem', 'ola', 'yandex'].includes(app.id)) {
            setTimeout(() => {
              Alert.alert(
                `${app.name} ${t('rideApp.opened')}`,
                `${t('rideApp.verifyAddresses')}\n\n${t('rideApp.pickup')} ${pickup.address}\n${t('rideApp.destination')} ${destination.address}`,
                [{ text: t('alert.ok') }]
              );
            }, 1000);
          }
        } else {
          // App not installed - show Play Store option
          Alert.alert(
            `${app.name} ${t('rideApp.notInstalled')}`,
            `${t('rideApp.appNotInstalled', { appName: app.name })}\n\n${t('rideApp.manualEntry')}\n${t('rideApp.pickup')} ${pickup.address}\n${t('rideApp.destination')} ${destination.address}`,
            [
              { text: t('alert.cancel'), style: 'cancel' },
              { text: t('alert.openPlayStore'), onPress: () => Linking.openURL(app.playStoreUrl) },
            ]
          );
        }
      } catch (linkingError) {
        console.log('❌ Linking error:', linkingError);
        // Fallback to Play Store
        Alert.alert(
          t('rideApp.openingPlayStore'),
          `${t('rideApp.manualEntry')}\n\n${t('rideApp.pickup')} ${pickup.address}\n${t('rideApp.destination')} ${destination.address}`,
          [
            { text: t('alert.cancel'), style: 'cancel' },
            { text: t('alert.openPlayStore'), onPress: () => Linking.openURL(app.playStoreUrl) },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error opening ride app:', error);
      Alert.alert(t('alert.error'), t('rideApp.errorOpening'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return {
    rideApps,
    openRideApp,
    isLoading: isLoading || appsLoading,
  };
}