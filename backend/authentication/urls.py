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
]
