
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsHRUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
            and not request.user.is_superuser
        )


class IsHRUserOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return IsHRUser().has_permission(request, view)
