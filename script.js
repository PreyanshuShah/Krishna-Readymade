const products = [
  { id: 1, name: "Slim Fit Graphic Tee", price: 1299, old: 1799, cat: "tshirts", badge: "new", icon: "👕", bg: "p-bg-1", emoji: "🖤" },
  { id: 2, name: "Urban Cargo Shirt", price: 1899, old: 2499, cat: "shirts", badge: "trending", icon: "👔", bg: "p-bg-2", emoji: "🟫" },
  { id: 3, name: "Slim Stretch Jeans", price: 2499, old: 3299, cat: "jeans", badge: "new", icon: "👖", bg: "p-bg-3", emoji: "💙" },
  { id: 4, name: "Bomber Jacket Pro", price: 3999, old: 5499, cat: "jackets", badge: "trending", icon: "🧥", bg: "p-bg-4", emoji: "🖤" },
  { id: 5, name: "Oversized Street Tee", price: 999, old: 1499, cat: "tshirts", badge: "new", icon: "👕", bg: "p-bg-2", emoji: "⬜" },
  { id: 6, name: "Linen Summer Shirt", price: 1599, old: 2199, cat: "shirts", badge: "", icon: "👔", bg: "p-bg-1", emoji: "🟡" },
  { id: 7, name: "Ripped Skinny Jeans", price: 2199, old: 2999, cat: "jeans", badge: "trending", icon: "👖", bg: "p-bg-4", emoji: "💙" },
  { id: 8, name: "Track Jacket", price: 2799, old: 3599, cat: "jackets", badge: "new", icon: "🧥", bg: "p-bg-3", emoji: "🔴" }
];

let cart = [];
let wishlist = [];
let currentModalProduct = null;

const productGrid = document.getElementById("productGrid");
const cartBody = document.getElementById("cartBody");
const cartDrawer = document.getElementById("cartDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const popup = document.getElementById("popup");
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

function on(id, eventName, handler) {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener(eventName, handler);
  }
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

function renderProducts(filter = "all") {
  if (!productGrid) {
    return;
  }

  const normalizedFilter = normalizeCategory(filter);
  const filtered = normalizedFilter === "all" ? products : products.filter((product) => product.cat === normalizedFilter);

  productGrid.innerHTML = filtered.map((product) => `
    <div class="product-card" data-id="${product.id}">
      <div class="product-img">
        <div class="product-img-inner ${product.bg} product-placeholder">
          <span class="product-icon">${product.icon}</span>
          <span class="product-code">KR-${String(product.id).padStart(3, "0")}</span>
        </div>
        ${product.badge ? `<div class="product-badge badge-${product.badge}">${product.badge.toUpperCase()}</div>` : ""}
        <button class="product-wishlist ${wishlist.includes(product.id) ? "active" : ""}" data-action="toggle-wishlist" data-id="${product.id}">${wishlist.includes(product.id) ? "♥" : "♡"}</button>
        <button class="quick-view" data-action="open-modal" data-id="${product.id}">QUICK VIEW</button>
      </div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-price-row">
          <div>
            <span class="product-price">NPR ${product.price.toLocaleString()}</span>
            <span class="product-old-price">NPR ${product.old.toLocaleString()}</span>
          </div>
          <button class="add-cart-btn" data-action="add-cart" data-id="${product.id}">🛒</button>
        </div>
      </div>
    </div>
  `).join("");
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

function addToCart(id, size = "M") {
  const product = products.find((item) => item.id === id);

  if (!product) {
    return;
  }

  const existing = cart.find((item) => item.id === id && item.size === size);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, size, qty: 1 });
  }

  updateCartUI();
  renderCartItems();
  showAddedFeedback();
}

function removeFromCart(id, size) {
  cart = cart.filter((item) => !(item.id === id && item.size === size));
  updateCartUI();
  renderCartItems();
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
      <div class="cart-item-img">${item.icon}</div>
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
  modalImg.textContent = product.icon;
  modalImg.style.fontSize = "5rem";
  updateModalBadge(product);
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

function closePopup() {
  if (popup) {
    popup.classList.remove("show");
  }
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

on("popupClose", "click", closePopup);
on("popupSkip", "click", closePopup);
on("cartClose", "click", closeCart);
on("cartToggle", "click", openCart);
on("modalClose", "click", closeModal);
on("modalAddBtn", "click", addFromModal);
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
      addToCart(id);
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

if (popup) {
  window.setTimeout(() => {
    popup.classList.add("show");
  }, 3500);
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
