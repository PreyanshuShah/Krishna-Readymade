const defaultProducts = [
  { id: 1, name: "Slim Fit Graphic Tee", price: 1299, old: 1799, cat: "tshirts", badge: "new", icon: "👕", bg: "p-bg-1", emoji: "🖤" },
  { id: 2, name: "Urban Cargo Shirt", price: 1899, old: 2499, cat: "shirts", badge: "trending", icon: "👔", bg: "p-bg-2", emoji: "🟫" },
  { id: 3, name: "Slim Stretch Jeans", price: 2499, old: 3299, cat: "jeans", badge: "new", icon: "👖", bg: "p-bg-3", emoji: "💙" },
  { id: 4, name: "Bomber Jacket Pro", price: 3999, old: 5499, cat: "jackets", badge: "trending", icon: "🧥", bg: "p-bg-4", emoji: "🖤" },
  { id: 5, name: "Oversized Street Tee", price: 999, old: 1499, cat: "tshirts", badge: "new", icon: "👕", bg: "p-bg-2", emoji: "⬜" },
  { id: 6, name: "Linen Summer Shirt", price: 1599, old: 2199, cat: "shirts", badge: "", icon: "👔", bg: "p-bg-1", emoji: "🟡" },
  { id: 7, name: "Ripped Skinny Jeans", price: 2199, old: 2999, cat: "jeans", badge: "trending", icon: "👖", bg: "p-bg-4", emoji: "💙" },
  { id: 8, name: "Track Jacket", price: 2799, old: 3599, cat: "jackets", badge: "new", icon: "🧥", bg: "p-bg-3", emoji: "🔴" }
];

function getBackendProducts() {
  const dataEl = document.getElementById("productsData");

  if (!dataEl || !dataEl.textContent.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(dataEl.textContent);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.map((item, index) => ({
      id: Number(item.id ?? index + 1),
      name: item.name ?? "Product",
      slug: item.slug ?? `product-${item.id ?? index + 1}`,
      price: Number(item.price ?? 0),
      old: Number(item.old ?? item.old_price ?? item.price ?? 0),
      cat: normalizeCategory(item.cat ?? item.category ?? "tshirts"),
      badge: item.badge ?? "",
      icon: item.icon ?? "👕",
      bg: item.bg ?? "p-bg-1",
      emoji: item.emoji ?? "🖤",
      imageUrl: item.image_url ?? item.imageUrl ?? "",
      sizes: item.sizes ?? ["XS", "S", "M", "L", "XL", "XXL"],
      colors: item.colors ?? ["Black", "White", "Navy"],
      stockStatus: item.stock_status ?? item.stockStatus ?? "In stock"
    }));
  } catch (error) {
    console.warn("Invalid productsData JSON, using default products.", error);
    return null;
  }
}

let products = getBackendProducts() || defaultProducts;
const ORDER_WHATSAPP_NUMBER = "9842169807";
const ORDER_INSTAGRAM_URL = "https://ig.me/m/kris_hnareadymade";
const CART_API_BASE = "/api/cart/";

let cart = [];
let wishlist = [];
let currentModalProduct = null;

const productGrid = document.getElementById("productGrid");
const cartBody = document.getElementById("cartBody");
const cartDrawer = document.getElementById("cartDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const modalOverlay = document.getElementById("modalOverlay");
const modalImg = document.getElementById("modalImg");
const modalName = document.getElementById("modalName");
const modalPrice = document.getElementById("modalPrice");
const modalBadge = document.getElementById("modalBadge");
const navCartCount = document.getElementById("navCartCount");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const sizeSelector = document.getElementById("sizeSelector");
const filterButtons = document.querySelectorAll("[data-filter-btn]");
const cursor = document.getElementById("cursor");
const follower = document.getElementById("cursorFollower");
const countdownTarget = new Date();
const isAuthenticated = document.body.dataset.authenticated === "true";
const loginUrl = document.body.dataset.loginUrl || "/login/";
const orderOptions = document.getElementById("orderOptions");

function on(id, eventName, handler) {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener(eventName, handler);
  }
}

