import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { User, Mail, Calendar, CreditCard as Edit3, Save, X, LogOut, Shield, Clock } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);

  const editScale = useSharedValue(1);

  const animatedEditStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: editScale.value }],
    };
  });

  const handleEditToggle = () => {
    editScale.value = withSpring(isEditing ? 1 : 0.95);
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedName(user?.name || '');
    }
  };

  const handleSave = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setIsLoading(true);
    const result = await updateProfile({ name: editedName.trim() });
    
    if (result.success) {
      setIsEditing(false);
      editScale.value = withSpring(1);
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
    
    setIsLoading(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={40} color={styles.avatarIconColor.color} />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Shield size={16} color={styles.badgeColor.color} />
              </View>
            </View>

            <View style={styles.profileInfo}>
              {isEditing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Enter your name"
                    placeholderTextColor={styles.placeholderColor.color}
                    autoFocus
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleEditToggle}
                      disabled={isLoading}
                    >
                      <X size={16} color={styles.cancelIconColor.color} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}
                      disabled={isLoading}
                    >
                      <Save size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Animated.View style={animatedEditStyle}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={handleEditToggle}
                    >
                      <Edit3 size={16} color={styles.editIconColor.color} />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}
              
              <View style={styles.emailContainer}>
                <Mail size={16} color={styles.emailIconColor.color} />
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
          </View>

          {/* Account Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Calendar size={20} color={styles.calendarIconColor.color} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Member Since</Text>
                <Text style={styles.detailValue}>{formatDate(user.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Clock size={20} color={styles.clockIconColor.color} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Last Sign In</Text>
                <Text style={styles.detailValue}>{formatDate(user.lastLoginAt)}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Shield size={20} color={styles.shieldIconColor.color} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Account Status</Text>
                <View style={styles.statusContainer}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Your RideLink Stats</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Rides Booked</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.id === '1' ? '3' : '0'}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Apps Used</Text>
              </View>
            </View>
          </View>

          {/* Demo Notice */}
          {user.email === 'demo@ridelink.com' && (
            <View style={styles.demoNotice}>
              <Text style={styles.demoTitle}>Demo Account</Text>
              <Text style={styles.demoText}>
                You're using a demo account. Some features may be limited or simulated.
              </Text>
            </View>
          )}
        </ScrollView>
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
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.colors.background,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.background,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: theme.colors.text,
    marginRight: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : '#f0f9ff',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  nameInput: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  detailsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginRight: 8,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: theme.colors.success,
  },
  statsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  demoNotice: {
    backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.1)' : '#fef3c7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.2)' : '#fbbf24',
  },
  demoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.warning,
    marginBottom: 8,
    textAlign: 'center',
  },
  demoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: theme.colors.warning,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Color helpers
  avatarIconColor: {
    color: theme.colors.textSecondary,
  },
  badgeColor: {
    color: theme.colors.success,
  },
  placeholderColor: {
    color: theme.colors.textTertiary,
  },
  cancelIconColor: {
    color: theme.colors.textSecondary,
  },
  editIconColor: {
    color: theme.colors.primary,
  },
  emailIconColor: {
    color: theme.colors.textSecondary,
  },
  calendarIconColor: {
    color: theme.colors.primary,
  },
  clockIconColor: {
    color: theme.colors.success,
  },
  shieldIconColor: {
    color: theme.colors.warning,
  },
});