import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeSelector } from '@/components/ThemeSelector';
import { AppManagerModal } from '@/components/AppManagerModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { 
  Settings as SettingsIcon, 
  MapPin, 
  Info, 
  ExternalLink, 
  Star,
  Smartphone,
  Palette,
  Cog,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [showAppManager, setShowAppManager] = useState(false);

  const handleLocationSettings = () => {
    Alert.alert(
      t('locationSettings.title'),
      t('locationSettings.content'),
      [
        { text: t('alert.ok') },
        { 
          text: t('alert.openSettings'), 
          onPress: () => {
            if (Linking.openSettings) {
              Linking.openSettings();
            } else {
              Alert.alert(t('settings.locationServices'), t('locationSettings.openSettings'));
            }
          }
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      t('about.title'),
      t('about.content'),
      [{ text: t('alert.ok') }]
    );
  };

  const handleFeedback = () => {
    Alert.alert(
      t('feedback.title'),
      t('feedback.content'),
      [{ text: t('alert.ok') }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    color,
    children 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    color?: string;
    children?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, color && { color }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        {children}
      </View>
      {onPress && <ExternalLink size={16} color={styles.externalLinkColor.color} />}
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.appSettings')}</Text>
              
              <SettingItem
                icon={<Palette size={20} color={styles.iconColor.color} />}
                title={t('settings.theme')}
                subtitle={t('settings.themeSubtitle')}
              >
                <View style={styles.themeSelectorContainer}>
                  <ThemeSelector />
                </View>
              </SettingItem>
              
              <SettingItem
                icon={<SettingsIcon size={20} color={styles.iconColor.color} />}
                title={t('settings.language')}
                subtitle={t('settings.languageSubtitle')}
              >
                <View style={styles.languageSelectorContainer}>
                  <LanguageSelector showLabel={false} />
                </View>
              </SettingItem>

              <SettingItem
                icon={<Cog size={20} color={styles.iconColor.color} />}
                title={t('appManager.title')}
                subtitle={t('appManager.subtitle')}
                onPress={() => setShowAppManager(true)}
              />
              
              <SettingItem
                icon={<MapPin size={20} color={styles.iconColor.color} />}
                title={t('settings.locationServices')}
                subtitle={t('settings.locationServicesSubtitle')}
                onPress={handleLocationSettings}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
              
              <SettingItem
                icon={<Info size={20} color={styles.secondaryIconColor.color} />}
                title={t('settings.about')}
                subtitle={t('settings.aboutSubtitle')}
                onPress={handleAbout}
              />
              
              <SettingItem
                icon={<Star size={20} color={styles.starColor.color} />}
                title={t('settings.feedback')}
                subtitle={t('settings.feedbackSubtitle')}
                onPress={handleFeedback}
              />
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoBox}>
                <Smartphone size={24} color={styles.infoIconColor.color} />
                <Text style={styles.infoTitle}>{t('settings.howItWorks')}</Text>
                <Text style={styles.infoText}>
                  {t('settings.howItWorksText')}
                </Text>
              </View>

              <View style={styles.supportedApps}>
                <Text style={styles.supportedTitle}>{t('settings.supportedApps')}</Text>
                <View style={styles.appsList}>
                  <View style={styles.appItem}>
                    <Text style={styles.appIcon}>🚗</Text>
                    <Text style={styles.appName}>Uber</Text>
                  </View>
                  <View style={styles.appItem}>
                    <Text style={styles.appIcon}>🟡</Text>
                    <Text style={styles.appName}>99</Text>
                  </View>
                  <View style={styles.appItem}>
                    <Text style={styles.appIcon}>🟣</Text>
                    <Text style={styles.appName}>Lyft</Text>
                  </View>
                  <View style={styles.appItem}>
                    <Text style={styles.appIcon}>⚡</Text>
                    <Text style={styles.appName}>Bolt</Text>
                  </View>
                  <View style={styles.appItem}>
                    <Text style={styles.appIcon}>🟢</Text>
                    <Text style={styles.appName}>Grab</Text>
                  </View>
                  <View style={styles.appItem}>
                    <Text style={styles.appIcon}>🔴</Text>
                    <Text style={styles.appName}>Yandex</Text>
                  </View>
                </View>
              </View>

              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>{t('settings.importantNote')}</Text>
                <Text style={styles.noteText}>
                  {t('settings.importantNoteText')}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <AppManagerModal
          visible={showAppManager}
          onClose={() => setShowAppManager(false)}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  settingIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  themeSelectorContainer: {
    marginTop: 8,
  },
  languageSelectorContainer: {
    marginTop: 8,
  },
  infoSection: {
    marginTop: 16,
  },
  infoBox: {
    backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(59, 130, 246, 0.2)' : '#bae6fd',
  },
  infoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: theme.colors.info,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.info,
    textAlign: 'center',
    lineHeight: 20,
  },
  supportedApps: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  supportedTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  appsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  appItem: {
    alignItems: 'center',
    minWidth: 60,
    marginBottom: 8,
  },
  appIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  appName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  noteBox: {
    backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.1)' : '#fffbeb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.2)' : '#fed7aa',
  },
  noteTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.warning,
    marginBottom: 6,
  },
  noteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: theme.colors.warning,
    lineHeight: 18,
  },
  // Color helpers
  iconColor: {
    color: theme.colors.primary,
  },
  secondaryIconColor: {
    color: theme.colors.textSecondary,
  },
  starColor: {
    color: theme.colors.warning,
  },
  infoIconColor: {
    color: theme.colors.info,
  },
  externalLinkColor: {
    color: theme.colors.textTertiary,
  },
});