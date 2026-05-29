from django.db import models


class Product(models.Model):
    CATEGORY_CHOICES = [
        ("tshirts", "T-Shirts"),
        ("shirts", "Shirts"),
        ("jeans", "Jeans"),
        ("jackets", "Jackets"),
    ]

    BADGE_CHOICES = [
        ("", "None"),
        ("new", "New"),
        ("trending", "Trending"),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="tshirts")
    price = models.PositiveIntegerField(help_text="Price in NPR")
    old_price = models.PositiveIntegerField(help_text="Old price in NPR", blank=True, null=True)
    badge = models.CharField(max_length=20, choices=BADGE_CHOICES, blank=True, default="")
    icon = models.CharField(max_length=10, default="👕", help_text="Emoji/icon for placeholder UI")
    bg = models.CharField(max_length=20, default="p-bg-1", help_text="Background class for card placeholder")
    emoji = models.CharField(max_length=10, default="🖤")
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
