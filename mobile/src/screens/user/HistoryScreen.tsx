import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
} from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { getUserRequests, confirmRequestComplete } from '../../api/client';
import { colors, fontSize, spacing } from '../../styles/theme';
import { SOSRequest } from '../../types';

const HistoryScreen: React.FC = () => {
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await getUserRequests();
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, []);

  const handleConfirmComplete = async (requestId: string | number) => {
    try {
      await confirmRequestComplete(requestId);
      loadRequests();
    } catch (error) {
      console.error('Error confirming completion:', error);
    }
  };

  const openInMaps = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success[500];
      case 'pending':
        return colors.warning[500];
      case 'rejected':
        return colors.error[500];
      default:
        return colors.dark[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'rejected':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading request history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <Text style={styles.title}>Request History</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning[500] }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success[500] }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'completed', 'rejected'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Request List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle color={colors.dark[500]} size={48} />
            <Text style={styles.emptyText}>No {filter !== 'all' ? filter : ''} requests found</Text>
          </View>
        ) : (
          filteredRequests.map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            const statusColor = getStatusColor(request.status);

            return (
              <View key={request.id} style={styles.requestCard}>
                {/* Header */}
                <View style={styles.requestHeader}>
                  <View>
                    <Text style={styles.requestType}>{request.type}</Text>
                    <View style={styles.timeRow}>
                      <Clock color={colors.dark[500]} size={14} />
                      <Text style={styles.timeText}>{formatTimeAgo(request.created_at)}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <StatusIcon color={statusColor} size={16} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {request.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.requestDetails}>
                  <View style={styles.detailRow}>
                    <MapPin color={colors.dark[400]} size={16} />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {request.address || `${request.latitude.toFixed(4)}, ${request.longitude.toFixed(4)}`}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(request.created_at)}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openInMaps(request.latitude, request.longitude)}
                  >
                    <Navigation color={colors.primary[500]} size={16} />
                    <Text style={styles.actionText}>View on Map</Text>
                  </TouchableOpacity>

                  {request.status === 'accepted' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={() => handleConfirmComplete(request.id)}
                    >
                      <CheckCircle color={colors.success[500]} size={16} />
                      <Text style={[styles.actionText, { color: colors.success[500] }]}>Mark Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Response Info */}
                {request.responded_by && (
                  <View style={styles.responseInfo}>
                    <Text style={styles.responseText}>
                      Responded by: {request.responder_name || `#${request.responded_by}`}
                    </Text>
                    {request.response_time && (
                      <Text style={styles.responseTime}>Response time: {Math.round(request.response_time)}s</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark[950],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.dark[950],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.dark[400],
    marginTop: spacing.md,
    fontSize: fontSize.base,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark[800],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.dark[500],
    marginTop: spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.dark[800],
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary[600],
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
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
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  requestType: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: fontSize.sm,
    color: colors.dark[500],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  requestDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
    flex: 1,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.dark[500],
    marginLeft: spacing.lg + spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dark[800],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: colors.success[500] + '20',
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: '600',
  },
  responseInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.dark[800],
  },
  responseText: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
  },
  responseTime: {
    fontSize: fontSize.xs,
    color: colors.dark[500],
    marginTop: spacing.xs,
  },
});

export default HistoryScreen;
