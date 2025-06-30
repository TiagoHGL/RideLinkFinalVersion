import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RideAppConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  packageId: string;
  enabled: boolean;
  deepLinkScheme: string;
  playStoreUrl: string;
}

const DEFAULT_RIDE_APPS: RideAppConfig[] = [
  {
    id: 'uber',
    name: 'Uber',
    icon: '🚗',
    color: '#000000',
    packageId: 'com.ubercab',
    enabled: true,
    deepLinkScheme: 'uber',
    playStoreUrl: 'market://details?id=com.ubercab',
  },
  {
    id: '99',
    name: '99',
    icon: '🟡',
    color: '#ffd700',
    packageId: 'com.taxis99',
    enabled: true,
    deepLinkScheme: 'taxis99',
    playStoreUrl: 'market://details?id=com.taxis99',
  },
  {
    id: 'lyft',
    name: 'Lyft',
    icon: '🟣',
    color: '#ff00bf',
    packageId: 'com.lyft',
    enabled: true,
    deepLinkScheme: 'lyft',
    playStoreUrl: 'market://details?id=com.lyft',
  },
  {
    id: 'taxirio',
    name: 'Taxi.Rio',
    icon: '🚕',
    color: '#ff6b35',
    packageId: 'br.gov.rj.taxi.rio.passenger',
    enabled: false,
    deepLinkScheme: 'br.gov.rj.taxi.rio.passenger',
    playStoreUrl: 'market://details?id=br.gov.rj.taxi.rio.passenger',
  },
  {
    id: 'indriver',
    name: 'inDriver',
    icon: '🔵',
    color: '#1e40af',
    packageId: 'sinet.startup.inDriver',
    enabled: false,
    deepLinkScheme: 'indriver',
    playStoreUrl: 'market://details?id=sinet.startup.inDriver',
  },
  {
    id: 'bolt',
    name: 'Bolt',
    icon: '⚡',
    color: '#34d399',
    packageId: 'ee.mtakso.client',
    enabled: false,
    deepLinkScheme: 'bolt',
    playStoreUrl: 'market://details?id=ee.mtakso.client',
  },
  {
    id: 'grab',
    name: 'Grab',
    icon: '🟢',
    color: '#00b14f',
    packageId: 'com.grabtaxi.passenger',
    enabled: false,
    deepLinkScheme: 'grab',
    playStoreUrl: 'market://details?id=com.grabtaxi.passenger',
  },
  {
    id: 'careem',
    name: 'Careem',
    icon: '🟤',
    color: '#8b5a2b',
    packageId: 'com.careem.acma',
    enabled: false,
    deepLinkScheme: 'careem',
    playStoreUrl: 'market://details?id=com.careem.acma',
  },
  {
    id: 'ola',
    name: 'Ola',
    icon: '🟠',
    color: '#f97316',
    packageId: 'com.olacabs.customer',
    enabled: false,
    deepLinkScheme: 'olacabs',
    playStoreUrl: 'market://details?id=com.olacabs.customer',
  },
  {
    id: 'yandex',
    name: 'Yandex Go',
    icon: '🔴',
    color: '#dc2626',
    packageId: 'ru.yandex.taxi',
    enabled: false,
    deepLinkScheme: 'yandextaxi',
    playStoreUrl: 'market://details?id=ru.yandex.taxi',
  },
];

const APP_MANAGER_STORAGE_KEY = 'ridelink_app_manager_config';

// Create a simple event emitter for app config changes
class AppConfigEventEmitter {
  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit() {
    this.listeners.forEach(listener => listener());
  }
}

const appConfigEmitter = new AppConfigEventEmitter();

export function useAppManager() {
  const [rideApps, setRideApps] = useState<RideAppConfig[]>(DEFAULT_RIDE_APPS);
  const [loading, setLoading] = useState(true);

  // Load app configuration from storage
  useEffect(() => {
    loadAppConfiguration().catch((error) => {
      console.error('❌ Failed to load app configuration:', error);
      setLoading(false);
    });
  }, []);

  // Subscribe to app config changes
  useEffect(() => {
    const unsubscribe = appConfigEmitter.subscribe(() => {
      loadAppConfiguration().catch((error) => {
        console.error('❌ Failed to reload app configuration:', error);
      });
    });
    return unsubscribe;
  }, []);

  const loadAppConfiguration = async () => {
    try {
      const stored = await AsyncStorage.getItem(APP_MANAGER_STORAGE_KEY);
      if (stored) {
        const storedConfig = JSON.parse(stored);
        // Merge with default apps to ensure new apps are included
        const mergedApps = DEFAULT_RIDE_APPS.map(defaultApp => {
          const storedApp = storedConfig.find((app: RideAppConfig) => app.id === defaultApp.id);
          return storedApp ? { ...defaultApp, enabled: storedApp.enabled } : defaultApp;
        });
        setRideApps(mergedApps);
      }
    } catch (error) {
      console.error('Error loading app configuration:', error);
      // Don't throw, just use defaults
    } finally {
      setLoading(false);
    }
  };

  const saveAppConfiguration = async (newConfig: RideAppConfig[]) => {
    try {
      await AsyncStorage.setItem(APP_MANAGER_STORAGE_KEY, JSON.stringify(newConfig));
      setRideApps(newConfig);
      // Emit change event to notify other components
      appConfigEmitter.emit();
    } catch (error) {
      console.error('Error saving app configuration:', error);
      throw error; // Re-throw so UI can handle the error
    }
  };

  const toggleAppEnabled = async (appId: string) => {
    try {
      const updatedApps = rideApps.map(app =>
        app.id === appId ? { ...app, enabled: !app.enabled } : app
      );
      await saveAppConfiguration(updatedApps);
    } catch (error) {
      console.error('Error toggling app enabled state:', error);
      throw error;
    }
  };

  const getEnabledApps = () => {
    return rideApps.filter(app => app.enabled);
  };

  const resetToDefaults = async () => {
    try {
      await saveAppConfiguration(DEFAULT_RIDE_APPS);
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      throw error;
    }
  };

  return {
    rideApps,
    loading,
    toggleAppEnabled,
    getEnabledApps,
    resetToDefaults,
    refresh: loadAppConfiguration,
  };
}