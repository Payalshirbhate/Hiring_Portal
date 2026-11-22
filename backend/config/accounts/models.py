
from django.conf import settings
from django.db import models


class HRProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hr_profile"
    )

    profile_picture = models.ImageField(
        upload_to="hr_profiles/",
        blank=True,
        null=True
    )

    def __str__(self):
        return self.user.get_username()
