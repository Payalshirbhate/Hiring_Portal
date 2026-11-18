from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class HRTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):

        # Validate username and password first
        data = super().validate(attrs)

        # Check whether the user is HR
        if not self.user.is_staff or self.user.is_superuser:
            raise serializers.ValidationError(
                "Only HR users can log in."
            )

        return data