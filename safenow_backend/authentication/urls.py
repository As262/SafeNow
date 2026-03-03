from django.urls import path
from . import views

urlpatterns = [
    path('send-otp/', views.send_otp_view, name='send-otp'),
    path('verify-otp/', views.verify_otp_view, name='verify-otp'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.update_profile_view, name='update-profile'),
    path('logout/', views.logout_view, name='logout'),
    path('sessions/', views.sessions_view, name='sessions'),
]
