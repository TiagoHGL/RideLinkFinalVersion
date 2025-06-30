import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, RotateCcw, Smartphone, Download } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { useAppManager, RideAppConfig } from '@/hooks/useAppManager';

const { width: screenWidth } = Dimensions.get('window');

interface AppManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AppManagerModal({ visible, onClose }: AppManagerModalProps) {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { rideApps, loading, toggleAppEnabled, resetToDefaults } = useAppManager();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetToDefaults = () => {
    Alert.alert(
      t('appManager.resetTitle'),
      t('appManager.resetConfirm'),
      [
        { text: t('alert.cancel'), style: 'cancel' },
        {
          text: t('appManager.reset'),
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            await resetToDefaults();
            setIsResetting(false);
          },
        },
      ]
    );
  };

  const renderAppItem = ({ item: app }: { item: RideAppConfig }) => (
    <View style={styles.appItem}>
      <View style={styles.appInfo}>
        <View style={[styles.appIconContainer, { backgroundColor: app.color + '20' }]}>
          <Text style={styles.appIcon}>{app.icon}</Text>
        </View>
        <View style={styles.appDetails}>
          <Text style={styles.appName}>{app.name}</Text>
          <Text style={styles.appDescription}>
            {app.enabled ? t('appManager.enabled') : t('appManager.disabled')}
          </Text>
        </View>
      </View>
      <Switch
        value={app.enabled}
        onValueChange={() => toggleAppEnabled(app.id)}
        trackColor={{
          false: styles.switchTrackFalse.backgroundColor,
          true: styles.switchTrackTrue.backgroundColor,
        }}
        thumbColor={app.enabled ? styles.switchThumbTrue.color : styles.switchThumbFalse.color}
        disabled={loading}
      />
    </View>
  );

  const enabledCount = rideApps.filter(app => app.enabled).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={styles.closeIconColor.color} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t('appManager.title')}</Text>
          <TouchableOpacity
            onPress={handleResetToDefaults}
            style={styles.resetButton}
            disabled={isResetting}
          >
            <RotateCcw size={20} color={styles.resetIconColor.color} />
          </TouchableOpacity>
        </View>

        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}>
          <View style={styles.summaryCard}>
            <Smartphone size={24} color={styles.summaryIconColor.color} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>{t('appManager.summary')}</Text>
              <Text style={styles.summaryDescription}>
                {t('appManager.enabledApps', { count: enabledCount, total: rideApps.length })}
              </Text>
            </View>
          </View>

          <View style={styles.instructionsCard}>
            <Download size={20} color={styles.instructionIconColor.color} />
            <Text style={styles.instructionsText}>
              {t('appManager.instructions')}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>{t('appManager.availableApps')}</Text>

          <FlatList
            data={rideApps}
            renderItem={renderAppItem}
            keyExtractor={(item) => item.id}
            style={styles.appsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.appsListContent}
          />

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>{t('appManager.note')}</Text>
            <Text style={styles.noteText}>
              {t('appManager.noteDescription')}
            </Text>
          </View>
        </View>
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
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: theme.colors.text,
  },
  resetButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#bae6fd',
  },
  summaryText: {
    marginLeft: 12,
    flex: 1,
  },
  summaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.info,
    marginBottom: 4,
  },
  summaryDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.info,
    lineHeight: 18,
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0',
  },
  instructionsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.success,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 16,
  },
  appsList: {
    flex: 1,
  },
  appsListContent: {
    paddingBottom: 20,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appIcon: {
    fontSize: 24,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 2,
  },
  appDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  noteCard: {
    backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.1)' : '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.2)' : '#fed7aa',
    marginTop: 16,
  },
  noteTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.warning,
    marginBottom: 8,
  },
  noteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: theme.colors.warning,
    lineHeight: 18,
  },
  // Color helpers
  closeIconColor: {
    color: theme.colors.textSecondary,
  },
  resetIconColor: {
    color: theme.colors.primary,
  },
  summaryIconColor: {
    color: theme.colors.info,
  },
  instructionIconColor: {
    color: theme.colors.success,
  },
  switchTrackFalse: {
    backgroundColor: theme.colors.border,
  },
  switchTrackTrue: {
    backgroundColor: theme.colors.primary,
  },
  switchThumbFalse: {
    color: theme.colors.textTertiary,
  },
  switchThumbTrue: {
    color: '#ffffff',
  },
});