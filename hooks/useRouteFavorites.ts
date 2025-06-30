import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FavoriteRoute {
  id: string;
  name: string;
  pickup: {
    address: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
  };
  destination: {
    address: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
  };
  createdAt: Date;
}

const ROUTE_FAVORITES_KEY = 'ride_launcher_route_favorites';

// Create a simple event emitter for route favorites changes
class RouteFavoritesEventEmitter {
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

const routeFavoritesEmitter = new RouteFavoritesEventEmitter();

export function useRouteFavorites() {
  const [routeFavorites, setRouteFavorites] = useState<FavoriteRoute[]>([]);
  const [loading, setLoading] = useState(true);

  // Load route favorites from storage
  useEffect(() => {
    loadRouteFavorites().catch((error) => {
      console.error('❌ Failed to load route favorites:', error);
      setLoading(false);
    });
  }, []);

  // Subscribe to route favorites changes
  useEffect(() => {
    const unsubscribe = routeFavoritesEmitter.subscribe(() => {
      loadRouteFavorites().catch((error) => {
        console.error('❌ Failed to reload route favorites:', error);
      });
    });
    return unsubscribe;
  }, []);

  const loadRouteFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(ROUTE_FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const routes = parsed.map((route: any) => ({
          ...route,
          createdAt: new Date(route.createdAt),
        }));
        setRouteFavorites(routes);
        console.log('✅ Route favorites loaded:', routes.length, 'routes');
      } else {
        console.log('ℹ️ No route favorites found in storage');
        setRouteFavorites([]);
      }
    } catch (error) {
      console.error('❌ Error loading route favorites:', error);
      setRouteFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const saveRouteFavorites = async (newRouteFavorites: FavoriteRoute[]) => {
    try {
      await AsyncStorage.setItem(ROUTE_FAVORITES_KEY, JSON.stringify(newRouteFavorites));
      setRouteFavorites(newRouteFavorites);
      // Emit change event to notify other components
      routeFavoritesEmitter.emit();
      console.log('✅ Route favorites saved:', newRouteFavorites.length, 'routes');
    } catch (error) {
      console.error('❌ Error saving route favorites:', error);
      throw error; // Re-throw so UI can handle the error
    }
  };

  const addRouteFavorite = async (
    name: string,
    pickup: { address: string; latitude?: number; longitude?: number; placeId?: string },
    destination: { address: string; latitude?: number; longitude?: number; placeId?: string }
  ) => {
    try {
      const newRouteFavorite: FavoriteRoute = {
        id: Date.now().toString(),
        name,
        pickup,
        destination,
        createdAt: new Date(),
      };

      console.log('💾 Adding new route favorite:', {
        name,
        pickup: pickup.address,
        destination: destination.address
      });

      const newRouteFavorites = [newRouteFavorite, ...routeFavorites];
      await saveRouteFavorites(newRouteFavorites);
      
      console.log('✅ Route favorite added successfully');
      return newRouteFavorite;
    } catch (error) {
      console.error('❌ Error adding route favorite:', error);
      throw error;
    }
  };

  const removeRouteFavorite = async (id: string) => {
    try {
      console.log('🗑️ Removing route favorite:', id);
      const newRouteFavorites = routeFavorites.filter(route => route.id !== id);
      await saveRouteFavorites(newRouteFavorites);
      console.log('✅ Route favorite removed successfully');
    } catch (error) {
      console.error('❌ Error removing route favorite:', error);
      throw error;
    }
  };

  const updateRouteFavorite = async (id: string, updates: Partial<FavoriteRoute>) => {
    try {
      console.log('✏️ Updating route favorite:', id);
      const newRouteFavorites = routeFavorites.map(route =>
        route.id === id ? { ...route, ...updates } : route
      );
      await saveRouteFavorites(newRouteFavorites);
      console.log('✅ Route favorite updated successfully');
    } catch (error) {
      console.error('❌ Error updating route favorite:', error);
      throw error;
    }
  };

  return {
    routeFavorites,
    loading,
    addRouteFavorite,
    removeRouteFavorite,
    updateRouteFavorite,
    refresh: loadRouteFavorites,
  };
}