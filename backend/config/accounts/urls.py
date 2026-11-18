from django.urls import path
from .views import HRLoginView

urlpatterns = [
    path('login/', HRLoginView.as_view(), name='hr-login'),
]