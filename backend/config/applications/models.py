from django.db import models
from jobs.models import Job
from django.conf import settings

class Application(models.Model):

    # Application status choices
    class Status(models.TextChoices):
        APPLIED = 'applied', 'Applied'
        UNDER_REVIEW = 'under_review', 'Under review'
        SHORTLISTED = 'shortlisted', 'Shortlisted'
        ON_HOLD = 'on_hold', 'On hold'
        SELECTED = 'selected', 'Selected'
        REJECTED = 'rejected', 'Rejected'

    # Connect application with Job table
    job = models.ForeignKey(
        Job,
        on_delete=models.PROTECT,
        related_name='applications'
    )

    # Candidate information
    candidate_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=10)

    # Resume upload
    resume = models.FileField(upload_to='resumes/')

    # Unique tracking ID (generated when applying)
    tracking_id = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True
    )

    # Current application status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.APPLIED
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["job", "email"],
                name="unique_job_email"
            )
        ]

    def _str_(self):
        return f"{self.candidate_name} - {self.job.title}"





class StatusHistory(models.Model):

    # Connect history with an application
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='status_history'
    )

    # Status at this point in time
    status = models.CharField(
        max_length=20,
        choices=Application.Status.choices
    )

    # HR user who changed the status
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='application_status_changes'
    )

    # Note visible to candidate
    candidate_note = models.TextField(blank=True)

    # Private note visible only to HR
    internal_note = models.TextField(blank=True)

    # When this status was recorded
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.application.tracking_id} - {self.status}"    