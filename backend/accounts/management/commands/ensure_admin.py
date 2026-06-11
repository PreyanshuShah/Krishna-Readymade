import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or update a superuser from environment variables."

    def handle(self, *args, **options):
        User = get_user_model()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        if not password:
            self._promote_first_user_if_needed(User)
            return

        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} superuser '{username}'."))

    def _promote_first_user_if_needed(self, User):
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write("A superuser already exists.")
            return

        first_user = User.objects.order_by("id").first()
        if not first_user:
            self.stdout.write(
                self.style.WARNING(
                    "Skipping admin setup because no users exist and DJANGO_SUPERUSER_PASSWORD is not set."
                )
            )
            return

        first_user.is_staff = True
        first_user.is_superuser = True
        first_user.save(update_fields=["is_staff", "is_superuser"])
        self.stdout.write(
            self.style.SUCCESS(f"Promoted first user '{first_user.username}' to superuser.")
        )
