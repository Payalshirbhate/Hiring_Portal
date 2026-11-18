from django.urls import path
from .views import ApplicationCreateView,ApplicationTrackingView,HRApplicationListView, HRApplicationStatusUpdateView
from .views import HRResumeDownloadView

urlpatterns = [
    path(
        'applications/',
        ApplicationCreateView.as_view(),
        name='application-create'
    ),
    path(
        'track/',
        ApplicationTrackingView.as_view(),
        name='application-track'
    ),
    path(
        'hr/applications/',
        HRApplicationListView.as_view(),
        name='hr-applications'
    ),
    path(
        'hr/applications/<int:pk>/status/',
        HRApplicationStatusUpdateView.as_view(),
        name='hr-application-status-update'
    ),
    path(
    "hr/applications/<int:pk>/resume/",
    HRResumeDownloadView.as_view(),
    name="hr-resume-download"
),
    
]