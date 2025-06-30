import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FavoriteDestination {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  createdAt: Date;
}

const FAVORITES_KEY = 'ride_launcher_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteDestination[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from storage
  useEffect(() => {
    loadFavorites().catch((error) => {
      console.error('❌ Failed to load favorites:', error);
      setLoading(false);
    });
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(parsed.map((fav: any) => ({
          ...fav,
          createdAt: new Date(fav.createdAt),
        })));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      // Don't throw, just use empty array
    } finally {
      setLoading(false);
    }
  };

  const saveFavorites = async (newFavorites: FavoriteDestination[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
      throw error; // Re-throw so UI can handle the error
    }
  };

  const addFavorite = async (name: string, address: string, coordinates?: { latitude: number; longitude: number }, placeId?: string) => {
    try {
      const newFavorite: FavoriteDestination = {
        id: Date.now().toString(),
        name,
        address,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        placeId,
        createdAt: new Date(),
      };

      const newFavorites = [newFavorite, ...favorites];
      await saveFavorites(newFavorites);
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const newFavorites = favorites.filter(fav => fav.id !== id);
      await saveFavorites(newFavorites);
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  };

  const updateFavorite = async (id: string, updates: Partial<FavoriteDestination>) => {
    try {
      const newFavorites = favorites.map(fav =>
        fav.id === id ? { ...fav, ...updates } : fav
      );
      await saveFavorites(newFavorites);
    } catch (error) {
      console.error('Error updating favorite:', error);
      throw error;
    }
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    updateFavorite,
    refresh: loadFavorites,
  };
}