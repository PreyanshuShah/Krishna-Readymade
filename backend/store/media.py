def stored_image_url(image):
    if not image:
        return ""

    try:
        if not image.storage.exists(image.name):
            return ""
        return image.url
    except (OSError, ValueError):
        return ""
