from django.core.files.storage import FileSystemStorage
from django.conf import settings
from pathlib import Path


class PrivateFileSystemStorage(FileSystemStorage):
    """
    Storage for sensitive candidate resumes.
    Ensures files are kept outside the publicly-accessible MEDIA_ROOT
    and base_url is None so direct URLs cannot be generated.
    """
    def __init__(self, *args, **kwargs):
        location = getattr(settings, "PRIVATE_MEDIA_ROOT", settings.BASE_DIR / "private_media")
        kwargs.setdefault("location", location)
        kwargs.setdefault("base_url", None)
        super().__init__(*args, **kwargs)


private_storage = PrivateFileSystemStorage()
