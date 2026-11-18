
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def send_application_confirmation(application):
    subject = "Application Received - Hiring Portal"

    message = f"""
Hello {application.candidate_name},

Thank you for applying for the position of
{application.job.title}.

Your application has been submitted successfully.

Tracking ID: {application.tracking_id}
Current Status: Applied

You can track your application using your
Tracking ID and registered email address.

Regards,
Hiring Portal Team
"""

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [application.email],
            fail_silently=False
        )
        return True

    except Exception:
        logger.exception(
            "Failed to send confirmation email for application %s",
            application.id
        )
        return False


def send_status_update_email(application):
    subject = "Application Status Updated - Hiring Portal"

    status_name = application.get_status_display()

    message = f"""
Hello {application.candidate_name},

There is an update regarding your application
for the position of {application.job.title}.

Tracking ID: {application.tracking_id}
Current Status: {status_name}

You can track your application using your
Tracking ID and registered email address.

Regards,
Hiring Portal Team
"""

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [application.email],
            fail_silently=False
        )
        return True

    except Exception:
        logger.exception(
            "Failed to send status update email for application %s",
            application.id
        )
        return False

