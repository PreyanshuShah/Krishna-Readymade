function normalizeCategory(category) {
  const value = String(category || "").trim().toLowerCase();

  if (!value || value === "all") {
    return "";
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getBackendProducts() {
  const dataEl = document.getElementById("productsData");

  if (!dataEl || !dataEl.textContent.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(dataEl.textContent);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item, index) => ({
      id: Number(item.id ?? index + 1),
      name: item.name ?? "Product",
      slug: item.slug ?? `product-${item.id ?? index + 1}`,
      price: Number(item.price ?? 0),
      cat: normalizeCategory(item.cat ?? item.category ?? "tshirts"),
      badge: item.badge ?? "",
      icon: item.icon ?? "K",
      bg: item.bg ?? "p-bg-1",
      imageUrl: item.image_url ?? item.imageUrl ?? "",
      sizes: item.sizes ?? [],
      colors: item.colors ?? [],
      stockStatus: item.stock_status ?? item.stockStatus ?? "In stock"
    }));
  } catch (error) {
    console.warn("Invalid collection product data.", error);
    return [];
  }
}

const products = getBackendProducts();
const productGrid = document.getElementById("productGrid");
const collectionEmpty = document.getElementById("collectionEmpty");
const collectionTitle = document.getElementById("collectionTitle");
const collectionSection = document.getElementById("collectionProducts");
const categoryCards = document.querySelectorAll(".cat-card");

const categoryLabels = {
  tshirts: "T-Shirts",
  shirts: "Shirts",
  jeans: "Jeans",
  jackets: "Jackets"
};

function renderProductImage(product) {
  if (product.imageUrl) {
    return `<img class="product-photo" src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}">`;
  }

  return `
    <div class="product-img-inner ${escapeHtml(product.bg)} product-placeholder">
      <span class="product-icon">${escapeHtml(product.icon)}</span>
      <span class="product-code">KR-${String(product.id).padStart(3, "0")}</span>
    </div>
  `;
}

function renderSizeChips(sizes = []) {
  return sizes.slice(0, 4).map((size) => `<span class="size-chip">${escapeHtml(size)}</span>`).join("");
}

function setActiveCategory(category) {
  categoryCards.forEach((card) => {
    card.classList.toggle("active", normalizeCategory(card.dataset.filter) === category);
  });
}

function renderProducts(category) {
  const normalizedCategory = normalizeCategory(category);
  const filtered = products.filter((product) => product.cat === normalizedCategory);
  setActiveCategory(normalizedCategory);

  if (collectionTitle) {
    const label = categoryLabels[normalizedCategory] || "Collection";
    collectionTitle.textContent = `${label} (${filtered.length})`;
  }

  if (!productGrid || !collectionEmpty) {
    return;
  }

  if (!normalizedCategory) {
    productGrid.innerHTML = "";
    collectionEmpty.hidden = false;
    return;
  }

  if (!filtered.length) {
    productGrid.innerHTML = "";
    collectionEmpty.hidden = false;
    collectionEmpty.innerHTML = `
      <h3>No products found</h3>
      <p>This category does not have active products yet.</p>
    `;
    return;
  }

  collectionEmpty.hidden = true;
  productGrid.innerHTML = filtered.map((product) => (
    window.KrishnaProductCard.render(product, {
      showWishlist: false,
      showQuickView: false,
      showAddCart: false,
      showDetailLink: true
    })
  )).join("");
}

categoryCards.forEach((card) => {
  card.addEventListener("click", () => {
    const category = normalizeCategory(card.dataset.filter);
    renderProducts(category);
    if (collectionSection) {
      collectionSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const initialCategory = normalizeCategory(collectionSection ? collectionSection.dataset.selectedCategory : "");
renderProducts(initialCategory);
