import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Product


class ProductApiTests(TestCase):
    def setUp(self):
        self.staff_user = get_user_model().objects.create_user(
            username="staff",
            password="password",
            is_staff=True,
        )
        self.product = Product.objects.create(
            name="Slim Fit Graphic Tee",
            slug="slim-fit-graphic-tee",
            category="tshirts",
            price=1299,
            old_price=1799,
            badge="new",
            icon="T",
            bg="p-bg-1",
            emoji="B",
        )
        Product.objects.create(
            name="Hidden Shirt",
            slug="hidden-shirt",
            category="shirts",
            price=999,
            is_active=False,
        )

    def test_list_products_returns_active_frontend_payload(self):
        response = self.client.get("/api/products/")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["products"]), 1)
        self.assertEqual(data["products"][0]["name"], "Slim Fit Graphic Tee")
        self.assertEqual(data["products"][0]["cat"], "tshirts")
        self.assertEqual(data["products"][0]["old"], 1799)

    def test_list_products_can_filter_by_category(self):
        response = self.client.get("/api/products/?category=shirts&all=1")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["products"]), 1)
        self.assertEqual(data["products"][0]["name"], "Hidden Shirt")

    def test_create_product(self):
        self.client.force_login(self.staff_user)
        response = self.client.post(
            "/api/products/",
            data=json.dumps(
                {
                    "name": "Urban Cargo Shirt",
                    "cat": "shirts",
                    "price": 1899,
                    "old": 2499,
                    "badge": "trending",
                    "icon": "S",
                    "bg": "p-bg-2",
                    "emoji": "C",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["slug"], "urban-cargo-shirt")
        self.assertEqual(data["category"], "shirts")
        self.assertEqual(Product.objects.count(), 3)

    def test_patch_product(self):
        self.client.force_login(self.staff_user)
        response = self.client.patch(
            f"/api/products/{self.product.id}/",
            data=json.dumps({"price": 1399, "is_active": False}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.price, 1399)
        self.assertFalse(self.product.is_active)

    def test_put_product_validates_required_fields(self):
        self.client.force_login(self.staff_user)
        response = self.client.put(
            f"/api/products/{self.product.id}/",
            data=json.dumps({"price": 1399}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.json()["errors"])

    def test_delete_product(self):
        self.client.force_login(self.staff_user)
        response = self.client.delete(f"/api/products/{self.product.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Product.objects.filter(id=self.product.id).exists())

    def test_public_write_requests_are_rejected(self):
        response = self.client.post(
            "/api/products/",
            data=json.dumps({"name": "Public Product", "price": 100}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_admin_products_page_requires_staff_login(self):
        response = self.client.get("/admin-products/")

        self.assertEqual(response.status_code, 302)

    def test_staff_can_open_admin_products_page(self):
        self.client.force_login(self.staff_user)

        response = self.client.get("/admin-products/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Products")
