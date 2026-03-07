# How to Use the Points/Rewards System

## 🎉 Overview
Service providers (hospitals, fire departments, NGOs, police) now earn money when they help people by completing SOS requests!

## 💰 How Helpers Earn Money

### Earning Points (Rupees)
When you complete an SOS request, you automatically earn:
- **₹50** - Base reward for every completed request
- **₹25** - Bonus if you accept within 5 minutes (Fast Response Bonus)
- **₹15** - Bonus for traveling long distances (>10 km)

**Example:** 
- Accept a request within 3 minutes ✓
- Complete the request ✓
- **You earn: ₹75** (₹50 base + ₹25 fast response bonus)

### The points are calculated and awarded AUTOMATICALLY when you:
1. Accept an SOS request
2. Update the status to "Completed"

## 📱 Viewing Your Earnings

### In Service Dashboard:
1. **Login** as a service provider
2. Look at the **5th stats card** on top - it shows your Total Earnings
3. Click the **"My Earnings"** tab in the navigation
4. You'll see:
   - Current Balance (money you can withdraw)
   - Total Earnings (lifetime earnings)
   - Total Requests Completed
   - Complete transaction history

## 💸 Withdrawing Money

### To withdraw your earnings:
1. Go to **"My Earnings"** tab
2. Click the **"Withdraw"** button on the balance card
3. Enter the amount you want to withdraw
   - Minimum: ₹100
   - Maximum: Your current balance
4. Click **"Confirm Withdrawal"**
5. Your balance is updated immediately

**Note:** In a real system, the admin would process the withdrawal and transfer money to your bank account.

## 📊 Transaction History

Every earning and withdrawal is recorded. You can see:
- Type of transaction (Earned, Withdrawn, Bonus)
- Amount (+ for earnings, - for withdrawals)
- Description (which request it was for)
- Date and time
- Balance after each transaction

## 🎯 Quick Start Guide

### For Service Providers:

1. **Start the Backend:**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login as Service Provider:**
   - Use your service ID (e.g., 1001234 for hospital)
   - Default password: safenow2024

4. **Complete SOS Requests:**
   - You'll see pending requests in your dashboard
   - Click on a request
   - Update status to "Accepted" → "Completed"
   - **Points are awarded automatically! 🎉**

5. **Check Your Earnings:**
   - Click "My Earnings" tab
   - See your balance and transaction history
   - Withdraw when you have ₹100 or more

## 🧪 Testing the System

Run the test script to verify everything works:
```bash
cd backend
python test_points_system.py
```

This will:
- Create a test user
- Award test points
- Show transaction history
- Display statistics

## 📋 Example Scenario

**Service Provider: Hospital (Dr. Sharma)**

**Day 1:**
- Completes 3 emergency requests
- 2 accepted within 5 minutes (fast response bonus)
- Earnings: (₹50 × 3) + (₹25 × 2) = **₹200**

**Day 2:**
- Completes 2 more requests
- 1 with fast response bonus
- Earnings: (₹50 × 2) + (₹25 × 1) = **₹125**

**Total Balance: ₹325**

Dr. Sharma clicks "Withdraw", enters ₹300, and confirms.
- New Balance: ₹25
- Total Earnings: ₹325 (lifetime)
- Requests Completed: 5

## 🔒 Security & Accuracy

✅ All calculations use proper decimal handling (no floating point errors)
✅ Database transactions ensure data consistency
✅ Balance is validated before withdrawals
✅ Complete audit trail with transaction history
✅ Points can't be negative or manipulated

## 💡 Tips for Earning More

1. **Be Quick:** Accept requests within 5 minutes for bonus
2. **Stay Active:** Complete more requests to earn more
3. **Be Available:** Set helper status to "Available"
4. **Complete Requests:** Don't leave requests pending

## 🎨 UI Features

- **Green gradient card** shows your total earnings
- **Blue nav tab** with balance badge for quick view
- **Color-coded transactions:**
  - 🟢 Green = Money earned
  - 🔴 Red = Money withdrawn
  - 🔵 Blue = Bonuses
- **Responsive design** works on all devices

## 🚀 Ready to Earn!

The system is fully functional and ready to use. Service providers can now:
- ✅ Earn money for helping people
- ✅ Track their earnings in real-time
- ✅ View complete transaction history
- ✅ Withdraw funds easily
- ✅ See how many people they've helped

**Start helping people and earning money today! 💪**
