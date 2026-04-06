import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useWebSocket } from '../../hooks/useWebSocket';
import { submitSOSRequest, getUserRequests } from '../../api/client';
import { colors, fontSize, spacing, shadows } from '../../styles/theme';

const requestTypes = [
  { id: 'police', label: 'Police', icon: Shield, color: colors.primary[600] },
  { id: 'fire', label: 'Fire Emergency', icon: AlertTriangle, color: '#f97316' },
  { id: 'medical', label: 'Medical Help', icon: AlertCircle, color: '#10b981' },
  { id: 'ngo', label: 'NGO Support', icon: Users, color: '#a855f7' },
];

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { location, error: locationError, loading: locationLoading, getLocation } = useGeolocation();
  const { connected: wsConnected } = useWebSocket(user);

  const [selectedType, setSelectedType] = useState('police');
  const [sosActive, setSosActive] = useState(false);
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const submittingRef = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadRequestHistory();
    getLocation();

    // Auto-refresh when WebSocket disconnected
    const historyRefreshInterval = setInterval(
      () => {
        if (!wsConnected) {
          loadRequestHistory();
        }
      },
      wsConnected ? 30000 : 3000
    );

    return () => clearInterval(historyRefreshInterval);
  }, [wsConnected]);

  useEffect(() => {
    // Cleanup countdown on unmount
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Pulse animation for SOS button
  useEffect(() => {
    if (sosActive || countdown > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [sosActive, countdown]);

  const loadRequestHistory = useCallback(async () => {
    try {
      const response = await getUserRequests();
      setRequestHistory(response.requests || []);
    } catch (error) {
      console.error('Error loading request history:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRequestHistory(), getLocation()]);
    setRefreshing(false);
  }, []);

  const startCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setCountdown(5);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          setSosActive(false);
          setSuccessMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSOSClick = async () => {
    if (submittingRef.current || sosActive || sendingRequest || countdown > 0) return;

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSendingRequest(true);
    setLoading(true);

    if (!location) {
      await getLocation();
      setTimeout(() => sendSOSRequestHandler(), 1000);
    } else {
      sendSOSRequestHandler();
    }
  };

  const sendSOSRequestHandler = async () => {
    if (submittingRef.current) return;

    if (!location) {
      Alert.alert(
        'Location Required',
        'Unable to get your location. Please enable location access and try again.'
      );
      setLoading(false);
      setSendingRequest(false);
      return;
    }

    submittingRef.current = true;
    setSosActive(true);

    try {
      const selectedTypeData = requestTypes.find((t) => t.id === selectedType);
      const requestData = {
        type: selectedTypeData?.label || 'Police',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
      };

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const response = await submitSOSRequest(requestData);

      setSuccessMessage('SOS Alert sent successfully! Help is on the way.');

      setTimeout(() => setSuccessMessage(''), 3000);

      loadRequestHistory();
      startCountdown();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', `Failed to send SOS: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSosActive(false);
      setCountdown(0);
    } finally {
      setLoading(false);
      setSendingRequest(false);
      submittingRef.current = false;
    }
  };

  const statistics = {
    total: requestHistory.length,
    pending: requestHistory.filter((r) => r.status === 'pending').length,
    completed: requestHistory.filter((r) => r.status === 'completed').length,
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back, {user?.name || 'User'}</Text>
          <Text style={styles.subtitle}>Stay safe and connected</Text>
        </View>
        <View style={styles.statusBadge}>
          {wsConnected ? (
            <Wifi color={colors.success[500]} size={20} />
          ) : (
            <WifiOff color={colors.dark[500]} size={20} />
          )}
        </View>
      </View>

      {/* Success Message */}
      {successMessage ? (
        <View style={styles.successBox}>
          <CheckCircle color={colors.success[500]} size={20} />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.primary[500] + '20' }]}>
          <Text style={styles.statValue}>{statistics.total}</Text>
          <Text style={styles.statLabel}>Total Requests</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Text style={styles.statValue}>{statistics.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#10b98120' }]}>
          <Text style={styles.statValue}>{statistics.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Emergency Type Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Emergency Type</Text>
        <View style={styles.typeSelector}>
          {requestTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  isSelected && { backgroundColor: type.color, borderColor: type.color },
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <Icon color={isSelected ? '#fff' : colors.dark[400]} size={24} />
                <Text style={[styles.typeLabel, isSelected && { color: '#fff' }]}>{type.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SOS Button */}
      <View style={styles.sosSection}>
        <Text style={styles.sosTitle}>Emergency Assistance</Text>
        <Text style={styles.sosDesc}>Tap the SOS button to instantly alert emergency services</Text>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSOSClick}
            disabled={loading || sosActive || countdown > 0}
            style={styles.sosButtonWrapper}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.sosButton}>
                {loading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : countdown > 0 ? (
                  <Text style={styles.countdownText}>{countdown}</Text>
                ) : (
                  <>
                    <Shield color="#fff" size={64} strokeWidth={2} />
                    <Text style={styles.sosButtonText}>SOS</Text>
                  </>
                )}
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {sosActive && countdown > 0 && (
          <Text style={styles.sosActiveText}>Alert sent! Countdown: {countdown}s</Text>
        )}
      </View>

      {/* Location Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Status</Text>
        <View style={styles.locationCard}>
          <MapPin color={location ? colors.success[500] : colors.dark[500]} size={24} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            {locationLoading ? (
              <Text style={styles.locationText}>Getting your location...</Text>
            ) : location ? (
              <>
                <Text style={styles.locationText}>Location Acquired</Text>
                <Text style={styles.locationCoords}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
                {location.accuracy && (
                  <Text style={styles.locationAccuracy}>Accuracy: ±{Math.round(location.accuracy)}m</Text>
                )}
              </>
            ) : (
              <Text style={styles.locationText}>Location Unknown</Text>
            )}
          </View>
          {!location && (
            <TouchableOpacity style={styles.locationButton} onPress={getLocation}>
              <Text style={styles.locationButtonText}>Get Location</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recent Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Requests</Text>
        {requestHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No previous requests</Text>
          </View>
        ) : (
          requestHistory.slice(0, 5).map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestType}>{request.type}</Text>
                <View
                  style={[
                    styles.statusBadgeSmall,
                    request.status === 'completed' && { backgroundColor: colors.success[500] + '20' },
                    request.status === 'pending' && { backgroundColor: colors.warning[500] + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      request.status === 'completed' && { color: colors.success[500] },
                      request.status === 'pending' && { color: colors.warning[500] },
                    ]}
                  >
                    {request.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.requestDetails}>
                <Clock color={colors.dark[500]} size={14} />
                <Text style={styles.requestTime}>{formatTimeAgo(request.created_at)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark[950],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  greeting: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.dark[400],
    marginTop: spacing.xs,
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[500] + '20',
    borderWidth: 1,
    borderColor: colors.success[500],
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  successText: {
    color: colors.success[500],
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.dark[400],
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#fff',
    marginBottom: spacing.md,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark[800],
    borderWidth: 2,
    borderColor: colors.dark[700],
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    minWidth: '48%',
  },
  typeLabel: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
    fontWeight: '600',
  },
  sosSection: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  sosTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  sosDesc: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  sosButtonWrapper: {
    marginVertical: spacing.lg,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  sosButtonText: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    color: '#fff',
    marginTop: spacing.sm,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#fff',
  },
  sosActiveText: {
    fontSize: fontSize.base,
    color: colors.success[500],
    marginTop: spacing.md,
    fontWeight: '600',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark[800],
    borderWidth: 1,
    borderColor: colors.dark[700],
    borderRadius: 12,
    padding: spacing.md,
  },
  locationText: {
    fontSize: fontSize.base,
    color: '#fff',
    fontWeight: '600',
  },
  locationCoords: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
    marginTop: spacing.xs,
  },
  locationAccuracy: {
    fontSize: fontSize.xs,
    color: colors.dark[500],
    marginTop: spacing.xs,
  },
  locationButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.dark[500],
  },
  requestCard: {
    backgroundColor: colors.dark[800],
    borderWidth: 1,
    borderColor: colors.dark[700],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requestType: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  requestDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  requestTime: {
    fontSize: fontSize.sm,
    color: colors.dark[500],
  },
});

export default DashboardScreen;