function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta && meta.content) {
    return meta.content;
  }

  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("csrftoken="));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

async function requestCart(options = {}) {
  const response = await fetch(CART_API_BASE, {
    ...options,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Could not update cart.");
  }
  return data;
}

function applyCartPayload(data) {
  cart = Array.isArray(data.items) ? data.items : [];
  updateCartUI();
  renderCartItems();
}

async function loadCartFromServer() {
  if (!isAuthenticated) {
    return;
  }

  try {
    applyCartPayload(await requestCart());
  } catch (_error) {
    updateCartUI();
    renderCartItems();
  }
}

async function saveCartItem(productId, size, quantity) {
  if (!isAuthenticated) {
    return;
  }

  applyCartPayload(await requestCart({
    method: "POST",
    body: JSON.stringify({ product_id: productId, size, quantity })
  }));
}

async function deleteCartItem(productId, size) {
  if (!isAuthenticated) {
    return;
  }

  applyCartPayload(await requestCart({
    method: "DELETE",
    body: JSON.stringify({ product_id: productId, size })
  }));
}

countdownTarget.setDate(countdownTarget.getDate() + 3);
countdownTarget.setHours(23, 59, 59, 0);

function normalizeCategory(category) {
  const value = String(category || "").trim().toLowerCase();

  if (!value || value === "all") {
    return "all";
  }

  const aliases = {
    tshirt: "tshirts",
    "t-shirts": "tshirts",
    "t-shirt": "tshirts",
    tee: "tshirts",
    tees: "tshirts",
    shirt: "shirts",
    jean: "jeans",
    jacket: "jackets"
  };

  return aliases[value] || value;
}

function renderProductImage(product) {
  if (product.imageUrl) {
    return `<img class="product-photo" src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}">`;
  }

  return `
    <div class="product-img-inner ${product.bg} product-placeholder">
      <span class="product-icon">${escapeHtml(product.icon)}</span>
      <span class="product-code">KR-${String(product.id).padStart(3, "0")}</span>
    </div>
  `;
}

function renderCartImage(product) {
  if (product.imageUrl) {
    return `<img class="cart-item-photo" src="${product.imageUrl}" alt="${product.name}">`;
  }

  return product.icon;
}

function requireLogin() {
  if (isAuthenticated) {
    return true;
  }

  const next = `${window.location.pathname}${window.location.search}`;
  window.location.href = `${loginUrl}?next=${encodeURIComponent(next)}`;
  return false;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function categoryLabel(category) {
  const labels = {
    tshirts: "T-Shirt",
    shirts: "Shirt",
    jeans: "Jeans",
    jackets: "Jacket"
  };
  return labels[category] || "Product";
}

function renderSizeChips(sizes = []) {
  return sizes.slice(0, 4).map((size) => `
    <span class="size-chip">${escapeHtml(size)}</span>
  `).join("");
}

function renderProducts(filter = "all") {
  if (!productGrid) {
    return;
  }

  const normalizedFilter = normalizeCategory(filter);
  const filtered = normalizedFilter === "all" ? products : products.filter((product) => product.cat === normalizedFilter);

  productGrid.innerHTML = filtered.map((product) => (
    window.KrishnaProductCard.render(product, { wishlist })
  )).join("");
}

async function hydrateProductsFromApi() {
  if (getBackendProducts()) {
    return;
  }

  try {
    const response = await fetch("/api/products/");
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const list = Array.isArray(data.products) ? data.products : [];

    if (!list.length) {
      return;
    }

    products = list.map((item, index) => ({
      id: Number(item.id ?? index + 1),
      name: item.name ?? "Product",
      slug: item.slug ?? `product-${item.id ?? index + 1}`,
      price: Number(item.price ?? 0),
      old: Number(item.old ?? item.old_price ?? item.price ?? 0),
      cat: normalizeCategory(item.cat ?? item.category ?? "tshirts"),
      badge: item.badge ?? "",
      icon: item.icon ?? "👕",
      bg: item.bg ?? "p-bg-1",
      emoji: item.emoji ?? "🖤",
      imageUrl: item.image_url ?? item.imageUrl ?? "",
      sizes: item.sizes ?? ["XS", "S", "M", "L", "XL", "XXL"],
      colors: item.colors ?? ["Black", "White", "Navy"],
      stockStatus: item.stock_status ?? item.stockStatus ?? "In stock"
    }));

    renderProducts();
    updateCartUI();
  } catch (_error) {
    // Keep defaults when API is unreachable.
  }
}

function setActiveFilterButton(category) {
  if (!filterButtons.length) {
    return;
  }

  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.category === category);
  });
}

