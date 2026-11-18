from rest_framework import serializers
from .models import Application
from jobs.models import Job
from .models import StatusHistory


class StatusHistorySerializer(serializers.ModelSerializer):

    class Meta:
        model = StatusHistory
        fields = [
            'status',
            'candidate_note',
            'changed_at',
        ]


class ApplicationTrackingSerializer(serializers.ModelSerializer):

    status_history = StatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            'tracking_id',
            'candidate_name',
            'job',
            'status',
            'created_at',
            'status_history',
        ]

class ApplicationSerializer(serializers.ModelSerializer):

    job = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.filter(status=Job.Status.PUBLISHED)
    )

    class Meta:
        model = Application
        fields = [
                'id',
                'job',
                'candidate_name',
                'email',
                'phone',
                'resume',
                'tracking_id',
                'status',
                'created_at',
            ]

        read_only_fields = [
                'id',
                'tracking_id',
                'status',
                'created_at',
            ]

    def validate_resume(self, file):
        # Allow only PDF and DOCX files
        allowed_extensions = ['.pdf', '.docx']

        extension = file.name.lower().rsplit('.', 1)[-1]

        if f".{extension}" not in allowed_extensions:
            raise serializers.ValidationError(
                "Only PDF and DOCX files are allowed."
            )

        # Maximum file size: 5 MB
        if file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "Resume size must not exceed 5 MB."
            )

        return file