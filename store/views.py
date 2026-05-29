from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils.text import slugify
import json
from .models import Product


def _product_payload(product):
    old_price = product.old_price or product.price
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "price": product.price,
        "old": old_price,
        "old_price": old_price,
        "cat": product.category,
        "category": product.category,
        "badge": product.badge,
        "icon": product.icon,
        "bg": product.bg,
        "emoji": product.emoji,
        "image_url": product.image.url if product.image else "",
        "is_active": product.is_active,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


def _products_payload(include_inactive=False):
    products = Product.objects.order_by("id")
    if not include_inactive:
        products = products.filter(is_active=True)
    return [_product_payload(product) for product in products]


def _filter_products_queryset(request):
    products = Product.objects.order_by("id")
    include_inactive = request.GET.get("all") in {"1", "true", "yes"}

    if not include_inactive:
        products = products.filter(is_active=True)

    category = request.GET.get("category") or request.GET.get("cat")
    if category and category != "all":
        products = products.filter(category=category)

    badge = request.GET.get("badge")
    if badge is not None:
        products = products.filter(badge=badge)

    query = request.GET.get("q")
    if query:
        products = products.filter(name__icontains=query)

    return products


def _read_json_body(request):
    if not request.body:
        return {}
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return None
    return payload if isinstance(payload, dict) else None


def _read_product_payload(request):
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        return request.POST
    return _read_json_body(request)


def _choice_values(choices):
    return {value for value, _label in choices}


def _staff_error(request):
    if request.user.is_authenticated and request.user.is_staff:
        return None
    return JsonResponse({"error": "Staff login required."}, status=403)


def _unique_slug(name, product_id=None, requested_slug=""):
    base_slug = slugify(requested_slug or name) or "product"
    candidate = base_slug
    suffix = 2

    while Product.objects.filter(slug=candidate).exclude(id=product_id).exists():
        candidate = f"{base_slug}-{suffix}"
        suffix += 1

    return candidate


def _apply_product_payload(product, payload, partial=False):
    errors = {}

    required_fields = ["name", "price"] if not partial else []
    for field in required_fields:
        if payload.get(field) in (None, ""):
            errors[field] = "This field is required."

    if "name" in payload:
        name = str(payload.get("name", "")).strip()
        if not name:
            errors["name"] = "Name cannot be blank."
        else:
            product.name = name

    if "price" in payload:
        try:
            price = int(payload["price"])
        except (TypeError, ValueError):
            errors["price"] = "Price must be a whole number."
        else:
            if price < 0:
                errors["price"] = "Price cannot be negative."
            else:
                product.price = price

    if "old_price" in payload or "old" in payload:
        old_price = payload.get("old_price", payload.get("old"))
        if old_price in (None, ""):
            product.old_price = None
        else:
            try:
                old_price = int(old_price)
            except (TypeError, ValueError):
                errors["old_price"] = "Old price must be a whole number."
            else:
                if old_price < 0:
                    errors["old_price"] = "Old price cannot be negative."
                else:
                    product.old_price = old_price

    if "category" in payload or "cat" in payload:
        category = payload.get("category", payload.get("cat"))
        if category not in _choice_values(Product.CATEGORY_CHOICES):
            errors["category"] = "Choose a valid category."
        else:
            product.category = category

    if "badge" in payload:
        badge = payload.get("badge") or ""
        if badge not in _choice_values(Product.BADGE_CHOICES):
            errors["badge"] = "Choose a valid badge."
        else:
            product.badge = badge

    for field in ("icon", "bg", "emoji"):
        if field in payload:
            value = str(payload.get(field, "")).strip()
            if value:
                setattr(product, field, value)

    if "is_active" in payload:
        product.is_active = str(payload["is_active"]).lower() in {"1", "true", "yes", "on"}

    if errors:
        return errors

    if "slug" in payload or not product.slug:
        product.slug = _unique_slug(product.name, product.id, payload.get("slug", ""))
    elif "name" in payload and not partial:
        product.slug = _unique_slug(product.name, product.id)

    return {}


def products_api(request):
    if request.method == "GET":
        return JsonResponse(
            {"products": [_product_payload(product) for product in _filter_products_queryset(request)]},
            encoder=DjangoJSONEncoder,
        )

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    staff_error = _staff_error(request)
    if staff_error:
        return staff_error

    payload = _read_product_payload(request)
    if payload is None:
        return JsonResponse({"error": "Request body must be valid JSON or form data."}, status=400)

    product = Product()
    errors = _apply_product_payload(product, payload)
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    if not product.slug:
        product.slug = _unique_slug(product.name, product.id, payload.get("slug", ""))

    if "image" in request.FILES:
        product.image = request.FILES["image"]

    product.save()
    return JsonResponse(_product_payload(product), encoder=DjangoJSONEncoder, status=201)


def product_detail_api(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    if request.method == "GET":
        return JsonResponse(_product_payload(product), encoder=DjangoJSONEncoder)

    if request.method not in {"POST", "PUT", "PATCH", "DELETE"}:
        return JsonResponse({"error": "Method not allowed."}, status=405)

    staff_error = _staff_error(request)
    if staff_error:
        return staff_error

    if request.method == "DELETE":
        product.delete()
        return HttpResponse(status=204)

    payload = _read_product_payload(request)
    if payload is None:
        return JsonResponse({"error": "Request body must be valid JSON or form data."}, status=400)

    errors = _apply_product_payload(product, payload, partial=request.method == "PATCH")
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    if "image" in request.FILES:
        product.image = request.FILES["image"]

    product.save()
    return JsonResponse(_product_payload(product), encoder=DjangoJSONEncoder)


def home(request):
    context = {
        "products_json": json.dumps(_products_payload(), cls=DjangoJSONEncoder),
    }
    return render(request, "index.html", context)


def collection(request):
    return render(request, "collection.html")


def shop(request):
    context = {
        "products_json": json.dumps(_products_payload(), cls=DjangoJSONEncoder),
    }
    return render(request, "shop.html", context)


def new_drop(request):
    return render(request, "new-drop.html")


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