function filterProducts(category) {
  const normalizedCategory = normalizeCategory(category);
  setActiveFilterButton(normalizedCategory);
  renderProducts(normalizedCategory);
}

function toggleWishlist(id, button) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter((wishId) => wishId !== id);
    button.classList.remove("active");
    button.textContent = "♡";
    return;
  }

  wishlist.push(id);
  button.classList.add("active");
  button.textContent = "♥";
}

async function addToCart(id, size = "M", quantity = 1) {
  if (!requireLogin()) {
    return;
  }

  const product = products.find((item) => item.id === id);

  if (!product) {
    return;
  }

  const existing = cart.find((item) => item.id === id && item.size === size);

  const qtyToAdd = Math.max(1, Number(quantity) || 1);

  if (existing) {
    existing.qty += qtyToAdd;
  } else {
    cart.push({ ...product, size, qty: qtyToAdd });
  }

  updateCartUI();
  renderCartItems();
  try {
    await saveCartItem(id, size, existing ? existing.qty : qtyToAdd);
  } catch (_error) {
    window.alert("Could not save cart. Please try again.");
  }
   
  showAddedFeedback();
}

function quantityFromCard(actionElement) {
  const card = actionElement.closest(".product-card");
  const input = card ? card.querySelector(".product-quantity input") : null;
  return Math.max(1, Number(input ? input.value : 1) || 1);
}

async function removeFromCart(id, size) {
  cart = cart.filter((item) => !(item.id === id && item.size === size));
  updateCartUI();
  renderCartItems();
  try {
    await deleteCartItem(id, size);
  } catch (_error) {
    window.alert("Could not remove item. Please try again.");
  }
}

function buildOrderMessage() {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemLines = cart.map((item, index) => (
    `${index + 1}. ${item.name} (Size: ${item.size}) x${item.qty} - NPR ${(item.price * item.qty).toLocaleString()}`
  ));

  return [
    "Hello Krishna Readymade, I want to place an order:",
    "",
    ...itemLines,
    "",
    `Total: NPR ${total.toLocaleString()}`,
    "",
    "Please confirm availability and payment details."
  ].join("\n");
}

