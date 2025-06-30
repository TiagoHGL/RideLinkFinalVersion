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
import { Check, Globe, X } from 'lucide-react-native';
import { useLanguage, Language } from '@/contexts/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

const languageOptions: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
];

interface LanguageSelectorProps {
  showLabel?: boolean;
  compact?: boolean;
}

export function LanguageSelector({ showLabel = true, compact = false }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage = languageOptions.find(lang => lang.code === language);

  const handleLanguageSelect = async (selectedLanguage: Language) => {
    if (selectedLanguage === language) {
      setModalVisible(false);
      return;
    }

    setIsChanging(true);
    try {
      await setLanguage(selectedLanguage);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsChanging(false);
      setModalVisible(false);
    }
  };

  const renderLanguageOption = ({ item }: { item: LanguageOption }) => {
    const isSelected = item.code === language;
    
    return (
      <TouchableOpacity
        style={[styles.languageOption, isSelected && styles.selectedOption]}
        onPress={() => handleLanguageSelect(item.code)}
        disabled={isChanging}
      >
        <View style={styles.languageInfo}>
          <Text style={styles.flag}>{item.flag}</Text>
          <View style={styles.languageText}>
            <Text style={[styles.languageName, isSelected && styles.selectedText]}>
              {item.nativeName}
            </Text>
            <Text style={[styles.languageSubname, isSelected && styles.selectedSubtext]}>
              {item.name}
            </Text>
          </View>
        </View>
        {isSelected && (
          <Check size={20} color="#10b981" />
        )}
      </TouchableOpacity>
    );
  };

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.compactFlag}>{currentLanguage?.flag}</Text>
          <Text style={styles.compactCode}>{language.toUpperCase()}</Text>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('settings.language')}</Text>
              <View style={{ width: 24 }} />
            </View>

            <FlatList
              data={languageOptions}
              renderItem={renderLanguageOption}
              keyExtractor={(item) => item.code}
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
            />
          </SafeAreaView>
        </Modal>
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <Globe size={20} color="#3b82f6" />
          <View style={styles.selectorText}>
            {showLabel && (
              <Text style={styles.selectorLabel}>{t('settings.language')}</Text>
            )}
            <Text style={styles.selectorValue}>
              {currentLanguage?.flag} {currentLanguage?.nativeName}
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>{t('alert.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('settings.language')}</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>{t('settings.languageSubtitle')}</Text>
            
            <FlatList
              data={languageOptions}
              renderItem={renderLanguageOption}
              keyExtractor={(item) => item.code}
              style={styles.languageList}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: {
    marginLeft: 16,
    flex: 1,
  },
  selectorLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
  },
  selectorValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6b7280',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
  },
  compactFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  compactCode: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#374151',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  languageList: {
    flex: 1,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
  },
  selectedText: {
    color: '#059669',
  },
  languageSubname: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6b7280',
  },
  selectedSubtext: {
    color: '#10b981',
  },
});