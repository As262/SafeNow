import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Shield, PhoneCall, Building2, Lock, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { sendOTP, verifyOTP, serviceLogin } from '../../api/client';
import { colors, fontSize, spacing } from '../../styles/theme';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [loginMode, setLoginMode] = useState<'user' | 'service'>('user');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  const handleSendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      // Validate mobile number
      if (!/^\d{10}$/.test(mobile)) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }

      const response = await sendOTP(mobile);
      setDemoOtp(response.otp); // Store for demo display
      setStep('otp');
      Alert.alert('Success', `OTP sent to ${mobile}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    setLoading(true);

    try {
      if (otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      const response = await verifyOTP(mobile, otp);

      // Login user with token
      await login(response.user, response.token, response.refresh);

      // Navigation handled by AppNavigator based on auth state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Validate service ID format (7-digit pin)
      if (!/^(100|200|300|400|500)\d{4}$/.test(serviceId)) {
        throw new Error('Invalid Service ID. Must be a 7-digit pin (e.g., 1004782)');
      }

      const response = await serviceLogin(serviceId, password);

      // Login user with token
      await login(response.user, response.token, response.refresh);

      // Navigation handled by AppNavigator based on role
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setOtp('');
    try {
      const response = await sendOTP(mobile);
      setDemoOtp(response.otp);
      Alert.alert('Success', 'OTP resent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    }
  };

  const toggleLoginMode = () => {
    setLoginMode(loginMode === 'user' ? 'service' : 'user');
    setError('');
    setStep('mobile');
    setOtp('');
    setServiceId('');
    setPassword('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[colors.dark[950], colors.dark[900], colors.dark[950]]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={[colors.primary[500], colors.primary[700]]}
              style={styles.logo}
            >
              <Shield color="#fff" size={48} />
            </LinearGradient>
            <Text style={styles.appName}>SafeNow</Text>
            <Text style={styles.tagline}>Your Safety, Our Priority</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            {loginMode === 'user' ? (
              // USER LOGIN (OTP)
              step === 'mobile' ? (
                <View>
                  <Text style={styles.title}>Welcome Back</Text>
                  <Text style={styles.subtitle}>Sign in to access emergency services</Text>

                  {/* Demo Credentials */}
                  <View style={styles.demoBox}>
                    <View style={styles.demoHeader}>
                      <View style={styles.demoIcon}>
                        <AlertCircle color={colors.primary[400]} size={20} />
                      </View>
                      <Text style={styles.demoTitle}>Demo Credentials for Testing</Text>
                    </View>
                    <View style={styles.demoContent}>
                      <View style={styles.demoItem}>
                        <Text style={styles.demoLabel}>Mobile Number:</Text>
                        <Text style={styles.demoValue}>1234567890</Text>
                      </View>
                      <View style={styles.demoItem}>
                        <Text style={styles.demoLabel}>OTP Code:</Text>
                        <Text style={styles.demoValue}>000000</Text>
                      </View>
                    </View>
                  </View>

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.inputContainer}>
                    <PhoneCall color={colors.dark[400]} size={20} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter mobile number"
                      placeholderTextColor={colors.dark[500]}
                      value={mobile}
                      onChangeText={(text) => setMobile(text.replace(/\D/g, '').slice(0, 10))}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSendOTP}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                // OTP VERIFICATION
                <View>
                  <Text style={styles.title}>Verify OTP</Text>
                  <Text style={styles.subtitle}>Enter the 6-digit code sent to {mobile}</Text>

                  {demoOtp && (
                    <View style={styles.demoBox}>
                      <Text style={styles.demoLabel}>Demo OTP:</Text>
                      <Text style={styles.demoValue}>{demoOtp}</Text>
                    </View>
                  )}

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.inputContainer}>
                    <Lock color={colors.dark[400]} size={20} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter OTP"
                      placeholderTextColor={colors.dark[500]}
                      value={otp}
                      onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify & Login</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.otpActions}>
                    <TouchableOpacity onPress={() => setStep('mobile')}>
                      <Text style={styles.linkText}>Change Number</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleResendOTP}>
                      <Text style={styles.linkText}>Resend OTP</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            ) : (
              // SERVICE PROVIDER LOGIN
              <View>
                <Text style={styles.title}>Service Provider Login</Text>
                <Text style={styles.subtitle}>Login with your service credentials</Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputContainer}>
                  <Building2 color={colors.dark[400]} size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Service ID (e.g., 1004782)"
                    placeholderTextColor={colors.dark[500]}
                    value={serviceId}
                    onChangeText={(text) => setServiceId(text.replace(/\D/g, '').slice(0, 7))}
                    keyboardType="number-pad"
                    maxLength={7}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Lock color={colors.dark[400]} size={20} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.dark[500]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleServiceLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Login</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Toggle Login Mode */}
            <TouchableOpacity style={styles.toggleButton} onPress={toggleLoginMode}>
              <Text style={styles.toggleText}>
                {loginMode === 'user'
                  ? 'Login as Service Provider →'
                  : '← Back to User Login'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fontSize.lg,
    color: colors.dark[400],
  },
  card: {
    backgroundColor: colors.dark[900],
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.dark[800],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.dark[400],
    marginBottom: spacing.lg,
  },
  demoBox: {
    backgroundColor: colors.primary[500] + '10',
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  demoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500] + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  demoTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#fff',
  },
  demoContent: {
    gap: spacing.sm,
  },
  demoItem: {
    backgroundColor: colors.dark[800] + '80',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dark[700],
  },
  demoLabel: {
    fontSize: fontSize.xs,
    color: colors.dark[400],
    marginBottom: 4,
  },
  demoValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary[400],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorBox: {
    backgroundColor: colors.error[500] + '20',
    borderWidth: 1,
    borderColor: colors.error[500],
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error[500],
    fontSize: fontSize.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark[800],
    borderWidth: 1,
    borderColor: colors.dark[700],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: fontSize.base,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  linkText: {
    color: colors.primary[500],
    fontSize: fontSize.sm,
  },
  toggleButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.primary[500],
    fontSize: fontSize.base,
  },
  termsText: {
    fontSize: fontSize.xs,
    color: colors.dark[500],
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default LoginScreen;
