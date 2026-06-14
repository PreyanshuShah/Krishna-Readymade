from django.conf import settings
from django.db import models

from .media import stored_image_url


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
    sizes = models.CharField(max_length=120, default="XS,S,M,L,XL,XXL", help_text="Comma-separated sizes")
    colors = models.CharField(max_length=160, default="Black,White,Navy", help_text="Comma-separated colors")
    stock_status = models.CharField(max_length=80, default="In stock")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def image_url(self):
        return stored_image_url(self.image, fallback="products/cap2.jpeg")


class NewDrop(models.Model):
    title = models.TextField(default="THE BOLD\nCOLLECTION")
    season = models.CharField(max_length=120, default="Summer Season 2025")
    season_code = models.CharField(max_length=40, default="SS 2025")
    description = models.TextField(
        default=(
            "Crafted for those who don't follow trends - they set them. "
            "The Krishna SS25 collection blends streetwear edge with everyday comfort."
        )
    )
    features = models.TextField(
        default=(
            "Premium breathable fabric\n"
            "Limited edition colorways\n"
            "Sizes XS to XXL available\n"
            "Affordable luxury pricing"
        ),
        help_text="Write one feature per line.",
    )
    badge = models.CharField(max_length=80, default="EXCLUSIVE DROP")
    visual_number = models.CharField(max_length=20, default="25")
    icon = models.CharField(max_length=10, default="F", help_text="Short icon or emoji for the visual card")
    button_text = models.CharField(max_length=80, default="SHOP THE DROP")
    button_url = models.CharField(max_length=200, blank=True, default="", help_text="Leave blank to open the shop page")
    image = models.ImageField(upload_to="drops/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title.splitlines()[0] if self.title else "New Drop"

    def image_url(self):
        return stored_image_url(self.image, fallback="drops/cap2.jpeg")


class CartItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart_items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    size = models.CharField(max_length=20, default="M")
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "product", "size"], name="unique_cart_item_per_user_product_size"),
        ]

    def __str__(self):
        return f"{self.user} - {self.product} ({self.size})"
