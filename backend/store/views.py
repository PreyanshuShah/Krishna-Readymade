import json

from django.contrib.admin.views.decorators import staff_member_required
from django.core.serializers.json import DjangoJSONEncoder
from django.shortcuts import get_object_or_404, render
from django.urls import reverse

from .api import products_payload
from .models import NewDrop, Product


def new_drop_context():
    active_drop = NewDrop.objects.filter(is_active=True).first()
    shop_url = reverse("shop")

    if active_drop:
        return {
            "title": active_drop.title,
            "season": active_drop.season,
            "season_code": active_drop.season_code,
            "description": active_drop.description,
            "features": [feature.strip() for feature in active_drop.features.splitlines() if feature.strip()],
            "badge": active_drop.badge,
            "visual_number": active_drop.visual_number,
            "icon": active_drop.icon,
            "button_text": active_drop.button_text,
            "button_url": active_drop.button_url or shop_url,
            "image_url": active_drop.image.url if active_drop.image else "",
        }

    return {
        "title": "THE BOLD\nCOLLECTION",
        "season": "Summer Season 2025",
        "season_code": "SS 2025",
        "description": (
            "Crafted for those who don't follow trends - they set them. "
            "The Krishna SS25 collection blends streetwear edge with everyday comfort."
        ),
        "features": [
            "Premium breathable fabric",
            "Limited edition colorways",
            "Sizes XS to XXL available",
            "Affordable luxury pricing",
        ],
        "badge": "EXCLUSIVE DROP",
        "visual_number": "25",
        "icon": "F",
        "button_text": "SHOP THE DROP",
        "button_url": shop_url,
        "image_url": "",
    }


def home(request):
    context = {
        "products_json": json.dumps(products_payload(), cls=DjangoJSONEncoder),
        "drop": new_drop_context(),
    }
    return render(request, "index.html", context)


def collection(request):
    return render(request, "collection.html")


def shop(request):
    context = {
        "products_json": json.dumps(products_payload(), cls=DjangoJSONEncoder),
    }
    return render(request, "shop.html", context)


def product_detail(request, slug):
    product = get_object_or_404(Product, slug=slug, is_active=True)
    context = {
        "product": product,
        "sizes": [size.strip() for size in product.sizes.split(",") if size.strip()],
        "colors": [color.strip() for color in product.colors.split(",") if color.strip()],
    }
    return render(request, "product-detail.html", context)


def new_drop(request):
    return render(request, "new-drop.html", {"drop": new_drop_context()})


def gallery(request):
    return render(request, "gallery.html")


def about(request):
    return render(request, "about.html")


@staff_member_required
def admin_products(request):
    context = {
        "category_choices": Product.CATEGORY_CHOICES,
        "badge_choices": Product.BADGE_CHOICES,
    }
    return render(request, "admin-products.html", context)
