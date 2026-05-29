const apiBase = "/api/products/";
const newDropApiBase = "/api/new-drop/";
const rowsEl = document.getElementById("productRows");
const emptyState = document.getElementById("emptyState");
const statusText = document.getElementById("statusText");
const countText = document.getElementById("countText");
const form = document.getElementById("productForm");
const formTitle = document.getElementById("formTitle");
const formErrors = document.getElementById("formErrors");
const productId = document.getElementById("productId");
const fields = {
  name: document.getElementById("nameInput"),
  slug: document.getElementById("slugInput"),
  category: document.getElementById("categoryInput"),
  badge: document.getElementById("badgeInput"),
  price: document.getElementById("priceInput"),
  icon: document.getElementById("iconInput"),
  emoji: document.getElementById("emojiInput"),
  bg: document.getElementById("bgInput"),
  sizes: document.getElementById("sizesInput"),
  colors: document.getElementById("colorsInput"),
  stockStatus: document.getElementById("stockStatusInput"),
  image: document.getElementById("imageInput"),
  isActive: document.getElementById("activeInput")
};
const imagePreview = document.getElementById("imagePreview");
const dropForm = document.getElementById("newDropForm");
const dropFormErrors = document.getElementById("dropFormErrors");
const dropStatusText = document.getElementById("dropStatusText");
const dropFields = {
  title: document.getElementById("dropTitleInput"),
  season: document.getElementById("dropSeasonInput"),
  seasonCode: document.getElementById("dropSeasonCodeInput"),
  description: document.getElementById("dropDescriptionInput"),
  features: document.getElementById("dropFeaturesInput"),
  badge: document.getElementById("dropBadgeInput"),
  visualNumber: document.getElementById("dropVisualNumberInput"),
  icon: document.getElementById("dropIconInput"),
  buttonText: document.getElementById("dropButtonTextInput"),
  buttonUrl: document.getElementById("dropButtonUrlInput"),
  image: document.getElementById("dropImageInput"),
  isActive: document.getElementById("dropActiveInput")
};
const dropImagePreview = document.getElementById("dropImagePreview");
const filters = {
  search: document.getElementById("searchInput"),
  category: document.getElementById("categoryFilter"),
  badge: document.getElementById("badgeFilter"),
  includeInactive: document.getElementById("includeInactive")
};

let products = [];

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

function setStatus(message) {
  statusText.textContent = message;
}

function setDropStatus(message) {
  dropStatusText.textContent = message;
}

function setErrors(errors) {
  if (!errors) {
    formErrors.hidden = true;
    formErrors.textContent = "";
    return;
  }

  if (typeof errors === "string") {
    formErrors.textContent = errors;
  } else {
    formErrors.innerHTML = Object.entries(errors)
      .map(([field, message]) => `<div>${field}: ${message}</div>`)
      .join("");
  }
  formErrors.hidden = false;
}

function setDropErrors(errors) {
  if (!errors) {
    dropFormErrors.hidden = true;
    dropFormErrors.textContent = "";
    return;
  }

  if (typeof errors === "string") {
    dropFormErrors.textContent = errors;
  } else {
    dropFormErrors.innerHTML = Object.entries(errors)
      .map(([field, message]) => `<div>${field}: ${message}</div>`)
      .join("");
  }
  dropFormErrors.hidden = false;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken(),
      ...(options.headers || {})
    }
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.payload = data;
    throw error;
  }
  return data;
}

async function requestForm(url, formData) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "X-CSRFToken": getCsrfToken()
    },
    body: formData
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.payload = data;
    throw error;
  }
  return data;
}

function buildListUrl() {
  const params = new URLSearchParams();
  params.set("all", filters.includeInactive.checked ? "1" : "0");

  if (filters.category.value && filters.category.value !== "all") {
    params.set("category", filters.category.value);
  }
  if (filters.badge.value !== "all") {
    params.set("badge", filters.badge.value);
  }
  if (filters.search.value.trim()) {
    params.set("q", filters.search.value.trim());
  }

  return `${apiBase}?${params.toString()}`;
}

function formatMoney(value) {
  return `NPR ${Number(value || 0).toLocaleString()}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderProductMedia(product) {
  if (product.image_url) {
    return `<img class="product-thumb" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">`;
  }
  return `<div class="product-icon">${escapeHtml(product.icon || "T")}</div>`;
}

function setImagePreview(src, alt = "Product image") {
  if (!src) {
    imagePreview.hidden = true;
    imagePreview.innerHTML = "";
    return;
  }

  imagePreview.innerHTML = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`;
  imagePreview.hidden = false;
}

function setDropImagePreview(src, alt = "New drop image") {
  if (!src) {
    dropImagePreview.hidden = true;
    dropImagePreview.innerHTML = "";
    return;
  }

  dropImagePreview.innerHTML = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`;
  dropImagePreview.hidden = false;
}

