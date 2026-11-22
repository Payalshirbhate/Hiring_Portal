from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from jobs.models import Job
from applications.models import Application, StatusHistory
from applications.serializers import (
    ApplicationSerializer,
    ApplicationTrackingSerializer,
)
from jobs.permissions import IsHRUser
from rest_framework.test import APIRequestFactory

User = get_user_model()


class ApplicationSerializerAndModelTests(TestCase):
    def setUp(self):
        self.hr_user = User.objects.create_user(
            username="hruser",
            password="password123",
            is_staff=True,
        )
        self.superuser = User.objects.create_superuser(
            username="adminuser",
            email="admin@example.com",
            password="adminpassword123",
        )
        self.regular_user = User.objects.create_user(
            username="regularuser",
            password="password123",
            is_staff=False,
            is_superuser=False,
        )
        self.job = Job.objects.create(
            title="Senior Backend Engineer",
            department="Engineering",
            location="Remote",
            description="Build scalable services.",
            status=Job.Status.PUBLISHED,
            created_by=self.hr_user,
        )

    def test_application_str(self):
        app = Application.objects.create(
            job=self.job,
            candidate_name="Jane Doe",
            email="jane@example.com",
            phone="1234567890",
            tracking_id="HIR-2026-0001-TEST",
        )
        self.assertEqual(str(app), "Jane Doe - Senior Backend Engineer")

    def test_tracking_serializer_includes_nested_job_details(self):
        app = Application.objects.create(
            job=self.job,
            candidate_name="John Smith",
            email="john@example.com",
            phone="9876543210",
            tracking_id="HIR-2026-0002-ABCD",
        )
        StatusHistory.objects.create(
            application=app,
            status=Application.Status.APPLIED,
            candidate_note="Initial application received.",
        )

        serializer = ApplicationTrackingSerializer(app)
        data = serializer.data

        self.assertIn("job", data)
        self.assertIsInstance(data["job"], dict)
        self.assertEqual(data["job"]["title"], "Senior Backend Engineer")
        self.assertEqual(data["job"]["department"], "Engineering")
        self.assertEqual(data["job"]["location"], "Remote")
        self.assertEqual(data["tracking_id"], "HIR-2026-0002-ABCD")

    def test_resume_validation_accepts_valid_pdf(self):
        valid_pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
        pdf_file = SimpleUploadedFile(
            "resume.pdf",
            valid_pdf_content,
            content_type="application/pdf",
        )
        data = {
            "job": self.job.id,
            "candidate_name": "Valid Candidate",
            "email": "valid@example.com",
            "phone": "9876543210",
            "resume": pdf_file,
        }
        serializer = ApplicationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_resume_validation_rejects_fake_extension(self):
        # A file named .pdf containing executable/non-pdf bytes
        fake_pdf = SimpleUploadedFile(
            "malicious.pdf",
            b"MZ\x90\x00\x03\x00\x00\x00",
            content_type="application/pdf",
        )
        data = {
            "job": self.job.id,
            "candidate_name": "Hacker",
            "email": "hacker@example.com",
            "phone": "9876543210",
            "resume": fake_pdf,
        }
        serializer = ApplicationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("resume", serializer.errors)

    def test_resume_validation_rejects_disallowed_extension(self):
        exe_file = SimpleUploadedFile(
            "script.sh",
            b"#!/bin/bash\necho 1",
            content_type="application/x-sh",
        )
        data = {
            "job": self.job.id,
            "candidate_name": "Bad Candidate",
            "email": "bad@example.com",
            "phone": "9876543210",
            "resume": exe_file,
        }
        serializer = ApplicationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("resume", serializer.errors)

    def test_is_hr_user_permission(self):
        perm = IsHRUser()
        factory = APIRequestFactory()
        request = factory.get("/")

        # Anonymous
        request.user = None
        self.assertFalse(perm.has_permission(request, None))

        # Regular user
        request.user = self.regular_user
        self.assertFalse(perm.has_permission(request, None))

        # Staff HR user
        request.user = self.hr_user
        self.assertTrue(perm.has_permission(request, None))

        # Superuser / Admin
        request.user = self.superuser
        self.assertTrue(perm.has_permission(request, None))
