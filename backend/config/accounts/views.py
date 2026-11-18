
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import HRTokenObtainPairSerializer


class HRLoginView(TokenObtainPairView):
    serializer_class = HRTokenObtainPairSerializer