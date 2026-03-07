"""
Utility functions for managing points and rewards system.
"""
from decimal import Decimal
from django.db import transaction
from .models import PointsTransaction


# Points configuration
BASE_POINTS_PER_REQUEST = Decimal('50.00')  # Base points for completing a request
BONUS_FOR_FAST_RESPONSE = Decimal('25.00')  # Bonus for response within 5 minutes
DISTANCE_BONUS_THRESHOLD_KM = 10  # Distance threshold for bonus
DISTANCE_BONUS_POINTS = Decimal('15.00')  # Bonus for traveling long distance


def calculate_points_for_request(sos_request):
    """
    Calculate points earned for completing an SOS request.
    
    Factors considered:
    - Base points: 50 rupees
    - Fast response bonus (< 5 minutes): +25 rupees
    - Long distance bonus (> 10 km traveled): +15 rupees
    
    Returns:
        Decimal: Total points earned
    """
    points = BASE_POINTS_PER_REQUEST
    
    # Calculate response time bonus
    if sos_request.accepted_at and sos_request.created_at:
        response_time = (sos_request.accepted_at - sos_request.created_at).total_seconds() / 60
        if response_time < 5:
            points += BONUS_FOR_FAST_RESPONSE
    
    # You can add distance calculation logic here if needed
    # For now, we'll keep it simple with base points and response time bonus
    
    return points


@transaction.atomic
def award_points(user, amount, description, sos_request=None, transaction_type='earned'):
    """
    Award points to a user and create a transaction record.
    
    Args:
        user: User object to award points to
        amount: Decimal amount of points to award
        description: Description of the transaction
        sos_request: Optional SOS request related to this transaction
        transaction_type: Type of transaction (earned, bonus, etc.)
    
    Returns:
        PointsTransaction: The created transaction object
    """
    # Ensure amount is Decimal
    amount = Decimal(str(amount))
    
    # Update user's points (cast to Decimal to avoid type issues)
    user.points = Decimal(str(user.points)) + amount
    
    # Update total earnings and requests completed for 'earned' transactions
    if transaction_type == 'earned':
        user.total_earnings = Decimal(str(user.total_earnings)) + amount
        user.total_requests_completed += 1
    
    user.save()
    
    # Create transaction record
    transaction_record = PointsTransaction.objects.create(
        user=user,
        transaction_type=transaction_type,
        amount=amount,
        balance_after=user.points,
        description=description,
        sos_request=sos_request
    )
    
    return transaction_record


@transaction.atomic
def deduct_points(user, amount, description, transaction_type='withdrawn'):
    """
    Deduct points from a user (e.g., for withdrawal or penalty).
    
    Args:
        user: User object to deduct points from
        amount: Decimal amount of points to deduct
        description: Description of the transaction
        transaction_type: Type of transaction (withdrawn, penalty, etc.)
    
    Returns:
        PointsTransaction: The created transaction object
        
    Raises:
        ValueError: If user doesn't have sufficient points
    """
    # Ensure amount is Decimal
    amount = Decimal(str(amount))
    user_points = Decimal(str(user.points))
    
    if user_points < amount:
        raise ValueError("Insufficient points balance")
    
    # Update user's points
    user.points = user_points - amount
    user.save()
    
    # Create transaction record (store as negative amount)
    transaction_record = PointsTransaction.objects.create(
        user=user,
        transaction_type=transaction_type,
        amount=-amount,  # Negative for deductions
        balance_after=user.points,
        description=description
    )
    
    return transaction_record
