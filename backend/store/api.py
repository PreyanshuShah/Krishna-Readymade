import json

from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.text import slugify

from .models import CartItem, NewDrop, Product


def product_payload(product):
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
        "sizes": [size.strip() for size in product.sizes.split(",") if size.strip()],
        "colors": [color.strip() for color in product.colors.split(",") if color.strip()],
        "stock_status": product.stock_status,
        "is_active": product.is_active,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


def frontend_cart_product_payload(product):
    payload = product_payload(product)
    return {
        "id": payload["id"],
        "name": payload["name"],
        "slug": payload["slug"],
        "price": payload["price"],
        "old": payload["old"],
        "cat": payload["cat"],
        "badge": payload["badge"],
        "icon": payload["icon"],
        "bg": payload["bg"],
        "emoji": payload["emoji"],
        "imageUrl": payload["image_url"],
        "sizes": payload["sizes"],
        "colors": payload["colors"],
        "stockStatus": payload["stock_status"],
    }


def cart_item_payload(cart_item):
    return {
        **frontend_cart_product_payload(cart_item.product),
        "size": cart_item.size,
        "qty": cart_item.quantity,
    }


def cart_payload(user):
    items = (
        CartItem.objects.select_related("product")
        .filter(user=user, product__is_active=True)
        .order_by("created_at")
    )
    return {"items": [cart_item_payload(item) for item in items]}


def new_drop_payload(drop):
    return {
        "id": drop.id,
        "title": drop.title,
        "season": drop.season,
        "season_code": drop.season_code,
        "description": drop.description,
        "features": drop.features,
        "badge": drop.badge,
        "visual_number": drop.visual_number,
        "icon": drop.icon,
        "button_text": drop.button_text,
        "button_url": drop.button_url,
        "image_url": drop.image.url if drop.image else "",
        "is_active": drop.is_active,
        "created_at": drop.created_at,
        "updated_at": drop.updated_at,
    }


def products_payload(include_inactive=False):
    products = Product.objects.order_by("id")
    if not include_inactive:
        products = products.filter(is_active=True)
    return [product_payload(product) for product in products]


def filter_products_queryset(request):
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


def read_json_body(request):
    if not request.body:
        return {}
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return None
    return payload if isinstance(payload, dict) else None


def read_product_payload(request):
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        return request.POST
    return read_json_body(request)


def choice_values(choices):
    return {value for value, _label in choices}


def staff_error(request):
    if request.user.is_authenticated and request.user.is_staff:
        return None
    return JsonResponse({"error": "Staff login required."}, status=403)


def login_error(request):
    if request.user.is_authenticated:
        return None
    return JsonResponse({"error": "Login required."}, status=403)


def unique_slug(name, product_id=None, requested_slug=""):
    base_slug = slugify(requested_slug or name) or "product"
    candidate = base_slug
    suffix = 2

    while Product.objects.filter(slug=candidate).exclude(id=product_id).exists():
        candidate = f"{base_slug}-{suffix}"
        suffix += 1

    return candidate


def apply_product_payload(product, payload, partial=False):
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
        if category not in choice_values(Product.CATEGORY_CHOICES):
            errors["category"] = "Choose a valid category."
        else:
            product.category = category

    if "badge" in payload:
        badge = payload.get("badge") or ""
        if badge not in choice_values(Product.BADGE_CHOICES):
            errors["badge"] = "Choose a valid badge."
        else:
            product.badge = badge

    for field in ("icon", "bg", "emoji", "sizes", "colors", "stock_status"):
        if field in payload:
            value = str(payload.get(field, "")).strip()
            if value:
                setattr(product, field, value)

    if "is_active" in payload:
        product.is_active = str(payload["is_active"]).lower() in {"1", "true", "yes", "on"}

    if errors:
        return errors

    if "slug" in payload or not product.slug:
        product.slug = unique_slug(product.name, product.id, payload.get("slug", ""))
    elif "name" in payload and not partial:
        product.slug = unique_slug(product.name, product.id)

    return {}


def apply_new_drop_payload(drop, payload):
    errors = {}

    for field in ("title", "season", "season_code", "description", "features", "badge", "visual_number", "icon", "button_text", "button_url"):
        if field in payload:
            value = str(payload.get(field, "")).strip()
            if field != "button_url" and not value:
                errors[field] = "This field is required."
            else:
                setattr(drop, field, value)

    if "is_active" in payload:
        drop.is_active = str(payload["is_active"]).lower() in {"1", "true", "yes", "on"}

    return errors


