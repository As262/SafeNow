import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Wallet, TrendingUp, Award, ArrowUpRight, History, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPointsBalance, getPointsTransactions, withdrawPoints } from '../../api/client';
import { colors, fontSize, spacing, shadows } from '../../styles/theme';

const WalletScreen: React.FC = () => {
  const [balance, setBalance] = useState({ points: 0, total_earnings: 0, total_requests_completed: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadData();
 }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceRes, transactionsRes] = await Promise.all([
        getPointsBalance().catch(() => ({ points: 0, total_earnings: 0, total_requests_completed: 0 })),
        getPointsTransactions().catch(() => ({ transactions: [] })),
      ]);
      setBalance(balanceRes);
      setTransactions(transactionsRes.transactions || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (amount < 100) {
      Alert.alert('Error', 'Minimum withdrawal amount is Rs.100');
      return;
    }
    if (amount > balance.points) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }
    try {
      setWithdrawing(true);
      await withdrawPoints(amount);
      Alert.alert('Success', `Successfully requested withdrawal of Rs.${amount}`);
      setModalVisible(false);
      setWithdrawAmount('');
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.balanceSection}>
          <LinearGradient colors={[colors.primary[500], colors.primary[700]]} style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Wallet color="#fff" size={32} />
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>Rs.{balance.points.toFixed(2)}</Text>
            <TouchableOpacity style={styles.withdrawButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
              <ArrowUpRight color={colors.primary[600]} size={20} />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp color={colors.success[500]} size={24} />
            <Text style={styles.statValue}>Rs.{balance.total_earnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Award color={colors.warning[500]} size={24} />
            <Text style={styles.statValue}>{balance.total_requests_completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Info</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Earn <Text style={styles.highlight}>Rs.50</Text> per completed request</Text>
            <Text style={styles.infoSubtext}>Minimum withdrawal: <Text style={styles.highlight}>Rs.100</Text></Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <History color={colors.dark[500]} size={48} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((tx: any) => (
              <View key={tx.id} style={styles.transactionCard}>
                <View>
                  <Text style={styles.txType}>{tx.description}</Text>
                  <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'earn' ? colors.success[500] : colors.error[500] }]}>
                  {tx.type === 'earn' ? '+' : '-'}Rs.{tx.amount}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.dark[400]} size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalBalance}>Available: Rs.{balance.points.toFixed(2)}</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount (min Rs.100)"
                placeholderTextColor={colors.dark[500]}
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
              />
              <TouchableOpacity
                style={[styles.confirmButton, withdrawing && styles.confirmButtonDisabled]}
                onPress={handleWithdraw}
                disabled={withdrawing}
              >
                {withdrawing ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark[950] },
  loadingContainer: { flex: 1, backgroundColor: colors.dark[950], justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.dark[400], marginTop: spacing.md },
  balanceSection: { padding: spacing.lg },
  balanceCard: { borderRadius: 16, padding: spacing.lg, ...shadows.lg },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  balanceLabel: { fontSize: fontSize.base, color: '#fff', opacity: 0.9 },
  balanceAmount: { fontSize: 48, fontWeight: '700', color: '#fff', marginBottom: spacing.lg },
  withdrawButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: spacing.md, borderRadius: 12, gap: spacing.xs },
  withdrawButtonText: { fontSize: fontSize.base, fontWeight: '600', color: colors.primary[600] },
  statsContainer: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.dark[900], borderWidth: 1, borderColor: colors.dark[800], borderRadius: 12, padding: spacing.md, alignItems: 'center' },
  statValue: { fontSize: fontSize['2xl'], fontWeight: '700', color: '#fff', marginTop: spacing.sm },
  statLabel: { fontSize: fontSize.xs, color: colors.dark[500], marginTop: spacing.xs, textAlign: 'center' },
  section: { padding: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: '#fff', marginBottom: spacing.md },
  infoCard: { backgroundColor: colors.dark[900], borderWidth: 1, borderColor: colors.dark[800], borderRadius: 12, padding: spacing.md },
  infoText: { fontSize: fontSize.base, color: colors.dark[300], marginBottom: spacing.xs },
  infoSubtext: { fontSize: fontSize.sm, color: colors.dark[500] },
  highlight: { color: colors.primary[500], fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { fontSize: fontSize.base, color: colors.dark[500], marginTop: spacing.md },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.dark[900], borderWidth: 1, borderColor: colors.dark[800], borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm },
  txType: { fontSize: fontSize.base, fontWeight: '600', color: '#fff', marginBottom: 4 },
  txDate: { fontSize: fontSize.sm, color: colors.dark[500] },
  txAmount: { fontSize: fontSize.lg, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.dark[900], borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.dark[800] },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: '#fff' },
  modalBody: { padding: spacing.lg },
  modalBalance: { fontSize: fontSize.lg, color: colors.dark[300], marginBottom: spacing.lg },
  input: { backgroundColor: colors.dark[800], borderWidth: 1, borderColor: colors.dark[700], borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: fontSize.base, color: '#fff', marginBottom: spacing.lg },
  confirmButton: { backgroundColor: colors.primary[600], paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center' },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: '#fff', fontSize: fontSize.base, fontWeight: '600' },
});

export default WalletScreen;
