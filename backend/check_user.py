"""
Check user helper status and points
Run with: python check_user.py <mobile>
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safenow_backend.settings')
django.setup()

from authentication.models import User, PointsTransaction

def check_user(mobile):
    """Check user status"""
    try:
        user = User.objects.get(mobile=mobile)
        print(f"\n{'='*60}")
        print(f"👤 USER DETAILS")
        print(f"{'='*60}")
        print(f"Mobile: {user.mobile}")
        print(f"Name: {user.name}")
        print(f"Email: {user.email}")
        print(f"Role: {user.role}")
        print(f"\n{'='*60}")
        print(f"🆘 HELPER STATUS")
        print(f"{'='*60}")
        print(f"Is Helper: {user.is_helper}")
        print(f"Helper Available: {user.helper_available}")
        print(f"Helper Skills: {user.helper_skills or 'Not set'}")
        print(f"Helper Radius: {user.helper_radius_km} km")
        print(f"\n{'='*60}")
        print(f"💰 EARNINGS")
        print(f"{'='*60}")
        print(f"Current Balance: ₹{user.points}")
        print(f"Total Earnings: ₹{user.total_earnings}")
        print(f"Requests Completed: {user.total_requests_completed}")
        
        # Check transactions
        transactions = PointsTransaction.objects.filter(user=user).order_by('-created_at')[:5]
        if transactions:
            print(f"\n{'='*60}")
            print(f"📜 RECENT TRANSACTIONS (Last 5)")
            print(f"{'='*60}")
            for t in transactions:
                print(f"  {t.created_at.strftime('%Y-%m-%d %H:%M')} | {t.transaction_type:10} | ₹{t.amount:8} | Balance: ₹{t.balance_after}")
                print(f"     → {t.description}")
        else:
            print(f"\n📜 No transactions found")
        
        print(f"\n{'='*60}\n")
        
    except User.DoesNotExist:
        print(f"\n❌ User with mobile {mobile} not found!")
        print("\n📋 Available users:")
        for u in User.objects.filter(role='user')[:10]:
            helper_status = "✅ Helper" if u.is_helper else "❌ Not Helper"
            print(f"   {u.mobile:12} | {u.name:20} | {helper_status} | ₹{u.points}")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("\n🔧 Usage: python check_user.py <mobile_number>")
        print("   Example: python check_user.py 9876543210")
        mobile = input("\nEnter mobile number: ").strip()
    else:
        mobile = sys.argv[1]
    
    check_user(mobile)
