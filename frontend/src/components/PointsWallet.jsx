import { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Award, 
  ArrowUpRight, 
  History, 
  Clock,
  CheckCircle,
  Calculator,
  Zap,
  MapPin as MapPinIcon
} from 'lucide-react';
import { 
  getPointsBalance, 
  getPointsTransactions, 
  withdrawPoints 
} from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const PointsWallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState({
    points: 0,
    total_earnings: 0,
    total_requests_completed: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  //Earnings calculator state
  const [calcRequests, setCalcRequests] = useState(5);
  const [calcFastResponse, setCalcFastResponse] = useState(3);
  const [calcDistance, setCalcDistance] = useState(0);

  useEffect(() => {
    fetchPointsData();
  }, []);

  const fetchPointsData = async () => {
    try {
      setLoading(true);
      const [balanceData, transactionsData] = await Promise.all([
        getPointsBalance(),
        getPointsTransactions()
      ]);

      if (balanceData.success) {
        setBalance({
          points: balanceData.points || 0,
          total_earnings: balanceData.total_earnings || 0,
          total_requests_completed: balanceData.total_requests_completed || 0
        });
      }

      if (transactionsData.success) {
        setTransactions(transactionsData.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching points data:', err);
      setError('Failed to load points data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < 100) {
      setError('Minimum withdrawal amount is ₹100');
      return;
    }

    if (amount > balance.points) {
      setError('Insufficient balance');
      return;
    }

    try {
      setWithdrawing(true);
      setError('');
      const response = await withdrawPoints(amount);

      if (response.success) {
        setSuccess(`Successfully requested withdrawal of ₹${amount}`);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        // Refresh data
        fetchPointsData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earned':
        return <Award className="w-5 h-5 text-green-500" />;
      case 'withdrawn':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'bonus':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default:
        return <History className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionBreakdown = (transaction) => {
    // Analyze transaction amount to show breakdown
    if (transaction.transaction_type === 'earned') {
      const amount = Math.abs(transaction.amount);
      const badges = [];
      
      // Base amount (always 50 for earned transactions)
      badges.push({ label: 'Base', value: '₹50', color: 'bg-blue-100 text-blue-700' });
      
      // Check for fast response bonus (75 or 90 total)
      if (amount >= 75) {
        badges.push({ label: 'Fast Response', value: '+₹25', color: 'bg-yellow-100 text-yellow-700' });
      }
      
      // Check for distance bonus (65, 80, or 90 total)
      if (amount >= 80 || (amount >= 65 && amount < 75)) {
        badges.push({ label: 'Distance', value: '+₹15', color: 'bg-purple-100 text-purple-700' });
      }
      
      return badges;
    }
    return [];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate potential earnings
  const calculatePotentialEarnings = () => {
    const base = calcRequests * 50;
    const fast = calcFastResponse * 25;
    const distance = calcDistance * 15;
    return base + fast + distance;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Earnings Calculator & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* How Earnings Are Calculated */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="w-6 h-6" />
            <h3 className="text-xl font-bold">Earnings Breakdown</h3>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-300" />
                  <span className="font-semibold text-sm">Base Reward</span>
                </div>
                <span className="text-xl font-bold">₹50</span>
              </div>
              <p className="text-xs text-blue-100">Per completed request</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span className="font-semibold text-sm">Fast Response</span>
                </div>
                <span className="text-xl font-bold">+₹25</span>
              </div>
              <p className="text-xs text-blue-100">Accept within 5 minutes</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-yellow-300" />
                  <span className="font-semibold text-sm">Distance Bonus</span>
                </div>
                <span className="text-xl font-bold">+₹15</span>
              </div>
              <p className="text-xs text-blue-100">Travel over 10 km</p>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-3 border-2 border-green-300 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Maximum Per Request</p>
                  <p className="text-xs text-green-100">All bonuses applied</p>
                </div>
                <p className="text-3xl font-bold">₹90</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Earnings Calculator */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-800">Earnings Calculator</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Requests Completed</span>
                <span className="text-indigo-600 font-bold">{calcRequests}</span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={calcRequests}
                onChange={(e) => setCalcRequests(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-xs text-gray-500 mt-1">₹50 × {calcRequests} = ₹{calcRequests * 50}</p>
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Fast Response Bonuses</span>
                <span className="text-yellow-600 font-bold">{calcFastResponse}</span>
              </label>
              <input
                type="range"
                min="0"
                max={calcRequests}
                value={calcFastResponse}
                onChange={(e) => setCalcFastResponse(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-1">₹25 × {calcFastResponse} = ₹{calcFastResponse * 25}</p>
            </div>

            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Distance Bonuses</span>
                <span className="text-blue-600 font-bold">{calcDistance}</span>
              </label>
              <input
                type="range"
                min="0"
                max={calcRequests}
                value={calcDistance}
                onChange={(e) => setCalcDistance(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">₹15 × {calcDistance} = ₹{calcDistance * 15}</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-500 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projected Earnings</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {calcRequests} requests • {calcFastResponse} fast • {calcDistance} distance
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-green-600">₹{calculatePotentialEarnings()}</p>
                  <p className="text-xs text-gray-500">total</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-center text-gray-700">
                <span className="font-semibold">💡 Example:</span> Complete 10 requests with 7 fast responses = <span className="font-bold text-green-600">₹675</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Balance */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">Current Balance</span>
            <Wallet className="w-6 h-6 text-blue-100" />
          </div>
          <div className="text-3xl font-bold mb-1">₹{balance.points.toFixed(2)}</div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors w-full"
            disabled={balance.points < 100}
          >
            Withdraw
          </button>
        </div>

        {/* Total Earnings */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Earnings</span>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-800">₹{balance.total_earnings.toFixed(2)}</div>
        </div>

        {/* Requests Completed */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Requests Completed</span>
            <Award className="w-6 h-6 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{balance.total_requests_completed}</div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm">Complete SOS requests to start earning points!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  {getTransactionIcon(transaction.transaction_type)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                    
                    {/* Show earning breakdown badges */}
                    {transaction.transaction_type === 'earned' && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getTransactionBreakdown(transaction).map((badge, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}
                          >
                            {badge.label} {badge.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className={`text-lg font-semibold ${
                    transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount >= 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Balance: ₹{transaction.balance_after.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Withdraw Points</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                min="100"
                max={balance.points}
                step="10"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Minimum ₹100"
              />
              <p className="text-sm text-gray-500 mt-1">
                Available: ₹{balance.points.toFixed(2)}
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {withdrawing ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsWallet;
