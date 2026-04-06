import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Heart, MapPin, Clock, Navigation, CheckCircle, XCircle, Shield } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useAuth } from '../../contexts/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import {
  toggleHelperMode,
  toggleHelperAvailability,
  getHelperRequests,
  helperRespondToRequest,
} from '../../api/client';
import { colors, fontSize, spacing } from '../../styles/theme';

const HelperModeScreen: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { location, getLocation } = useGeolocation();

  const [isHelper, setIsHelper] = useState(user?.is_helper || false);
  const [available, setAvailable] = useState(user?.helper_available || false);
  const [skills, setSkills] = useState(user?.helper_skills || '');
  const [radius, setRadius] = useState(user?.helper_radius_km?.toString() || '5');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (isHelper && available) {
      getLocation();
      loadRequests();
    }
  }, [isHelper, available]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await getHelperRequests(location?.latitude, location?.longitude);
      setPendingRequests(response.pending_requests || response.requests || []);
      setAcceptedRequests(response.accepted_requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getLocation();
    await loadRequests();
    setRefreshing(false);
  }, []);

  const handleToggleHelper = async () => {
    if (!isHelper) {
      Alert.alert(
        'Become a Helper',
        'As a helper, you will receive notifications about nearby emergencies and can earn points by helping others. Do you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              try {
                setEnabling(true);
                await toggleHelperMode(true, skills, parseInt(radius) || 5);
                setIsHelper(true);
                setAvailable(true);
                updateUser({ ...user!, is_helper: true, helper_available: true });
                Alert.alert('Success', 'Helper mode enabled!');
              } catch (error) {
                Alert.alert('Error', 'Failed to enable helper mode');
              } finally {
                setEnabling(false);
              }
            },
          },
        ]
      );
    } else {
      try {
        setEnabling(true);
        await toggleHelperMode(false, '', 5);
        setIsHelper(false);
        setAvailable(false);
        updateUser({ ...user!, is_helper: false, helper_available: false });
      } catch (error) {
        Alert.alert('Error', 'Failed to disable helper mode');
      } finally {
        setEnabling(false);
      }
    }
  };

  const handleToggleAvailability = async () => {
    try {
      await toggleHelperAvailability(!available);
      setAvailable(!available);
      updateUser({ ...user!, helper_available: !available });
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const handleRespond = async (requestId: string | number, action: 'accept' | 'reject') => {
    try {
      await helperRespondToRequest(requestId, action);
      Alert.alert('Success', action === 'accept' ? 'Request accepted!' : 'Request declined');
      await loadRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to respond to request');
    }
  };

  const openInMaps = (lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={isHelper && available ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} /> : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Helper Mode</Text>
          <Text style={styles.subtitle}>Help people in emergencies and earn rewards</Text>
        </View>

        {/* Helper Toggle */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <View style={[styles.iconCircle, { backgroundColor: isHelper ? colors.primary[500] + '20' : colors.dark[800] }]}>
                  <Heart color={isHelper ? colors.primary[500] : colors.dark[500]} size={24} />
                </View>
                <View>
                  <Text style={styles.toggleLabel}>Helper Mode</Text>
                  <Text style={styles.toggleDesc}>{isHelper ? 'You are a registered helper' : 'Enable to help others'}</Text>
                </View>
              </View>
              {enabling ? (
                <ActivityIndicator color={colors.primary[500]} />
              ) : (
                <Switch
                  value={isHelper}
                  onValueChange={handleToggleHelper}
                  trackColor={{ false: colors.dark[700], true: colors.primary[600] }}
                  thumbColor="#fff"
                />
              )}
            </View>

            {isHelper && (
              <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: colors.dark[800], marginTop: spacing.md, paddingTop: spacing.md }]}>
                <View style={styles.toggleInfo}>
                  <View style={[styles.iconCircle, { backgroundColor: available ? colors.success[500] + '20' : colors.dark[800] }]}>
                    <Shield color={available ? colors.success[500] : colors.dark[500]} size={24} />
                  </View>
                  <View>
                    <Text style={styles.toggleLabel}>Available Now</Text>
                    <Text style={styles.toggleDesc}>{available ? 'Receiving requests' : 'Paused'}</Text>
                  </View>
                </View>
                <Switch
                  value={available}
                  onValueChange={handleToggleAvailability}
                  trackColor={{ false: colors.dark[700], true: colors.success[600] }}
                  thumbColor="#fff"
                />
              </View>
            )}
          </View>
        </View>

        {isHelper && (
          <>
            {/* Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Helper Settings</Text>
              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Skills (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={skills}
                    onChangeText={setSkills}
                    placeholder="e.g., First Aid, CPR, Medical"
                    placeholderTextColor={colors.dark[500]}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Radius (km)</Text>
                  <TextInput
                    style={styles.input}
                    value={radius}
                    onChangeText={setRadius}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor={colors.dark[500]}
                  />
                </View>
              </View>
            </View>

            {/* Pending Requests */}
            {available && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nearby Requests</Text>
                {loading ? (
                  <ActivityIndicator color={colors.primary[500]} />
                ) : pendingRequests.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No pending requests nearby</Text>
                  </View>
                ) : (
                  pendingRequests.map((req) => (
                    <View key={req.id} style={styles.requestCard}>
                      <View style={styles.requestHeader}>
                        <Text style={styles.requestType}>{req.type}</Text>
                        <View style={styles.timeRow}>
                          <Clock color={colors.dark[500]} size={14} />
                          <Text style={styles.timeText}>{formatTimeAgo(req.created_at)}</Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.locationRow} onPress={() => openInMaps(req.latitude, req.longitude)}>
                        <MapPin color={colors.dark[400]} size={16} />
                        <Text style={styles.locationText}>{req.address || `${req.latitude.toFixed(4)}, ${req.longitude.toFixed(4)}`}</Text>
                        <Navigation color={colors.primary[500]} size={16} />
                      </TouchableOpacity>
                      <View style={styles.requestActions}>
                        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRespond(req.id, 'reject')}>
                          <XCircle color={colors.error[500]} size={20} />
                          <Text style={styles.rejectBtnText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleRespond(req.id, 'accept')}>
                          <CheckCircle color="#fff" size={20} />
                          <Text style={styles.acceptBtnText}>Accept</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Accepted Requests */}
            {acceptedRequests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Accepted Requests</Text>
                {acceptedRequests.map((req) => (
                  <View key={req.id} style={[styles.requestCard, { borderColor: colors.success[500] }]}>
                    <View style={styles.requestHeader}>
                      <Text style={styles.requestType}>{req.type}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: colors.success[500] + '20' }]}>
                        <Text style={[styles.statusText, { color: colors.success[500] }]}>ACCEPTED</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.locationRow} onPress={() => openInMaps(req.latitude, req.longitude)}>
                      <MapPin color={colors.dark[400]} size={16} />
                      <Text style={styles.locationText}>{req.address || `${req.latitude.toFixed(4)}, ${req.longitude.toFixed(4)}`}</Text>
                      <Navigation color={colors.primary[500]} size={16} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark[950] },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.dark[800] },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: '#fff', marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.base, color: colors.dark[400] },
  section: { padding: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: '#fff', marginBottom: spacing.md },
  card: { backgroundColor: colors.dark[900], borderWidth: 1, borderColor: colors.dark[800], borderRadius: 12, padding: spacing.md },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  toggleLabel: { fontSize: fontSize.base, fontWeight: '600', color: '#fff' },
  toggleDesc: { fontSize: fontSize.sm, color: colors.dark[500] },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { fontSize: fontSize.sm, color: colors.dark[400], marginBottom: spacing.xs },
  input: { backgroundColor: colors.dark[800], borderWidth: 1, borderColor: colors.dark[700], borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: '#fff', fontSize: fontSize.base },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { fontSize: fontSize.base, color: colors.dark[500] },
  requestCard: { backgroundColor: colors.dark[900], borderWidth: 1, borderColor: colors.dark[800], borderRadius: 12, padding: spacing.md, marginBottom: spacing.md },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  requestType: { fontSize: fontSize.lg, fontWeight: '600', color: '#fff' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  timeText: { fontSize: fontSize.sm, color: colors.dark[500] },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  locationText: { flex: 1, fontSize: fontSize.sm, color: colors.dark[400] },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: 8 },
  rejectBtn: { backgroundColor: colors.error[500] + '20' },
  rejectBtnText: { color: colors.error[500], fontWeight: '600' },
  acceptBtn: { backgroundColor: colors.success[500] },
  acceptBtnText: { color: '#fff', fontWeight: '600' },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: fontSize.xs, fontWeight: '600' },
});

export default HelperModeScreen;
