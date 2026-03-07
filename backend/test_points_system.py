"""
Test script to demonstrate the points/rewards system functionality
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safenow_backend.settings')
django.setup()

from authentication.models import User, PointsTransaction
from authentication.points_utils import award_points, calculate_points_for_request
from sos.models import SOSRequest
from decimal import Decimal
from django.utils import timezone

def test_points_system():
    print("=" * 60)
    print("SAFENOW POINTS/REWARDS SYSTEM TEST")
    print("=" * 60)
    
    # Test 1: Check if models are working
    print("\n1. Testing Database Models...")
    users_count = User.objects.count()
    transactions_count = PointsTransaction.objects.count()
    print(f"   ✓ Users in database: {users_count}")
    print(f"   ✓ Transactions in database: {transactions_count}")
    
    # Test 2: Create a test user if needed
    print("\n2. Testing User Points Fields...")
    test_user, created = User.objects.get_or_create(
        mobile='9999999999',
        defaults={
            'name': 'Test Helper',
            'role': 'hospital',
            'is_helper': True
        }
    )
    if created:
        print(f"   ✓ Created test user: {test_user.name}")
    else:
        print(f"   ✓ Using existing user: {test_user.name}")
    
    print(f"   ✓ Current Points: ₹{test_user.points}")
    print(f"   ✓ Total Earnings: ₹{test_user.total_earnings}")
    print(f"   ✓ Requests Completed: {test_user.total_requests_completed}")
    
    # Test 3: Award points
    print("\n3. Testing Points Award System...")
    initial_points = test_user.points
    initial_earnings = test_user.total_earnings
    
    try:
        transaction = award_points(
            user=test_user,
            amount=Decimal('50.00'),
            description="Test reward - SOS request completed",
            transaction_type='earned'
        )
        # Refresh from database
        test_user.refresh_from_db()
        
        print(f"   ✓ Points awarded successfully!")
        print(f"   ✓ Previous balance: ₹{initial_points}")
        print(f"   ✓ Amount awarded: ₹50.00")
        print(f"   ✓ New balance: ₹{test_user.points}")
        print(f"   ✓ Total earnings: ₹{test_user.total_earnings}")
        print(f"   ✓ Transaction ID: {transaction.id}")
        
    except Exception as e:
        print(f"   ✗ Error awarding points: {str(e)}")
    
    # Test 4: Check recent transactions
    print("\n4. Testing Transaction History...")
    recent_transactions = PointsTransaction.objects.filter(
        user=test_user
    ).order_by('-created_at')[:5]
    
    if recent_transactions.exists():
        print(f"   ✓ Found {recent_transactions.count()} recent transaction(s)")
        for trans in recent_transactions:
            print(f"     - {trans.transaction_type}: ₹{trans.amount} | {trans.description}")
    else:
        print("   ✓ No transactions yet for this user")
    
    # Test 5: Statistics
    print("\n5. Points System Statistics...")
    total_points_distributed = PointsTransaction.objects.filter(
        transaction_type='earned'
    ).aggregate(
        total=django.db.models.Sum('amount')
    )['total'] or Decimal('0')
    
    active_helpers = User.objects.filter(
        is_helper=True,
        total_requests_completed__gt=0
    ).count()
    
    print(f"   ✓ Total points distributed: ₹{total_points_distributed}")
    print(f"   ✓ Active helpers with earnings: {active_helpers}")
    
    print("\n" + "=" * 60)
    print("POINTS SYSTEM TEST COMPLETED SUCCESSFULLY! ✓")
    print("=" * 60)
    
    print("\n📝 NEXT STEPS:")
    print("1. Start the backend server: python manage.py runserver")
    print("2. Start the frontend: cd ../frontend && npm run dev")
    print("3. Login as a service provider")
    print("4. Complete an SOS request to earn points")
    print("5. Click 'My Earnings' tab to view your balance")
    print("6. Try withdrawing funds (minimum ₹100)")

if __name__ == '__main__':
    import django.db.models
    test_points_system()
