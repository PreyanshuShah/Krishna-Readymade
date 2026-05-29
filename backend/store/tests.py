import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import NewDrop, Product


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
        self.assertEqual(data["products"][0]["sizes"], ["XS", "S", "M", "L", "XL", "XXL"])
        self.assertEqual(data["products"][0]["colors"], ["Black", "White", "Navy"])
        self.assertEqual(data["products"][0]["stock_status"], "In stock")

    def test_list_products_can_filter_by_category(self):
        response = self.client.get("/api/products/?category=shirts&all=1")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["products"]), 1)
        self.assertEqual(data["products"][0]["name"], "Hidden Shirt")

    def test_public_can_open_product_detail_page(self):
        response = self.client.get(f"/products/{self.product.slug}/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.product.name)
        self.assertContains(response, "In stock")

    def test_public_can_open_new_drop_page_with_default_content(self):
        response = self.client.get("/new-drop/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "THE BOLD")
        self.assertContains(response, "SHOP THE DROP")

    def test_new_drop_page_uses_latest_active_admin_content(self):
        NewDrop.objects.create(
            title="ADMIN\nDROP",
            season="Winter Drop 2026",
            season_code="WD 2026",
            description="Added from admin panel.",
            features="Heavy fabric\nLimited stock",
            badge="JUST ADDED",
            visual_number="26",
            icon="D",
            button_text="VIEW PRODUCTS",
        )

        response = self.client.get("/new-drop/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "ADMIN")
        self.assertContains(response, "Winter Drop 2026")
        self.assertContains(response, "Heavy fabric")
        self.assertContains(response, "VIEW PRODUCTS")

    def test_home_page_uses_latest_active_new_drop_content(self):
        NewDrop.objects.create(
            title="HOME\nDROP",
            season="Dashain Season 2026",
            season_code="DS 2026",
            description="Shown on the homepage.",
            features="Feature one\nFeature two",
            badge="HOME FEATURE",
            visual_number="26",
            icon="H",
            button_text="SHOP HOME DROP",
        )

        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "HOME")
        self.assertContains(response, "Dashain Season 2026")
        self.assertContains(response, "Feature one")
        self.assertContains(response, "SHOP HOME DROP")

    def test_public_cannot_manage_new_drop_api(self):
        response = self.client.get("/api/new-drop/")

        self.assertEqual(response.status_code, 403)

    def test_staff_can_update_new_drop_from_dashboard_api(self):
        self.client.force_login(self.staff_user)
        response = self.client.post(
            "/api/new-drop/",
            {
                "title": "Dashboard Drop",
                "season": "Festival Season 2026",
                "season_code": "FS 2026",
                "description": "Saved from the custom admin dashboard.",
                "features": "Kurta sets\nShirts\nJeans",
                "badge": "ADMIN ADDED",
                "visual_number": "26",
                "icon": "K",
                "button_text": "SHOP NOW",
                "button_url": "",
                "is_active": "1",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["drop"]["title"], "Dashboard Drop")
        self.assertTrue(NewDrop.objects.filter(title="Dashboard Drop", is_active=True).exists())

        page_response = self.client.get("/new-drop/")

        self.assertEqual(page_response.status_code, 200)
        self.assertContains(page_response, "Dashboard Drop")
        self.assertContains(page_response, "Festival Season 2026")

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

    def test_public_can_open_login_and_register_pages(self):
        login_response = self.client.get("/login/")
        register_response = self.client.get("/register/")

        self.assertEqual(login_response.status_code, 200)
        self.assertContains(login_response, "Login")
        self.assertEqual(register_response.status_code, 200)
        self.assertContains(register_response, "Register")

    def test_register_creates_and_logs_in_user(self):
        response = self.client.post(
            "/register/?next=/shop/",
            {
                "username": "newcustomer",
                "password1": "StrongPass123!",
                "password2": "StrongPass123!",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/shop/")
        self.assertTrue(get_user_model().objects.filter(username="newcustomer").exists())

    def test_staff_login_redirects_to_admin_products(self):
        response = self.client.post(
            "/login/?next=/shop/",
            {
                "username": "staff",
                "password": "password",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/admin-products/")

    def test_authenticated_staff_opening_login_redirects_to_admin_products(self):
        self.client.force_login(self.staff_user)

        response = self.client.get("/login/")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/admin-products/")
