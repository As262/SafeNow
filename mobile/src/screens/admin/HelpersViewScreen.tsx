import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Shield,
  User,
  Building2,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Flame,
  Users,
  Search,
  Heart,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getServiceProviders } from '../../api/client';
import { colors, fontSize, spacing } from '../../styles/theme';

interface ServiceProvider {
  id: string | number;
  name: string;
  service_id: string;
  role: 'hospital' | 'police' | 'fire' | 'ngo';
  phone?: string;
  address?: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: any;
  role: string | null;
  color: string;
}

const HelpersViewScreen: React.FC = () => {
  const navigation = useNavigation();

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories: Category[] = [
    { id: 'all', name: 'All', icon: Building2, role: null, color: colors.primary[500] },
    { id: 'hospital', name: 'Hospital', icon: Heart, role: 'hospital', color: colors.error[500] },
    { id: 'police', name: 'Police', icon: Shield, role: 'police', color: '#1d4ed8' },
    { id: 'fire', name: 'Fire', icon: Flame, role: 'fire', color: '#ea580c' },
    { id: 'ngo', name: 'NGO', icon: Users, role: 'ngo', color: '#7c3aed' },
  ];

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await getServiceProviders();
      setProviders(response.providers || []);
    } catch (error) {
      console.error('Error loading service providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [selectedCategory, providers, searchQuery]);

  const filterProviders = () => {
    let filtered = providers;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.role === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.service_id?.toLowerCase().includes(query) ||
          p.phone?.toLowerCase().includes(query) ||
          p.address?.toLowerCase().includes(query)
      );
    }

    setFilteredProviders(filtered);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProviders();
    setRefreshing(false);
  }, []);

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'hospital':
        return colors.error[500];
      case 'police':
        return '#1d4ed8';
      case 'fire':
        return '#ea580c';
      case 'ngo':
        return '#7c3aed';
      default:
        return colors.dark[500];
    }
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'hospital':
        return 'Hospital';
      case 'police':
        return 'Police';
      case 'fire':
        return 'Fire Dept';
      case 'ngo':
        return 'NGO';
      default:
        return role;
    }
  };

  const getCategoryCount = (categoryId: string): number => {
    if (categoryId === 'all') return providers.length;
    return providers.filter((p) => p.role === categoryId).length;
  };

  const renderProvider = (provider: ServiceProvider) => {
    const roleColor = getRoleColor(provider.role);

    return (
      <View key={provider.id} style={styles.providerCard}>
        {/* Header */}
        <View style={styles.providerHeader}>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, { backgroundColor: roleColor + '20', borderColor: roleColor + '50' }]}>
                <Text style={[styles.roleBadgeText, { color: roleColor }]}>{getRoleLabel(provider.role)}</Text>
              </View>
              {provider.is_active ? (
                <View style={styles.statusBadge}>
                  <CheckCircle color={colors.success[500]} size={14} />
                  <Text style={[styles.statusText, { color: colors.success[500] }]}>Active</Text>
                </View>
              ) : (
                <View style={styles.statusBadge}>
                  <XCircle color={colors.error[500]} size={14} />
                  <Text style={[styles.statusText, { color: colors.error[500] }]}>Inactive</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.providerDetails}>
          <View style={styles.detailRow}>
            <Shield color={colors.dark[400]} size={16} />
            <Text style={styles.detailLabel}>ID:</Text>
            <Text style={styles.detailValue}>{provider.service_id}</Text>
          </View>

          {provider.phone && (
            <View style={styles.detailRow}>
              <Phone color={colors.dark[400]} size={16} />
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{provider.phone}</Text>
            </View>
          )}

          {provider.address && (
            <View style={styles.detailRow}>
              <MapPin color={colors.dark[400]} size={16} />
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue} numberOfLines={2}>{provider.address}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.dark[400]} size={24} />
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Building2 color="#fff" size={24} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Service Providers</Text>
          <Text style={styles.headerSubtitle}>Registered Helpers</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search color={colors.dark[500]} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, phone..."
            placeholderTextColor={colors.dark[500]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;
          const count = getCategoryCount(category.id);

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                isActive && { backgroundColor: category.color },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Icon color={isActive ? '#fff' : category.color} size={16} />
              <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                {category.name}
              </Text>
              <View style={[styles.categoryBadge, isActive && styles.categoryBadgeActive]}>
                <Text style={[styles.categoryBadgeText, isActive && styles.categoryBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View>
          <Text style={styles.statsValue}>{filteredProviders.length}</Text>
          <Text style={styles.statsLabel}>
            {selectedCategory === 'all'
              ? 'Total Service Providers'
              : `${getRoleLabel(selectedCategory)} Helpers`}
          </Text>
        </View>
        <Building2 color={colors.primary[500]} size={40} style={{ opacity: 0.5 }} />
      </View>

      {/* Providers List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Loading service providers...</Text>
          </View>
        ) : filteredProviders.length === 0 ? (
          <View style={styles.emptyState}>
            <Building2 color={colors.dark[600]} size={64} />
            <Text style={styles.emptyText}>No service providers found</Text>
            {searchQuery && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredProviders.map(renderProvider)
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.dark[900],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark[800],
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
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
  searchContainer: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark[900],
    borderWidth: 1,
    borderColor: colors.dark[800],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: '#fff',
  },
  categoryContainer: {
    maxHeight: 55,
    marginTop: spacing.md,
  },
  categoryContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark[800],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  categoryText: {
    fontSize: fontSize.sm,
    color: colors.dark[300],
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  categoryBadge: {
    backgroundColor: colors.dark[700],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  categoryBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.dark[400],
  },
  categoryBadgeTextActive: {
    color: '#fff',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark[900],
    borderWidth: 1,
    borderColor: colors.dark[800],
    borderRadius: 12,
    padding: spacing.lg,
    margin: spacing.md,
    marginBottom: 0,
  },
  statsValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#fff',
  },
  statsLabel: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.dark[400],
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.dark[500],
    marginTop: spacing.md,
  },
  clearSearchBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.dark[800],
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: fontSize.sm,
    color: '#fff',
  },
  providerCard: {
    backgroundColor: colors.dark[900],
    borderWidth: 1,
    borderColor: colors.dark[800],
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  providerHeader: {
    marginBottom: spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  providerDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.dark[500],
    minWidth: 60,
  },
  detailValue: {
    flex: 1,
    fontSize: fontSize.sm,
    color: '#fff',
  },
});

export default HelpersViewScreen;
