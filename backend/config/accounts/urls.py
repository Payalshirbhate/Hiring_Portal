
from django.urls import path

from .views import (
    HRLoginView,
    HRProfileView,
    HRChangePasswordView,
)

urlpatterns = [
    path("login/", HRLoginView.as_view(), name="hr-login"),

    path("profile/", HRProfileView.as_view(), name="hr-profile"),

    path(
        "change-password/",
        HRChangePasswordView.as_view(),
        name="hr-change-password"
    ),
]
