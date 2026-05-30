(function () {
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

  function renderProductImage(product) {
    if (product.imageUrl) {
      return `<img class="product-photo" src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}">`;
    }

    return `
      <div class="product-img-inner ${escapeHtml(product.bg || "p-bg-1")} product-placeholder">
        <span class="product-icon">${escapeHtml(product.icon || "K")}</span>
        <span class="product-code">KR-${String(product.id).padStart(3, "0")}</span>
      </div>
    `;
  }

  function renderSizeChips(sizes = []) {
    return sizes.slice(0, 4).map((size) => `
      <span class="size-chip">${escapeHtml(size)}</span>
    `).join("");
  }

  function renderQuantityControl(product) {
    return `
      <div class="product-quantity" data-product-quantity="${product.id}">
        <span>Qty</span>
        <button type="button" data-quantity-step="-1" aria-label="Decrease quantity">-</button>
        <input type="number" min="1" max="99" value="1" inputmode="numeric" aria-label="Quantity">
        <button type="button" data-quantity-step="1" aria-label="Increase quantity">+</button>
      </div>
    `;
  }

  function render(product, options = {}) {
    const wishlist = Array.isArray(options.wishlist) ? options.wishlist : [];
    const isWishlisted = wishlist.includes(product.id);
    const showWishlist = options.showWishlist !== false;
    const showQuickView = options.showQuickView !== false;
    const showAddCart = options.showAddCart !== false;
    const showDetailLink = options.showDetailLink === true;
    const tag = showDetailLink ? "article" : "div";
    const detailUrl = `/products/${escapeHtml(product.slug)}/`;

    return `
      <${tag} class="product-card" data-id="${product.id}">
        <div class="product-img">
          ${showDetailLink ? `<a class="product-img-link" href="${detailUrl}">` : ""}
          ${renderProductImage(product)}
          <div class="product-img-shade"></div>
          ${product.badge ? `<div class="product-badge badge-${escapeHtml(product.badge)}">${escapeHtml(product.badge.toUpperCase())}</div>` : ""}
          ${showDetailLink ? "</a>" : ""}
          ${showWishlist ? `<button class="product-wishlist ${isWishlisted ? "active" : ""}" data-action="toggle-wishlist" data-id="${product.id}">${isWishlisted ? "♥" : "♡"}</button>` : ""}
          ${showQuickView ? `<button class="quick-view" data-action="open-modal" data-id="${product.id}">QUICK VIEW</button>` : ""}
        </div>
        <div class="product-info">
          <div class="product-meta-row">
            <span class="product-category">${escapeHtml(categoryLabel(product.cat))}</span>
            <span class="product-stock">${escapeHtml(product.stockStatus || "In stock")}</span>
          </div>
          <div class="product-name"><a href="${detailUrl}">${escapeHtml(product.name)}</a></div>
          <div class="product-options">
            <div class="size-chips">${renderSizeChips(product.sizes)}</div>
            ${showAddCart ? renderQuantityControl(product) : ""}
          </div>
          <div class="product-price-row">
            <div>
              <span class="product-price">NPR ${Number(product.price || 0).toLocaleString()}</span>
            </div>
            ${showAddCart ? `<button class="add-cart-btn" data-action="add-cart" data-id="${product.id}" title="Add to cart">🛒</button>` : `<a class="product-detail-link" href="${detailUrl}">View</a>`}
          </div>
        </div>
      </${tag}>
    `;
  }

  window.KrishnaProductCard = {
    render
  };
}());
