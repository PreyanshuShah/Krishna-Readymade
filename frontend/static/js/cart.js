const CART_API_BASE = "/api/cart/";
const ORDER_WHATSAPP_NUMBER = "9842169807";
const ORDER_INSTAGRAM_URL = "https://ig.me/m/kris_hnareadymade";

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

function getOrderMessage() {
  const data = document.getElementById("orderMessageData");
  return data ? JSON.parse(data.textContent) : "";
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

async function removeCartItem(productId, size) {
  let response;
  try {
    response = await fetch(CART_API_BASE, {
      method: "DELETE",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken()
      },
      body: JSON.stringify({ product_id: productId, size })
    });
  } catch (_error) {
    window.alert("Network problem. Please check your connection and try again.");
    return;
  }

  if (!response.ok) {
    window.alert("Could not remove item. Please try again.");
    return;
  }

  window.location.reload();
}

function openOrderChannel(channel) {
  const message = getOrderMessage();
  if (!message.trim()) {
    window.alert("Your cart is empty. Please add products first.");
    return;
  }

  if (channel === "whatsapp") {
    window.open(`https://wa.me/${ORDER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    return;
  }

  copyTextToClipboard(message).then((copied) => {
    if (copied) {
      window.alert("Order details copied. Paste them in the Instagram message box.");
    } else {
      window.prompt("Copy your order details, then paste them in Instagram:", message);
    }
    window.open(ORDER_INSTAGRAM_URL, "_blank", "noopener,noreferrer");
  });
}

document.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-cart-item]");
  if (removeButton) {
    const line = removeButton.closest(".cart-line");
    if (!line) {
      return;
    }
    removeCartItem(Number(line.dataset.productId), line.dataset.size);
    return;
  }

  const orderButton = event.target.closest("[data-cart-order-channel]");
  if (orderButton) {
    openOrderChannel(orderButton.dataset.cartOrderChannel);
  }
});
