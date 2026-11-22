from rest_framework import serializers
import re
from .models import Application
from jobs.models import Job
from .models import StatusHistory


class JobMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'id',
            'title',
            'department',
            'location',
        ]


class StatusHistorySerializer(serializers.ModelSerializer):

    class Meta:
        model = StatusHistory
        fields = [
            'status',
            'candidate_note',
            'changed_at',
        ]


class ApplicationTrackingSerializer(serializers.ModelSerializer):

    job = JobMinimalSerializer(read_only=True)
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

    def validate_phone(self, value):
        cleaned = re.sub(r'[\s\-\(\)]', '', value or '')
        if not re.match(r'^\+?[0-9]{7,15}$', cleaned):
            raise serializers.ValidationError(
                "Enter a valid phone number (7 to 15 digits)."
            )
        return value

    def validate_resume(self, file):
        # Allow only PDF and DOCX files
        allowed_extensions = ['.pdf', '.docx']

        extension = file.name.lower().rsplit('.', 1)[-1]

        if f".{extension}" not in allowed_extensions:
            raise serializers.ValidationError(
                "Only PDF and DOCX files are allowed."
            )

        # Content-type verification
        allowed_content_types = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/octet-stream',
        ]
        if hasattr(file, 'content_type') and file.content_type:
            if file.content_type.lower() not in allowed_content_types:
                raise serializers.ValidationError(
                    "Uploaded file format is not accepted. Please upload a PDF or DOCX file."
                )

        # Magic byte signature check
        header = file.read(4)
        file.seek(0)
        is_pdf = header.startswith(b'%PDF')
        is_docx = header.startswith(b'PK')  # ZIP-based container for docx
        if not (is_pdf or is_docx):
            raise serializers.ValidationError(
                "File content does not match a valid PDF or DOCX file."
            )

        # Maximum file size: 5 MB
        if file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "Resume size must not exceed 5 MB."
            )

        return file