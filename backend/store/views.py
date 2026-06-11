import json

from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.shortcuts import get_object_or_404, render
from django.urls import reverse

from .api import products_payload
from .media import stored_image_url
from .models import CartItem, NewDrop, Product


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
            "image_url": stored_image_url(active_drop.image),
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
    category_icons = {
        "shirts": "👔",
        "tshirts": "👕",
        "jeans": "👖",
        "jackets": "🧥",
    }
    category_backgrounds = {
        "shirts": "cat-bg-1",
        "tshirts": "cat-bg-2",
        "jeans": "cat-bg-3",
        "jackets": "cat-bg-4",
    }
    categories = [
        {
            "value": value,
            "label": label.upper(),
            "icon": category_icons.get(value, "K"),
            "background": category_backgrounds.get(value, "cat-bg-1"),
            "count": Product.objects.filter(category=value, is_active=True).count(),
        }
        for value, label in Product.CATEGORY_CHOICES
    ]
    context = {
        "categories": categories,
        "products_json": json.dumps(products_payload(), cls=DjangoJSONEncoder),
        "selected_category": request.GET.get("category", ""),
    }
    return render(request, "collection.html", context)


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


@login_required
def cart(request):
    cart_items = CartItem.objects.select_related("product").filter(
        user=request.user,
        product__is_active=True,
    ).order_by("created_at")
    items = [
        {
            "id": item.id,
            "product": item.product,
            "size": item.size,
            "quantity": item.quantity,
            "line_total": item.quantity * item.product.price,
        }
        for item in cart_items
    ]
    total = sum(item["line_total"] for item in items)
    item_count = sum(item["quantity"] for item in items)
    order_lines = [
        "Hello Krishna Readymade, I want to place an order:",
        "",
        *[
            f"{index}. {item['product'].name} (Size: {item['size']}) x{item['quantity']} - NPR {item['line_total']:,}"
            for index, item in enumerate(items, start=1)
        ],
        "",
        f"Total: NPR {total:,}",
        "",
        "Please confirm availability and payment details.",
    ]
    context = {
        "items": items,
        "item_count": item_count,
        "total": total,
        "order_message": "\n".join(order_lines),
    }
    return render(request, "cart.html", context)


def new_drop(request):
    return render(request, "new-drop.html", {"drop": new_drop_context()})


def gallery(request):
    return render(request, "gallery.html")


def about(request):
    return render(request, "about.html")


@staff_member_required
def admin_products(request):
    context = {
        "active_admin_page": "products",
        "category_choices": Product.CATEGORY_CHOICES,
        "badge_choices": Product.BADGE_CHOICES,
    }
    return render(request, "admin/products.html", context)


@staff_member_required
def admin_product_add(request):
    context = {
        "active_admin_page": "products",
        "form_title": "Add Product",
        "product_id": "",
        "category_choices": Product.CATEGORY_CHOICES,
        "badge_choices": Product.BADGE_CHOICES,
    }
    return render(request, "admin/product-form.html", context)


@staff_member_required
def admin_product_edit(request, product_id):
    get_object_or_404(Product, id=product_id)
    context = {
        "active_admin_page": "products",
        "form_title": "Edit Product",
        "product_id": product_id,
        "category_choices": Product.CATEGORY_CHOICES,
        "badge_choices": Product.BADGE_CHOICES,
    }
    return render(request, "admin/product-form.html", context)


@staff_member_required
def admin_new_drop(request):
    return render(request, "admin/new-drop.html", {"active_admin_page": "new_drop"})