function handleCheckout() {
  if (!requireLogin()) {
    return;
  }

  if (!cart.length) {
    window.alert("Your cart is empty. Please add products first.");
    return;
  }

  if (orderOptions) {
    orderOptions.hidden = !orderOptions.hidden;
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

async function openOrderChannel(channel) {
  if (!requireLogin()) {
    return;
  }

  if (!cart.length) {
    window.alert("Your cart is empty. Please add products first.");
    return;
  }

  const message = buildOrderMessage();
  const whatsappUrl = `https://wa.me/${ORDER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const orderUrl = channel === "whatsapp" ? whatsappUrl : ORDER_INSTAGRAM_URL;

  if (channel === "instagram") {
    const copied = await copyTextToClipboard(message).catch(() => false);
    if (copied) {
      window.alert("Order details copied. Paste them in the Instagram message box.");
    } else {
      window.prompt("Copy your order details, then paste them in Instagram:", message);
    }
  }

  window.open(orderUrl, "_blank", "noopener,noreferrer");
  if (orderOptions) {
    orderOptions.hidden = true;
  }
}

function updateCartUI() {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  if (navCartCount) {
    navCartCount.textContent = count;
  }
  if (cartCount) {
    cartCount.textContent = count;
  }
  if (cartTotal) {
    cartTotal.textContent = total.toLocaleString();
  }
}

function renderCartItems() {
  if (!cartBody) {
    return;
  }

  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">🛍️</span>
        <p>Your cart is empty</p>
        <p class="cart-empty-note">Add items to get started</p>
      </div>
    `;
    return;
  }

  cartBody.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div class="cart-item-img">${renderCartImage(item)}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">NPR ${item.price.toLocaleString()} × ${item.qty}</div>
        <div class="cart-item-size">Size: ${item.size}</div>
      </div>
      <button class="cart-item-remove" data-action="remove-cart" data-id="${item.id}" data-size="${item.size}">✕</button>
    </div>
  `).join("");
}

function openCart() {
  if (!requireLogin()) {
    return;
  }

  if (!cartDrawer || !drawerOverlay) {
    return;
  }

  renderCartItems();
  cartDrawer.classList.add("open");
  drawerOverlay.classList.add("show");
}

function closeCart() {
  if (!cartDrawer || !drawerOverlay) {
    return;
  }

  cartDrawer.classList.remove("open");
  drawerOverlay.classList.remove("show");
}

function showAddedFeedback() {
  if (!navCartCount) {
    return;
  }

  navCartCount.style.background = "#2ecc71";
  window.setTimeout(() => {
    navCartCount.style.background = "var(--gold)";
  }, 600);
}

function resetSelectedSize() {
  if (!sizeSelector) {
    return;
  }

  const sizeButtons = sizeSelector.querySelectorAll(".size-btn");

  sizeButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.size === "M");
  });
}

function updateModalBadge(product) {
  if (!modalBadge) {
    return;
  }

  modalBadge.classList.remove("badge-new", "badge-trending", "is-hidden");

  if (!product.badge) {
    modalBadge.classList.add("is-hidden");
    return;
  }

  modalBadge.textContent = product.badge.toUpperCase();
  modalBadge.classList.add(`badge-${product.badge}`);
}

function openModal(id) {
  const product = products.find((item) => item.id === id);

  if (!product) {
    return;
  }

  currentModalProduct = product;
  if (!modalName || !modalPrice || !modalImg || !modalOverlay) {
    return;
  }

  modalName.textContent = product.name;
  modalPrice.textContent = `NPR ${product.price.toLocaleString()}`;
  if (product.imageUrl) {
    modalImg.innerHTML = `<img class="modal-photo" src="${product.imageUrl}" alt="${product.name}">`;
    modalImg.style.fontSize = "";
  } else {
    modalImg.textContent = product.icon;
    modalImg.style.fontSize = "5rem";
  }
  updateModalBadge(product);
  const detailText = document.querySelector(".modal-details");
  if (detailText) {
    const sizes = Array.isArray(product.sizes) ? product.sizes.join(", ") : product.sizes;
    const colors = Array.isArray(product.colors) ? product.colors.join(", ") : product.colors;
    detailText.textContent = `Sizes: ${sizes || "M"} | Colors: ${colors || "Standard"} | Stock: ${product.stockStatus || "In stock"}`;
  }
  resetSelectedSize();
  modalOverlay.classList.add("show");
}

function closeModal() {
  if (modalOverlay) {
    modalOverlay.classList.remove("show");
  }
}

function selectSize(button) {
  if (!sizeSelector) {
    return;
  }

  sizeSelector.querySelectorAll(".size-btn").forEach((item) => {
    item.classList.remove("selected");
  });
  button.classList.add("selected");
}

function addFromModal() {
  if (!sizeSelector) {
    return;
  }

  const selected = sizeSelector.querySelector(".size-btn.selected");
  const size = selected ? selected.dataset.size : "M";

  if (!currentModalProduct) {
    return;
  }

  addToCart(currentModalProduct.id, size);
  closeModal();
  openCart();
}


function updateCountdown() {
  const daysElement = document.getElementById("days");
  const hoursElement = document.getElementById("hours");
  const minsElement = document.getElementById("mins");
  const secsElement = document.getElementById("secs");

  if (!daysElement || !hoursElement || !minsElement || !secsElement) {
    return;
  }

  const diff = Math.max(0, countdownTarget - new Date());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  daysElement.textContent = String(days).padStart(2, "0");
  hoursElement.textContent = String(hours).padStart(2, "0");
  minsElement.textContent = String(mins).padStart(2, "0");
  secsElement.textContent = String(secs).padStart(2, "0");
}

on("cartClose", "click", closeCart);
on("cartToggle", "click", openCart);
on("modalClose", "click", closeModal);
on("modalAddBtn", "click", addFromModal);
const checkoutButton = document.querySelector(".checkout-btn");
if (checkoutButton) {
  checkoutButton.addEventListener("click", handleCheckout);
}

if (orderOptions) {
  orderOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-order-channel]");
    if (!button) {
      return;
    }
    openOrderChannel(button.dataset.orderChannel);
  });
}
if (drawerOverlay) {
  drawerOverlay.addEventListener("click", closeCart);
}

document.querySelectorAll(".cat-card").forEach((card) => {
  card.addEventListener("click", () => {
    filterProducts(card.dataset.filter);
  });
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterProducts(button.dataset.category);
  });
});

if (productGrid) {
  productGrid.addEventListener("click", (event) => {
    const actionElement = event.target.closest("[data-action]");

    if (!actionElement) {
      return;
    }

    const id = Number(actionElement.dataset.id);

    if (actionElement.dataset.action === "toggle-wishlist") {
      toggleWishlist(id, actionElement);
    }

    if (actionElement.dataset.action === "open-modal") {
      openModal(id);
    }

    if (actionElement.dataset.action === "add-cart") {
      addToCart(id, "M", quantityFromCard(actionElement));
    }
  });

  productGrid.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-quantity-step]");

    if (!quantityButton) {
      return;
    }

    const quantity = quantityButton.closest(".product-quantity");
    const input = quantity ? quantity.querySelector("input") : null;
    if (!input) {
      return;
    }

    const nextValue = Math.max(1, Math.min(99, Number(input.value || 1) + Number(quantityButton.dataset.quantityStep)));
    input.value = nextValue;
  });

  productGrid.addEventListener("input", (event) => {
    const input = event.target.closest(".product-quantity input");
    if (input) {
      input.value = Math.max(1, Math.min(99, Number(input.value || 1)));
    }
  });
}

if (cartBody) {
  cartBody.addEventListener("click", (event) => {
    const removeButton = event.target.closest('[data-action="remove-cart"]');

    if (!removeButton) {
      return;
    }

    removeFromCart(Number(removeButton.dataset.id), removeButton.dataset.size);
  });
}

if (sizeSelector) {
  sizeSelector.addEventListener("click", (event) => {
    const button = event.target.closest(".size-btn");

    if (!button) {
      return;
    }

    selectSize(button);
  });
}

if (modalOverlay) {
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });
}


window.addEventListener("load", () => {
  window.setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader) {
      loader.classList.add("hidden");
    }
  }, 2000);
});

window.addEventListener("scroll", () => {
  const nav = document.getElementById("navbar");
  if (nav) {
    nav.classList.toggle("scrolled", window.scrollY > 50);
  }
});

let mouseX = 0;
let mouseY = 0;
let followerX = 0;
let followerY = 0;

document.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
  if (cursor) {
    cursor.style.left = `${mouseX - 6}px`;
    cursor.style.top = `${mouseY - 6}px`;
  }
});

function animateFollower() {
  followerX += (mouseX - followerX - 18) * 0.12;
  followerY += (mouseY - followerY - 18) * 0.12;
  if (follower) {
    follower.style.left = `${followerX}px`;
    follower.style.top = `${followerY}px`;
  }
  window.requestAnimationFrame(animateFollower);
}

animateFollower();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach((element) => {
  observer.observe(element);
});

window.setInterval(updateCountdown, 1000);
updateCountdown();
renderProducts();
updateCartUI();
renderCartItems();
hydrateProductsFromApi();
loadCartFromServer();
