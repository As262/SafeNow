import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import * as Linking from 'expo-linking';
import {
  Shield,
  LogOut,
  User,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Activity,
  TrendingUp,
  AlertCircle,
  Navigation,
  Building2,
  BarChart3,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getAllSOSRequests, updateRequestStatus, getAnalytics } from '../../api/client';
import { colors, fontSize, spacing } from '../../styles/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

interface SOSRequest {
  id: string | number;
  type: string;
  status: string;
  userName?: string;
  userId?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp?: string;
  created_at?: string;
  respondedByName?: string;
}

interface Analytics {
  averageResponseTime?: string;
  completedToday?: number;
  totalRequests?: number;
  requestsByType?: Record<string, number>;
  requestsByStatus?: Record<string, number>;
}

type TabType = 'requests' | 'analytics';

const AdminDashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SOSRequest | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadRequests = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await getAllSOSRequests();
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await getAnalytics();
      setAnalytics(response.analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  useEffect(() => {
    loadRequests();
    loadAnalytics();

    // Auto-refresh every 10 seconds
    const refreshInterval = setInterval(() => {
      loadRequests(true);
      loadAnalytics();
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRequests(true), loadAnalytics()]);
    setRefreshing(false);
  }, []);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedRequests = requests.filter((r) => r.status === 'accepted');

  const handleAcceptRequest = async (requestId: string | number) => {
    try {
      setActionLoading(String(requestId));
      await updateRequestStatus(requestId, 'accepted');
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: 'accepted' } : req
        )
      );
      Alert.alert('Success', 'Request accepted successfully!');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to accept request: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string | number) => {
    try {
      setActionLoading(String(requestId));
      await updateRequestStatus(requestId, 'rejected');
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: 'rejected' } : req
        )
      );
      Alert.alert('Info', 'Request rejected');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to reject request: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openDirections = (lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  const callNumber = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    return `${diffHours}h ago`;
  };

  const renderPendingRequest = (request: SOSRequest) => {
    const isActionLoading = actionLoading === String(request.id);
    const isSelected = selectedRequest?.id === request.id;

    return (
      <TouchableOpacity
        key={request.id}
        style={[styles.requestCard, isSelected && styles.requestCardSelected]}
        onPress={() => setSelectedRequest(request)}
        activeOpacity={0.7}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestUserInfo}>
            <Text style={styles.requestUserName}>{request.userName || 'Unknown'}</Text>
            <TouchableOpacity style={styles.phoneRow} onPress={() => callNumber(request.userId || '')}>
              <Phone color={colors.dark[400]} size={12} />
              <Text style={styles.phoneText}>{request.userId}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{request.type}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <MapPin color={colors.dark[500]} size={14} />
          <Text style={styles.locationText} numberOfLines={1}>
            {request.location?.address ||
              `${request.location?.latitude?.toFixed(4) || '—'}, ${request.location?.longitude?.toFixed(4) || '—'}`}
          </Text>
        </View>

        <View style={styles.timeRow}>
          <Clock color={colors.dark[500]} size={14} />
          <Text style={styles.timeText}>
            {formatTimestamp(request.timestamp || request.created_at || '')}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.acceptBtn, isActionLoading && styles.btnDisabled]}
            onPress={() => handleAcceptRequest(request.id)}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <CheckCircle color="#fff" size={16} />
                <Text style={styles.acceptBtnText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectBtn, isActionLoading && styles.btnDisabled]}
            onPress={() => handleRejectRequest(request.id)}
            disabled={isActionLoading}
          >
            <XCircle color={colors.error[500]} size={16} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.directionsBtn}
          onPress={() => {
            if (request.location?.latitude && request.location?.longitude) {
              openDirections(request.location.latitude, request.location.longitude);
            }
          }}
        >
          <Navigation color="#fff" size={16} />
          <Text style={styles.directionsBtnText}>Get Directions</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderAcceptedRequest = (request: SOSRequest) => (
    <View key={request.id} style={styles.acceptedCard}>
      <View style={styles.acceptedHeader}>
        <View style={styles.acceptedInfo}>
          <Text style={styles.acceptedName}>{request.userName}</Text>
          <Text style={styles.acceptedType}>{request.type}</Text>
          {request.respondedByName && (
            <View style={styles.responderRow}>
              <User color={colors.success[500]} size={12} />
              <Text style={styles.responderText}>Responded by {request.respondedByName}</Text>
            </View>
          )}
        </View>
        <View style={styles.acceptedActions}>
          <TouchableOpacity
            style={styles.mapIconBtn}
            onPress={() => {
              if (request.location?.latitude && request.location?.longitude) {
                openDirections(request.location.latitude, request.location.longitude);
              }
            }}
          >
            <Navigation color={colors.primary[500]} size={16} />
          </TouchableOpacity>
          <View style={styles.acceptedBadge}>
            <Text style={styles.acceptedBadgeText}>Accepted</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>Request Statistics</Text>

        <View style={styles.analyticsRow}>
          <Text style={styles.analyticsLabel}>Ambulance</Text>
          <View style={styles.analyticsBar}>
            <View style={[styles.analyticsBarFill, { width: '45%', backgroundColor: colors.error[500] }]} />
          </View>
          <Text style={styles.analyticsValue}>{analytics?.requestsByType?.Ambulance || 45}%</Text>
        </View>

        <View style={styles.analyticsRow}>
          <Text style={styles.analyticsLabel}>Police</Text>
          <View style={styles.analyticsBar}>
            <View style={[styles.analyticsBarFill, { width: '30%', backgroundColor: '#1d4ed8' }]} />
          </View>
          <Text style={styles.analyticsValue}>{analytics?.requestsByType?.Police || 30}%</Text>
        </View>

        <View style={styles.analyticsRow}>
          <Text style={styles.analyticsLabel}>Fire</Text>
          <View style={styles.analyticsBar}>
            <View style={[styles.analyticsBarFill, { width: '15%', backgroundColor: '#ea580c' }]} />
          </View>
          <Text style={styles.analyticsValue}>{analytics?.requestsByType?.Fire || 15}%</Text>
        </View>

        <View style={styles.analyticsRow}>
          <Text style={styles.analyticsLabel}>NGO</Text>
          <View style={styles.analyticsBar}>
            <View style={[styles.analyticsBarFill, { width: '10%', backgroundColor: '#7c3aed' }]} />
          </View>
          <Text style={styles.analyticsValue}>{analytics?.requestsByType?.NGO || 10}%</Text>
        </View>
      </View>

      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>Response Status</Text>

        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, { color: colors.warning[500] }]}>
              {analytics?.requestsByStatus?.pending || pendingRequests.length}
            </Text>
            <Text style={styles.statusLabel}>Pending</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, { color: colors.success[500] }]}>
              {analytics?.requestsByStatus?.accepted || acceptedRequests.length}
            </Text>
            <Text style={styles.statusLabel}>Accepted</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, { color: colors.error[500] }]}>
              {analytics?.requestsByStatus?.rejected || 0}
            </Text>
            <Text style={styles.statusLabel}>Rejected</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Shield color="#fff" size={24} />
          </View>
          <View>
            <Text style={styles.headerTitle}>SafeNow Admin</Text>
            <Text style={styles.headerSubtitle}>Emergency Response Dashboard</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {pendingRequests.length > 0 && (
            <View style={styles.notificationBadge}>
              <Bell color={colors.error[500]} size={20} />
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{pendingRequests.length}</Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={styles.helpersBtn}
            onPress={() => navigation.navigate('HelpersView')}
          >
            <Building2 color={colors.dark[400]} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut color={colors.dark[400]} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Active</Text>
              <Activity color={colors.error[500]} size={20} />
            </View>
            <Text style={styles.statValue}>{pendingRequests.length}</Text>
            <Text style={styles.statSubtext}>Awaiting response</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Accepted</Text>
              <CheckCircle color={colors.success[500]} size={20} />
            </View>
            <Text style={styles.statValue}>{analytics?.completedToday || acceptedRequests.length}</Text>
            <Text style={styles.statSubtext}>Today</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Avg Response</Text>
              <Clock color={colors.primary[500]} size={20} />
            </View>
            <Text style={styles.statValue}>{analytics?.averageResponseTime || '9.5m'}</Text>
            <Text style={styles.statSubtext}>Target: &lt;10m</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Total</Text>
              <TrendingUp color="#7c3aed" size={20} />
            </View>
            <Text style={styles.statValue}>{analytics?.totalRequests || requests.length}</Text>
            <Text style={styles.statSubtext}>All time</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
            onPress={() => setActiveTab('requests')}
          >
            <AlertCircle color={activeTab === 'requests' ? colors.primary[500] : colors.dark[400]} size={18} />
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
              SOS Requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
            onPress={() => setActiveTab('analytics')}
          >
            <BarChart3 color={activeTab === 'analytics' ? colors.primary[500] : colors.dark[400]} size={18} />
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'requests' ? (
          <View style={styles.content}>
            {/* Pending Requests */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertCircle color={colors.error[500]} size={20} />
                <Text style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</Text>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary[500]} />
                  <Text style={styles.loadingText}>Loading requests...</Text>
                </View>
              ) : pendingRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <CheckCircle color={colors.dark[600]} size={48} />
                  <Text style={styles.emptyText}>No pending requests</Text>
                </View>
              ) : (
                pendingRequests.map(renderPendingRequest)
              )}
            </View>

            {/* Accepted Requests */}
            {acceptedRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CheckCircle color={colors.success[500]} size={20} />
                  <Text style={styles.sectionTitle}>Accepted Requests ({acceptedRequests.length})</Text>
                </View>
                {acceptedRequests.map(renderAcceptedRequest)}
              </View>
            )}
          </View>
        ) : (
          renderAnalytics()
        )}

        {/* User Info */}
        <View style={styles.userInfoCard}>
          <User color={colors.dark[400]} size={20} />
          <View style={styles.userInfoText}>
            <Text style={styles.userInfoName}>{user?.name || 'Admin'}</Text>
            <Text style={styles.userInfoRole}>Administrator</Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
    padding: spacing.md,
    backgroundColor: colors.dark[900],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark[800],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.error[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.dark[400],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notificationBadge: {
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  helpersBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.dark[900],
    borderWidth: 1,
    borderColor: colors.dark[800],
    borderRadius: 12,
    padding: spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
    fontWeight: '600',
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#fff',
  },
  statSubtext: {
    fontSize: fontSize.xs,
    color: colors.dark[500],
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.dark[900],
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.dark[800],
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.dark[400],
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.dark[400],
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.dark[500],
    marginTop: spacing.md,
  },
  requestCard: {
    backgroundColor: colors.dark[900],
    borderWidth: 1,
    borderColor: colors.dark[800],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  requestCardSelected: {
    borderColor: colors.primary[600],
    borderWidth: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  requestUserInfo: {
    flex: 1,
  },
  requestUserName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
  },
  typeBadge: {
    backgroundColor: colors.error[500] + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.error[500],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  locationText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.dark[400],
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  timeText: {
    fontSize: fontSize.xs,
    color: colors.dark[500],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success[600],
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error[500] + '20',
    borderWidth: 1,
    borderColor: colors.error[500],
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  rejectBtnText: {
    color: colors.error[500],
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  directionsBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  acceptedCard: {
    backgroundColor: colors.dark[900],
    borderWidth: 1,
    borderColor: colors.dark[800],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    opacity: 0.8,
  },
  acceptedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  acceptedInfo: {
    flex: 1,
  },
  acceptedName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#fff',
  },
  acceptedType: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
  },
  responderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  responderText: {
    fontSize: fontSize.xs,
    color: colors.success[500],
  },
  acceptedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500] + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptedBadge: {
    backgroundColor: colors.success[500] + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  acceptedBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.success[500],
  },
  analyticsContainer: {
    padding: spacing.md,
  },
  analyticsCard: {
    backgroundColor: colors.dark[900],
    borderWidth: 1,
    borderColor: colors.dark[800],
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  analyticsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#fff',
    marginBottom: spacing.lg,
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  analyticsLabel: {
    width: 80,
    fontSize: fontSize.sm,
    color: colors.dark[400],
  },
  analyticsBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.dark[800],
    borderRadius: 4,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
  },
  analyticsBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  analyticsValue: {
    width: 40,
    fontSize: fontSize.sm,
    color: '#fff',
    textAlign: 'right',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
  },
  statusLabel: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
    marginTop: 4,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.dark[900],
    borderWidth: 1,
    borderColor: colors.dark[800],
    borderRadius: 12,
  },
  userInfoText: {
    flex: 1,
  },
  userInfoName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#fff',
  },
  userInfoRole: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
  },
});

export default AdminDashboardScreen;