def products_api(request):
    if request.method == "GET":
        return JsonResponse(
            {"products": [product_payload(product) for product in filter_products_queryset(request)]},
            encoder=DjangoJSONEncoder,
        )

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    error_response = staff_error(request)
    if error_response:
        return error_response

    payload = read_product_payload(request)
    if payload is None:
        return JsonResponse({"error": "Request body must be valid JSON or form data."}, status=400)

    product = Product()
    errors = apply_product_payload(product, payload)
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    if not product.slug:
        product.slug = unique_slug(product.name, product.id, payload.get("slug", ""))

    if "image" in request.FILES:
        product.image = request.FILES["image"]

    product.save()
    return JsonResponse(product_payload(product), encoder=DjangoJSONEncoder, status=201)


def product_detail_api(request, product_id):
    product = get_object_or_404(Product, id=product_id)

    if request.method == "GET":
        return JsonResponse(product_payload(product), encoder=DjangoJSONEncoder)

    if request.method not in {"POST", "PUT", "PATCH", "DELETE"}:
        return JsonResponse({"error": "Method not allowed."}, status=405)

    error_response = staff_error(request)
    if error_response:
        return error_response

    if request.method == "DELETE":
        product.delete()
        return HttpResponse(status=204)

    payload = read_product_payload(request)
    if payload is None:
        return JsonResponse({"error": "Request body must be valid JSON or form data."}, status=400)

    errors = apply_product_payload(product, payload, partial=request.method == "PATCH")
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    if "image" in request.FILES:
        product.image = request.FILES["image"]

    product.save()
    return JsonResponse(product_payload(product), encoder=DjangoJSONEncoder)


def new_drop_api(request):
    error_response = staff_error(request)
    if error_response:
        return error_response

    drop = NewDrop.objects.filter(is_active=True).first() or NewDrop.objects.first()

    if request.method == "GET":
        if not drop:
            drop = NewDrop.objects.create()
        return JsonResponse({"drop": new_drop_payload(drop)}, encoder=DjangoJSONEncoder)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    payload = read_product_payload(request)
    if payload is None:
        return JsonResponse({"error": "Request body must be valid JSON or form data."}, status=400)

    if not drop:
        drop = NewDrop()

    errors = apply_new_drop_payload(drop, payload)
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    if "image" in request.FILES:
        drop.image = request.FILES["image"]

    drop.save()
    return JsonResponse({"drop": new_drop_payload(drop)}, encoder=DjangoJSONEncoder)


def cart_api(request):
    error_response = login_error(request)
    if error_response:
        return error_response

    if request.method == "GET":
        return JsonResponse(cart_payload(request.user), encoder=DjangoJSONEncoder)

    if request.method not in {"POST", "DELETE"}:
        return JsonResponse({"error": "Method not allowed."}, status=405)

    payload = read_json_body(request)
    if payload is None:
        return JsonResponse({"error": "Request body must be valid JSON."}, status=400)

    product_id = payload.get("product_id")
    try:
        product_id = int(product_id)
    except (TypeError, ValueError):
        return JsonResponse({"errors": {"product_id": "Choose a valid product."}}, status=400)

    size = str(payload.get("size") or "M").strip() or "M"
    try:
        product = Product.objects.get(id=product_id, is_active=True)
    except Product.DoesNotExist:
        return JsonResponse({"errors": {"product_id": "Product is not available."}}, status=404)

    if request.method == "DELETE":
        CartItem.objects.filter(user=request.user, product=product, size=size).delete()
        return JsonResponse(cart_payload(request.user), encoder=DjangoJSONEncoder)

    try:
        quantity = int(payload.get("quantity", 1))
    except (TypeError, ValueError):
        return JsonResponse({"errors": {"quantity": "Quantity must be a whole number."}}, status=400)

    if quantity < 1:
        return JsonResponse({"errors": {"quantity": "Quantity must be at least 1."}}, status=400)
    if quantity > 99:
        return JsonResponse({"errors": {"quantity": "Quantity cannot be more than 99."}}, status=400)

    cart_item, created = CartItem.objects.get_or_create(
        user=request.user,
        product=product,
        size=size,
        defaults={"quantity": quantity},
    )
    if not created:
        cart_item.quantity = quantity
        cart_item.save(update_fields=["quantity", "updated_at"])

    return JsonResponse(cart_payload(request.user), encoder=DjangoJSONEncoder)
