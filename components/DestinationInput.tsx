import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Navigation } from 'lucide-react-native';

interface DestinationInputProps {
  onDestinationChange: (destination: string, coordinates?: { latitude: number; longitude: number }) => void;
}

export function DestinationInput({ onDestinationChange }: DestinationInputProps) {
  const [destination, setDestination] = useState<string>('Rua do Catete 214, Rio de Janeiro');

  // Initialize with default destination
  useEffect(() => {
    onDestinationChange('Rua do Catete 214, Rio de Janeiro', {
      latitude: -22.9249,
      longitude: -43.1777,
    });
  }, []);

  const handleDestinationChange = (text: string) => {
    setDestination(text);
    onDestinationChange(text, {
      latitude: -22.9249,
      longitude: -43.1777,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>🎯 Destino</Text>
      
      <View style={styles.inputContainer}>
        <Navigation size={20} color="#6b7280" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={destination}
          onChangeText={handleDestinationChange}
          placeholder="Digite seu destino..."
          placeholderTextColor="#9ca3af"
          multiline
        />
      </View>
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
});