
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateAPIView
)
from .permissions import IsHRUser, IsHRUserOrReadOnly

from .models import Job
from .serializers import JobSerializer


# GET: List jobs | POST: Create job
class JobListCreateView(ListCreateAPIView):

    serializer_class = JobSerializer
    permission_classes = [IsHRUserOrReadOnly]

    def get_queryset(self):
        # HR can see all jobs; public users see published jobs only
        if IsHRUser().has_permission(self.request, self):
            return Job.objects.all().order_by('-created_at')

        return Job.objects.filter(
        status=Job.Status.PUBLISHED
    ).order_by('-created_at')

    def perform_create(self, serializer):
        # Automatically save the logged-in HR user
        serializer.save(created_by=self.request.user)


# GET: Job details | PUT/PATCH: Update job
class JobDetailView(RetrieveUpdateAPIView):

    serializer_class = JobSerializer
    permission_classes = [IsHRUserOrReadOnly]

    def get_queryset(self):
        if IsHRUser().has_permission(self.request, self):
            return Job.objects.all()

        return Job.objects.filter(status=Job.Status.PUBLISHED)
