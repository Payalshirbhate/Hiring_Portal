
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .serializers import HRTokenObtainPairSerializer

from django.db import transaction
from rest_framework.parsers import (
    JSONParser,
    FormParser,
    MultiPartParser,
)
from rest_framework.exceptions import ValidationError

from .models import HRProfile


class HRLoginView(TokenObtainPairView):
    serializer_class = HRTokenObtainPairSerializer



class HRProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [
        JSONParser,
        FormParser,
        MultiPartParser,
    ]

    def get_profile_data(self, request):
        user = request.user
        profile, _ = HRProfile.objects.get_or_create(
            user=user
        )

        picture_url = None

        if profile.profile_picture:
            picture_url = request.build_absolute_uri(
                profile.profile_picture.url
            )

        return {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "profile_picture": picture_url,
        }

    def check_hr(self, request):
        return request.user.is_staff or request.user.is_superuser

    def get(self, request):
        if not self.check_hr(request):
            return Response(
                {"error": "HR access required."},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response(self.get_profile_data(request))

    def patch(self, request):
        if not self.check_hr(request):
            return Response(
                {"error": "HR access required."},
                status=status.HTTP_403_FORBIDDEN
            )

        user = request.user
        picture = request.FILES.get("profile_picture")

        if picture:
            allowed_types = [
                "image/jpeg",
                "image/png",
                "image/webp",
            ]

            if picture.content_type not in allowed_types:
                raise ValidationError({
                    "profile_picture": "Invalid image format."
                })

            if picture.size > 2 * 1024 * 1024:
                raise ValidationError({
                    "profile_picture": "Maximum size is 2 MB."
                })

            from django.core.files.images import get_image_dimensions

            try:
                width, height = get_image_dimensions(picture)
                if not width or not height:
                    raise ValueError("Invalid image")
            except Exception:
                raise ValidationError({
                    "profile_picture": "Invalid image file."
                })

            picture.seek(0)

        old_picture = None

        with transaction.atomic():
            for field in [
                "first_name",
                "last_name",
                "email",
            ]:
                if field in request.data:
                    setattr(user, field, request.data[field])

            user.save()

            profile, _ = HRProfile.objects.get_or_create(
    user=user
        )

        remove_picture = str(
            request.data.get("remove_profile_picture", "")
        ).lower() == "true"

        if remove_picture:
            if profile.profile_picture:
                old_picture = profile.profile_picture.name

            profile.profile_picture = None
            profile.save(update_fields=["profile_picture"])

        elif picture:
            if profile.profile_picture:
                old_picture = profile.profile_picture.name

            profile.profile_picture = picture
            profile.save(update_fields=["profile_picture"])

        if old_picture:
            from django.core.files.storage import default_storage

            if old_picture != profile.profile_picture.name:
                default_storage.delete(old_picture)

        return Response({
            "message": "Profile updated successfully.",
            **self.get_profile_data(request)
        })



class HRChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not (user.is_staff or user.is_superuser):
            return Response(
                {"error": "HR access required."},
                status=status.HTTP_403_FORBIDDEN
            )

        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"error": "Both passwords are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth.password_validation import (
            validate_password
        )
        from django.core.exceptions import ValidationError

        try:
            validate_password(new_password, user=user)
        except ValidationError as error:
            return Response(
                {"error": error.messages},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response({
            "message": "Password changed successfully."
        })
