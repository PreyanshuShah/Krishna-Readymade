from django.contrib.auth import get_user_model, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme


def _safe_next_url(request):
    next_url = request.POST.get("next") or request.GET.get("next") or ""
    if url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}):
        return next_url
    return reverse("home")


def _login_redirect_url(request, user):
    if user.is_staff:
        return reverse("admin_products")
    return _safe_next_url(request)


def _first_registered_user_should_be_admin():
    return not get_user_model().objects.exists()


def login_view(request):
    if request.user.is_authenticated:
        return redirect(_login_redirect_url(request, request.user))

    form = AuthenticationForm(request, data=request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.get_user()
        login(request, user)
        return redirect(_login_redirect_url(request, user))

    return render(
        request,
        "login.html",
        {
            "form": form,
            "next": _safe_next_url(request),
        },
    )


def register_view(request):
    if request.user.is_authenticated:
        return redirect(_safe_next_url(request))

    form = UserCreationForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        first_user = _first_registered_user_should_be_admin()
        user = form.save(commit=False)
        if first_user:
            user.is_staff = True
            user.is_superuser = True
        user.save()
        login(request, user)
        return redirect(_login_redirect_url(request, user))

    return render(
        request,
        "register.html",
        {
            "form": form,
            "next": _safe_next_url(request),
        },
    )


def logout_view(request):
    logout(request)
    return redirect("home")


@login_required
def profile_view(request):
    return render(request, "profile.html")
