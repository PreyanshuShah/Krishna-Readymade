from django.urls import path
from . import api
from . import auth_views
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("login/", auth_views.login_view, name="login"),
    path("register/", auth_views.register_view, name="register"),
    path("logout/", auth_views.logout_view, name="logout"),
    path("collection/", views.collection, name="collection"),
    path("shop/", views.shop, name="shop"),
    path("products/<slug:slug>/", views.product_detail, name="product_detail"),
    path("new-drop/", views.new_drop, name="new_drop"),
    path("gallery/", views.gallery, name="gallery"),
    path("about/", views.about, name="about"),
    path("admin-products/", views.admin_products, name="admin_products"),
    path("dashboard/products/", views.admin_products, name="admin_products_dashboard"),
    path("api/products/", api.products_api, name="products_api"),
    path("api/products/<int:product_id>/", api.product_detail_api, name="product_detail_api"),
    path("api/new-drop/", api.new_drop_api, name="new_drop_api"),
]
