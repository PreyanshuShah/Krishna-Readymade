from django.conf import settings
from django.core.files.storage import FileSystemStorage


def media_file_url(name):
    if not name:
        return ""

    storage = FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
    normalized_name = str(name).lstrip("/")
    try:
        if not storage.exists(normalized_name):
            return ""
        return storage.url(normalized_name)
    except (OSError, ValueError):
        return ""


def stored_image_url(image, fallback=""):
    if not image:
        return media_file_url(fallback)

    try:
        if not image.storage.exists(image.name):
            return media_file_url(fallback)
        return image.url
    except (OSError, ValueError):
        return media_file_url(fallback)
