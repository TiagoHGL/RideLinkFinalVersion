import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  FlatList,
  Dimensions,
} from 'react-native';
import { Check, Palette, X, Sun, Moon, Smartphone } from 'lucide-react-native';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');

interface ThemeOption {
  mode: ThemeMode;
  name: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

export function ThemeSelector() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const themeOptions: ThemeOption[] = [
    {
      mode: 'light',
      name: t('theme.light'),
      description: t('theme.lightDescription'),
      icon: Sun,
    },
    {
      mode: 'dark',
      name: t('theme.dark'),
      description: t('theme.darkDescription'),
      icon: Moon,
    },
    {
      mode: 'auto',
      name: t('theme.auto'),
      description: t('theme.autoDescription'),
      icon: Smartphone,
    },
  ];

  const currentTheme = themeOptions.find(option => option.mode === themeMode);

  const handleThemeSelect = async (selectedMode: ThemeMode) => {
    if (selectedMode === themeMode) {
      setModalVisible(false);
      return;
    }

    setIsChanging(true);
    try {
      await setThemeMode(selectedMode);
    } catch (error) {
      console.error('Error changing theme:', error);
    } finally {
      setIsChanging(false);
      setModalVisible(false);
    }
  };

  const renderThemeOption = ({ item }: { item: ThemeOption }) => {
    const isSelected = item.mode === themeMode;
    const IconComponent = item.icon;
    
    return (
      <TouchableOpacity
        style={[
          styles.themeOption,
          { 
            backgroundColor: theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
          isSelected && { borderWidth: 2 }
        ]}
        onPress={() => handleThemeSelect(item.mode)}
        disabled={isChanging}
      >
        <View style={styles.themeInfo}>
          <View style={[styles.themeIconContainer, { backgroundColor: theme.colors.background }]}>
            <IconComponent 
              size={24} 
              color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </View>
          <View style={styles.themeText}>
            <Text style={[
              styles.themeName, 
              { color: isSelected ? theme.colors.primary : theme.colors.text }
            ]}>
              {item.name}
            </Text>
            <Text style={[
              styles.themeDescription, 
              { color: isSelected ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              {item.description}
            </Text>
          </View>
        </View>
        {isSelected && (
          <Check size={20} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selectorButton, { backgroundColor: theme.colors.surface }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <View style={[styles.selectorIconContainer, { backgroundColor: theme.colors.background }]}>
            {currentTheme && <currentTheme.icon size={20} color={theme.colors.primary} />}
          </View>
          <View style={styles.selectorText}>
            <Text style={[styles.selectorValue, { color: theme.colors.text }]}>
              {currentTheme?.name}
            </Text>
            <Text style={[styles.selectorDescription, { color: theme.colors.textSecondary }]}>
              {currentTheme?.description}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('settings.theme')}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              {t('settings.themeSubtitle')}
            </Text>
            
            <FlatList
              data={themeOptions}
              renderItem={renderThemeOption}
              keyExtractor={(item) => item.mode}
              style={styles.themeList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectorText: {
    flex: 1,
  },
  selectorValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 2,
  },
  selectorDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  themeList: {
    flex: 1,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  themeText: {
    flex: 1,
  },
  themeName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  themeDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 18,
  },
});