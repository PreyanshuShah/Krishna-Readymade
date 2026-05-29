from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("collection/", views.collection, name="collection"),
    path("shop/", views.shop, name="shop"),
    path("new-drop/", views.new_drop, name="new_drop"),
    path("about/", views.about, name="about"),
    path("admin-products/", views.admin_products, name="admin_products"),
    path("dashboard/products/", views.admin_products, name="admin_products_dashboard"),
    path("api/products/", views.products_api, name="products_api"),
    path("api/products/<int:product_id>/", views.product_detail_api, name="product_detail_api"),
]
