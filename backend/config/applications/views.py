from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from django.db import IntegrityError, transaction
from django.utils import timezone
import secrets

from .models import Application, StatusHistory
from .serializers import ApplicationSerializer

from rest_framework.views import APIView

from .serializers import ApplicationTrackingSerializer

from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from jobs.permissions import IsHRUser
from django.db import transaction
from .email_utils import send_application_confirmation
from .email_utils import send_status_update_email
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils.text import get_valid_filename
import os
from rest_framework.generics import DestroyAPIView

class ApplicationTrackingView(APIView):

    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):

        tracking_id = request.data.get('tracking_id')
        email = request.data.get('email')

        if not tracking_id or not email:
            return Response(
                {"error": "Tracking ID and email are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            application = Application.objects.select_related(
                'job'
            ).prefetch_related(
                'status_history'
            ).get(
                tracking_id=tracking_id,
                email__iexact=email
            )

        except Application.DoesNotExist:
            return Response(
                {"error": "Invalid tracking ID or email."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ApplicationTrackingSerializer(application)

        return Response(serializer.data, status=status.HTTP_200_OK)

class HRApplicationListView(ListAPIView):

        serializer_class = ApplicationSerializer
        permission_classes = [IsHRUser]

        def get_queryset(self):
            job_id = self.request.query_params.get('job_id')

            queryset = Application.objects.select_related(
                'job'
            ).order_by('-created_at')

            if job_id:
                queryset = queryset.filter(job_id=job_id)

            return queryset


class HRApplicationStatusUpdateView(APIView):
    permission_classes = [IsHRUser]

    def patch(self, request, pk):

        try:
            application = Application.objects.get(pk=pk)
        except Application.DoesNotExist:
            return Response(
                {"error": "Application not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        candidate_note = request.data.get("candidate_note", "")
        internal_note = request.data.get("internal_note", "")

        if new_status not in Application.Status.values:
            return Response(
                {"error": "Invalid application status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():

            previous_status = application.status

            application.status = new_status
            application.save(update_fields=["status"])

            StatusHistory.objects.create(
                application=application,
                status=new_status,
                changed_by=request.user,
                candidate_note=candidate_note,
                internal_note=internal_note
            )

            print("Previous Status:", previous_status)
            print("New Status:", new_status)

            if previous_status != new_status:

                def send_notification():
                    print("Sending status update email...")

                    result = send_status_update_email(application)

                    print("Email sending result:", result)

                transaction.on_commit(send_notification)

        # Must be outside the transaction and inside patch()
        return Response(
            {"message": "Application status updated successfully."},
            status=status.HTTP_200_OK
        )


class ApplicationCreateView(CreateAPIView):

    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():

            if "non_field_errors" in serializer.errors:
                return Response(
                    {
                        "error": (
                            "You have already applied for this "
                            "job using this email."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

                # Save candidate application
                application = serializer.save()

                # Generate unique tracking ID with random suffix to prevent enumeration
                random_code = secrets.token_hex(2).upper()
                application.tracking_id = (
                    f"HIR-{timezone.now().year}-{application.id:04d}-{random_code}"
                )

                application.save(
                    update_fields=["tracking_id"]
                )

                # Save initial application status
                StatusHistory.objects.create(
                    application=application,
                    status=application.status,
                    candidate_note=(
                        "Your application has been received."
                    )
                )

                # Send email after successful database commit
                transaction.on_commit(
                    lambda: send_application_confirmation(
                        application
                    )
                )

        except IntegrityError:
            return Response(
                {
                    "error": (
                        "You have already applied for this "
                        "job using this email."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        response_serializer = self.get_serializer(application)

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )



class HRResumeDownloadView(APIView):
    permission_classes = [IsHRUser]

    def get(self, request, pk):
        application = get_object_or_404(
            Application,
            pk=pk
        )

        if not application.resume:
            raise Http404("Resume not found.")

        try:
            file = application.resume.open("rb")
        except (FileNotFoundError, OSError):
            # Fallback for legacy uploaded files before storage separation
            from django.conf import settings
            file = None
            for base_folder in [getattr(settings, "MEDIA_ROOT", None), getattr(settings, "BASE_DIR", None)]:
                if not base_folder:
                    continue
                legacy_file_path = os.path.join(str(base_folder), str(application.resume.name))
                if os.path.exists(legacy_file_path):
                    file = open(legacy_file_path, "rb")
                    break
            if not file:
                raise Http404("Resume file not found.")

        filename = get_valid_filename(
            os.path.basename(application.resume.name)
        )

        return FileResponse(
            file,
            as_attachment=True,
            filename=filename
        )
class HRApplicationDeleteView(DestroyAPIView):
    queryset = Application.objects.all()
    permission_classes = [IsHRUser]

    def perform_destroy(self, instance):
        resume_name = instance.resume.name if instance.resume else None
        resume_storage = instance.resume.storage if resume_name else None

        print("Deleting candidate:", instance.id)
        print("Resume path:", resume_name)

        # Delete candidate from database
        instance.delete()

        # Delete actual PDF from configured storage
        if resume_name:
            resume_storage.delete(resume_name)
            print("Resume deletion requested:", resume_name)