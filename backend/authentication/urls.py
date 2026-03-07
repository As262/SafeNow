from django.urls import path
from . import views

urlpatterns = [
    path('send-otp/', views.send_otp_view, name='send-otp'),
    path('verify-otp/', views.verify_otp_view, name='verify-otp'),
    path('service-login/', views.service_login_view, name='service-login'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.update_profile_view, name='update-profile'),
    path('logout/', views.logout_view, name='logout'),
    path('sessions/', views.sessions_view, name='sessions'),
    path('emergency-contacts/', views.emergency_contacts_view, name='emergency-contacts'),
    path('emergency-contacts/<int:contact_id>/', views.emergency_contact_detail_view, name='emergency-contact-detail'),
    path('helper/toggle/', views.toggle_helper_mode_view, name='toggle-helper'),
    path('helper/availability/', views.toggle_helper_availability_view, name='toggle-helper-availability'),
    path('service-providers/', views.get_service_providers_view, name='service-providers'),
    # Points/Wallet endpoints
    path('points/balance/', views.points_balance_view, name='points-balance'),
    path('points/transactions/', views.points_transactions_view, name='points-transactions'),
    path('points/withdraw/', views.withdraw_points_view, name='points-withdraw'),
]
