from django.contrib import admin
from django.utils.html import format_html

from .models import CartItem, NewDrop, Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "image_thumbnail",
        "name",
        "category",
        "price",
        "badge",
        "stock_status",
        "is_active",
        "updated_at",
    )
    list_filter = ("category", "badge", "is_active", "created_at", "updated_at")
    search_fields = ("name", "slug")
    list_editable = ("price", "badge", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("-updated_at",)
    readonly_fields = ("image_preview",)
    fields = (
        "name",
        "slug",
        "category",
        "price",
        "badge",
        "icon",
        "bg",
        "emoji",
        "image",
        "image_preview",
        "sizes",
        "colors",
        "stock_status",
        "is_active",
    )

    @admin.display(description="Image")
    def image_thumbnail(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" alt="{}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 6px;" />',
                obj.image.url,
                obj.name,
            )
        return "-"

    @admin.display(description="Current image")
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" alt="{}" style="max-width: 280px; max-height: 280px; object-fit: contain;" />',
                obj.image.url,
                obj.name,
            )
        return "No image uploaded"


@admin.register(NewDrop)
class NewDropAdmin(admin.ModelAdmin):
    list_display = ("title_preview", "season_code", "badge", "is_active", "updated_at")
    list_filter = ("is_active", "created_at", "updated_at")
    search_fields = ("title", "season", "season_code", "badge")
    list_editable = ("is_active",)
    ordering = ("-updated_at",)
    readonly_fields = ("image_preview",)
    fields = (
        "title",
        "season",
        "season_code",
        "description",
        "features",
        "badge",
        "visual_number",
        "icon",
        "button_text",
        "button_url",
        "image",
        "image_preview",
        "is_active",
    )

    @admin.display(description="Title")
    def title_preview(self, obj):
        return obj.title.splitlines()[0] if obj.title else "-"

    @admin.display(description="Current image")
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" alt="{}" style="max-width: 320px; max-height: 320px; object-fit: contain;" />',
                obj.image.url,
                obj.title.splitlines()[0] if obj.title else "New Drop",
            )
        return "No image uploaded"


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "size", "quantity", "updated_at")
    list_filter = ("size", "created_at", "updated_at")
    search_fields = ("user__username", "product__name")
    ordering = ("-updated_at",)