function renderRows() {
  rowsEl.innerHTML = products.map((product) => `
    <tr>
      <td>
        <div class="product-cell">
          ${renderProductMedia(product)}
          <div>
            <div class="product-name">${escapeHtml(product.name)}</div>
            <div class="product-slug">${escapeHtml(product.slug)}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(product.category)}</td>
      <td>
        <div>${formatMoney(product.price)}</div>
        <div class="product-slug">${escapeHtml(product.stock_status || "In stock")}</div>
      </td>
      <td>${product.badge ? `<span class="badge">${escapeHtml(product.badge)}</span>` : "-"}</td>
      <td><span class="state ${product.is_active ? "active" : "inactive"}">${product.is_active ? "Active" : "Inactive"}</span></td>
      <td>
        <div class="row-actions">
          <button class="secondary-btn" type="button" data-action="edit" data-id="${product.id}">Edit</button>
          <button class="secondary-btn" type="button" data-action="toggle" data-id="${product.id}">
            ${product.is_active ? "Hide" : "Show"}
          </button>
          <button class="danger-btn" type="button" data-action="delete" data-id="${product.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  emptyState.hidden = products.length > 0;
  countText.textContent = `${products.length} product${products.length === 1 ? "" : "s"}`;
}

async function loadProducts() {
  setStatus("Loading products...");
  try {
    const data = await requestJson(buildListUrl(), { headers: { "Content-Type": "application/json" } });
    products = data.products || [];
    renderRows();
    setStatus("Products loaded.");
  } catch (error) {
    setStatus(error.message);
  }
}

async function loadNewDrop() {
  setDropStatus("Loading New Drop details...");
  try {
    const data = await requestJson(newDropApiBase);
    const drop = data.drop || {};
    dropFields.title.value = drop.title || "THE BOLD\nCOLLECTION";
    dropFields.season.value = drop.season || "Summer Season 2025";
    dropFields.seasonCode.value = drop.season_code || "SS 2025";
    dropFields.description.value = drop.description || "";
    dropFields.features.value = drop.features || "";
    dropFields.badge.value = drop.badge || "EXCLUSIVE DROP";
    dropFields.visualNumber.value = drop.visual_number || "25";
    dropFields.icon.value = drop.icon || "F";
    dropFields.buttonText.value = drop.button_text || "SHOP THE DROP";
    dropFields.buttonUrl.value = drop.button_url || "";
    dropFields.image.value = "";
    dropFields.isActive.checked = drop.is_active !== false;
    setDropImagePreview(drop.image_url, drop.title || "New drop image");
    setDropErrors(null);
    setDropStatus("New Drop details loaded.");
  } catch (error) {
    setDropErrors(error.message);
    setDropStatus("Could not load New Drop details.");
  }
}

function clearForm() {
  productId.value = "";
  form.reset();
  fields.category.value = "tshirts";
  fields.badge.value = "";
  fields.icon.value = "T";
  fields.emoji.value = "K";
  fields.bg.value = "p-bg-1";
  fields.sizes.value = "XS,S,M,L,XL,XXL";
  fields.colors.value = "Black,White,Navy";
  fields.stockStatus.value = "In stock";
  fields.image.value = "";
  fields.isActive.checked = true;
  formTitle.textContent = "New Product";
  setImagePreview("");
  setErrors(null);
  fields.name.focus();
}

function editProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) {
    return;
  }

  productId.value = product.id;
  fields.name.value = product.name || "";
  fields.slug.value = product.slug || "";
  fields.category.value = product.category || "tshirts";
  fields.badge.value = product.badge || "";
  fields.price.value = product.price || 0;
  fields.icon.value = product.icon || "T";
  fields.emoji.value = product.emoji || "K";
  fields.bg.value = product.bg || "p-bg-1";
  fields.sizes.value = Array.isArray(product.sizes) ? product.sizes.join(",") : product.sizes || "XS,S,M,L,XL,XXL";
  fields.colors.value = Array.isArray(product.colors) ? product.colors.join(",") : product.colors || "Black,White,Navy";
  fields.stockStatus.value = product.stock_status || "In stock";
  fields.image.value = "";
  fields.isActive.checked = Boolean(product.is_active);
  formTitle.textContent = `Edit #${product.id}`;
  setImagePreview(product.image_url, product.name);
  setErrors(null);
}

function getPayload() {
  return {
    name: fields.name.value.trim(),
    slug: fields.slug.value.trim(),
    category: fields.category.value,
    badge: fields.badge.value,
    price: fields.price.value,
    icon: fields.icon.value.trim() || "T",
    emoji: fields.emoji.value.trim() || "K",
    bg: fields.bg.value,
    sizes: fields.sizes.value.trim() || "XS,S,M,L,XL,XXL",
    colors: fields.colors.value.trim() || "Black,White,Navy",
    stock_status: fields.stockStatus.value.trim() || "In stock",
    is_active: fields.isActive.checked
  };
}

function getFormData() {
  const formData = new FormData(form);
  formData.set("name", fields.name.value.trim());
  formData.set("slug", fields.slug.value.trim());
  formData.set("price", fields.price.value);
  formData.set("icon", fields.icon.value.trim() || "T");
  formData.set("emoji", fields.emoji.value.trim() || "K");
  formData.set("sizes", fields.sizes.value.trim() || "XS,S,M,L,XL,XXL");
  formData.set("colors", fields.colors.value.trim() || "Black,White,Navy");
  formData.set("stock_status", fields.stockStatus.value.trim() || "In stock");
  formData.set("is_active", fields.isActive.checked ? "1" : "0");
  return formData;
}

async function saveProduct(event) {
  event.preventDefault();
  setErrors(null);
  const id = productId.value;
  const url = id ? `${apiBase}${id}/` : apiBase;
  const selectedImage = fields.image.files[0];

  try {
    const savedProduct = await requestForm(url, getFormData());
    if (selectedImage && !savedProduct.image_url) {
      throw new Error("Product saved, but the image was not attached. Please try choosing the image again.");
    }
    clearForm();
    await loadProducts();
    setStatus(savedProduct.image_url ? "Product saved with image." : "Product saved without image.");
  } catch (error) {
    setErrors(error.payload && error.payload.errors ? error.payload.errors : error.message);
    setStatus("Could not save product.");
  }
}

function getDropFormData() {
  const formData = new FormData(dropForm);
  formData.set("title", dropFields.title.value.trim());
  formData.set("season", dropFields.season.value.trim());
  formData.set("season_code", dropFields.seasonCode.value.trim());
  formData.set("description", dropFields.description.value.trim());
  formData.set("features", dropFields.features.value.trim());
  formData.set("badge", dropFields.badge.value.trim());
  formData.set("visual_number", dropFields.visualNumber.value.trim());
  formData.set("icon", dropFields.icon.value.trim());
  formData.set("button_text", dropFields.buttonText.value.trim());
  formData.set("button_url", dropFields.buttonUrl.value.trim());
  formData.set("is_active", dropFields.isActive.checked ? "1" : "0");
  return formData;
}

async function saveNewDrop(event) {
  event.preventDefault();
  setDropErrors(null);
  setDropStatus("Saving New Drop details...");

  try {
    const data = await requestForm(newDropApiBase, getDropFormData());
    const drop = data.drop || {};
    dropFields.image.value = "";
    setDropImagePreview(drop.image_url, drop.title || "New drop image");
    await loadNewDrop();
    setDropStatus("New Drop details saved. Open View Page to see it.");
    setStatus("New Drop details saved.");
  } catch (error) {
    setDropErrors(error.payload && error.payload.errors ? error.payload.errors : error.message);
    setDropStatus("Could not save New Drop details.");
    setStatus("Could not save New Drop details.");
  }
}

async function toggleProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) {
    return;
  }

  try {
    await requestJson(`${apiBase}${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !product.is_active })
    });
    await loadProducts();
    setStatus(product.is_active ? "Product hidden." : "Product shown.");
  } catch (error) {
    setStatus(error.message);
  }
}

async function deleteProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) {
    return;
  }

  if (!window.confirm(`Delete ${product.name}?`)) {
    return;
  }

  try {
    await requestJson(`${apiBase}${id}/`, { method: "DELETE" });
    if (productId.value === String(id)) {
      clearForm();
    }
    await loadProducts();
    setStatus("Product deleted.");
  } catch (error) {
    setStatus(error.message);
  }
}

rowsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") {
    editProduct(id);
  }
  if (button.dataset.action === "toggle") {
    toggleProduct(id);
  }
  if (button.dataset.action === "delete") {
    deleteProduct(id);
  }
});

form.addEventListener("submit", saveProduct);
dropForm.addEventListener("submit", saveNewDrop);
fields.image.addEventListener("change", () => {
  const file = fields.image.files[0];
  setImagePreview(file ? URL.createObjectURL(file) : "");
});
dropFields.image.addEventListener("change", () => {
  const file = dropFields.image.files[0];
  setDropImagePreview(file ? URL.createObjectURL(file) : "");
});
document.getElementById("clearFormBtn").addEventListener("click", clearForm);
document.getElementById("newProductBtn").addEventListener("click", clearForm);
document.getElementById("refreshBtn").addEventListener("click", loadProducts);
Object.values(filters).forEach((field) => {
  field.addEventListener("input", loadProducts);
  field.addEventListener("change", loadProducts);
});

loadProducts();
loadNewDrop();
