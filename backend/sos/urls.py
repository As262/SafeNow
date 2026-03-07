from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.submit_sos_request, name='submit-sos'),
    path('user-requests/', views.user_requests, name='user-requests'),
    path('all-requests/', views.all_sos_requests, name='all-requests'),
    path('request/<uuid:request_id>/status/', views.update_request_status, name='update-request-status'),
    path('chatbot/', views.chatbot_response, name='chatbot'),
    path('helper/requests/', views.helper_requests_view, name='helper-requests'),
    path('helper/request/<uuid:request_id>/respond/', views.helper_respond_request_view, name='helper-respond'),
    path('request/<uuid:request_id>/confirm-complete/', views.user_confirm_completion_view, name='user-confirm-complete'),
]
