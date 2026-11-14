from django.db import models
from django.conf import settings


class Job(models.Model):

    # Job publication status
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        CLOSED = 'closed', 'Closed'

    # Basic job information
    title = models.CharField(max_length=150)
    department = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=120, blank=True)

    # Job description and requirements
    description = models.TextField()
    requirements = models.TextField(blank=True)

    # Current job status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )

    # HR user who created this job
    # each job is connected to existing user(HR)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='jobs_created'
    )

    # Automatic dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def _str_(self):
        return self.title
