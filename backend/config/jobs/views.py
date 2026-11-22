
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView
)
from rest_framework.response import Response
from rest_framework import status
from django.db.models.deletion import ProtectedError

from .permissions import IsHRUser, IsHRUserOrReadOnly
from .models import Job
from .serializers import JobSerializer


# GET: List jobs | POST: Create job
class JobListCreateView(ListCreateAPIView):

    serializer_class = JobSerializer
    permission_classes = [IsHRUserOrReadOnly]

    def get_queryset(self):
        # HR can see all jobs; public sees published jobs only
        if IsHRUser().has_permission(self.request, self):
            return Job.objects.all().order_by('-created_at')

        return Job.objects.filter(
            status=Job.Status.PUBLISHED
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# GET: Details | PUT/PATCH: Update | DELETE: Delete
class JobDetailView(RetrieveUpdateDestroyAPIView):

    serializer_class = JobSerializer
    permission_classes = [IsHRUserOrReadOnly]

    def get_queryset(self):
        if IsHRUser().has_permission(self.request, self):
            return Job.objects.all()

        return Job.objects.filter(
            status=Job.Status.PUBLISHED
        )

    def destroy(self, request, *args, **kwargs):

        # Only HR users can delete jobs
        if not IsHRUser().has_permission(request, self):
            return Response(
                {"error": "Only HR users can delete jobs."},
                status=status.HTTP_403_FORBIDDEN
            )

        job = self.get_object()

        # Prevent deletion when applications exist
        if job.applications.exists():
            return Response(
                {
                    "error": (
                        "Cannot delete this job because candidates "
                        "have already applied. Close the job instead."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            self.perform_destroy(job)
        except ProtectedError:
            return Response(
                {
                    "error": "Cannot delete a job with existing applications."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
