from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.submit_sos_request, name='submit-sos'),
    path('user-requests/', views.user_requests, name='user-requests'),
    path('all-requests/', views.all_sos_requests, name='all-requests'),
    path('request/<uuid:request_id>/status/', views.update_request_status, name='update-request-status'),
]
