from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include('jobs.urls')),
    path('api/', include('applications.urls')),
    path('api/hr/', include('accounts.urls')),

    path(
        'api/token/refresh/',
        TokenRefreshView.as_view(),
        name='token-refresh'
    ),
]