import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { GradientBackground } from '@/components/GradientBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const { t } = useLanguage();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const shakeAnimation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const animatedShakeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeAnimation.value }],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      return;
    }

    setIsLoading(true);
    setError('');
    buttonScale.value = withSpring(0.95);

    const result = await resetPassword(email.trim());

    if (result.success) {
      setSuccess(true);
      buttonScale.value = withSpring(1);
    } else {
      setError(result.error || 'Failed to send reset email');
      buttonScale.value = withSpring(1);
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }

    setIsLoading(false);
  };

  if (success) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.successContainer}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2' }}
              style={styles.logo}
            />
            <View style={styles.successCard}>
              <Send size={48} color="#10b981" style={styles.successIcon} />
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successText}>
                We've sent a password reset link to{'\n'}
                <Text style={styles.emailText}>{email}</Text>
              </Text>
              <Text style={styles.instructionText}>
                Click the link in the email to reset your password. If you don't see the email, check your spam folder.
              </Text>
              
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={20} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.backButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backIconButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <Image
                source={{ uri: 'https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2' }}
                style={styles.logo}
              />
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you a link to reset your password
              </Text>
            </View>

            {/* Reset Form */}
            <Animated.View style={[styles.formContainer, animatedShakeStyle]}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email address"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <Animated.View style={animatedButtonStyle}>
                <TouchableOpacity
                  style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  <Send size={20} color="#ffffff" style={styles.buttonIcon} />
                  <Text style={styles.resetButtonText}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>What happens next?</Text>
                <Text style={styles.infoText}>
                  1. Check your email inbox{'\n'}
                  2. Click the reset link we send you{'\n'}
                  3. Create a new password{'\n'}
                  4. Sign in with your new password
                </Text>
              </View>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Remember your password?{' '}
                <Link href="/(auth)/login" asChild>
                  <Text style={styles.footerLink}>Sign In</Text>
                </Link>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    minHeight: screenHeight * 0.9,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
    position: 'relative',
  },
  backIconButton: {
    position: 'absolute',
    left: 0,
    top: 20,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: Math.min(screenWidth * 0.08, 32),
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#374151',
    height: '100%',
  },
  resetButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  resetButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  resetButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  infoContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  infoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0369a1',
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  footerLink: {
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    width: '100%',
    maxWidth: 400,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  successText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  emailText: {
    fontFamily: 'Inter-SemiBold',
    color: '#3b82f6',
  },
  instructionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
  },
});