"""
Test script to award points to a user
Run with: python test_award_points.py
"""
import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safenow_backend.settings')
django.setup()

from authentication.models import User
from authentication.points_utils import award_points

def award_test_points(mobile, amount=100):
    """Award test points to a user by mobile number"""
    try:
        user = User.objects.get(mobile=mobile)
        print(f"\n📱 Found user: {user.name} ({user.mobile})")
        print(f"   Role: {user.role}")
        print(f"   Is Helper: {user.is_helper}")
        print(f"   Current Points: ₹{user.points}")
        print(f"   Total Earnings: ₹{user.total_earnings}")
        print(f"   Requests Completed: {user.total_requests_completed}")
        
        # Award points
        print(f"\n💰 Awarding ₹{amount}...")
        transaction = award_points(
            user=user,
            amount=Decimal(str(amount)),
            description="Test points award",
            transaction_type='earned'
        )
        
        # Refresh user
        user.refresh_from_db()
        
        print(f"\n✅ Points awarded successfully!")
        print(f"   New Points: ₹{user.points}")
        print(f"   New Total Earnings: ₹{user.total_earnings}")
        print(f"   Transaction ID: {transaction.id}")
        
    except User.DoesNotExist:
        print(f"\n❌ User with mobile {mobile} not found!")
        print("\nAvailable users:")
        for u in User.objects.filter(role='user').values('mobile', 'name', 'is_helper'):
            print(f"   - {u['mobile']} ({u['name']}) - Helper: {u['is_helper']}")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("\n🔧 Usage: python test_award_points.py <mobile_number> [amount]")
        print("   Example: python test_award_points.py 9876543210 100")
        print("\nOr run interactively...")
        mobile = input("\nEnter mobile number: ").strip()
        amount_str = input("Enter amount (default 100): ").strip()
        amount = float(amount_str) if amount_str else 100
    else:
        mobile = sys.argv[1]
        amount = float(sys.argv[2]) if len(sys.argv) > 2 else 100
    
    award_test_points(mobile, amount)
