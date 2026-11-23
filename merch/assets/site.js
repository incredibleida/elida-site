// Elida merch — shared page behaviour: the cart drawer and the mobile menu.
import { subscribeCart, setCartOpen, updateLineQuantity, removeCartLine, goToCheckout } from "/merch/js/wix/cart-store.js";

export function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Mobile menu */
var burger = document.querySelector(".burger");
var menu = document.getElementById("menu");
if (burger && menu) {
  burger.addEventListener("click", function () {
    var open = burger.getAttribute("aria-expanded") !== "true";
    burger.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    document.documentElement.classList.toggle("lock", open);
  });
}

/* Cart */
var backdrop = document.querySelector("[data-cart-backdrop]");
var drawer = backdrop.querySelector(".drawer");
var linesEl = backdrop.querySelector("[data-cart-lines]");
var footEl = backdrop.querySelector("[data-cart-foot]");
var counts = document.querySelectorAll("[data-cart-count]");
var lastFocus = null;
var wasOpen = false;

document.addEventListener("click", function (e) {
  var opener = e.target.closest("[data-cart-open]");
  if (opener) { lastFocus = opener; setCartOpen(true); }
});
backdrop.addEventListener("click", function (e) {
  if (e.target === backdrop || e.target.closest("[data-cart-close]")) { setCartOpen(false); return; }
  var b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.line && b.dataset.qty) updateLineQuantity(b.dataset.line, Number(b.dataset.qty)).catch(function () {});
  else if (b.dataset.remove) removeCartLine(b.dataset.remove).catch(function () {});
  else if ("checkout" in b.dataset) goToCheckout().catch(function () {});
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !backdrop.hidden) setCartOpen(false);
});

subscribeCart(function (s) {
  var n = s.cart ? s.cart.itemCount : 0;
  counts.forEach(function (el) { el.textContent = String(n); });

  backdrop.hidden = !s.open;
  if (s.open !== wasOpen) {
    document.documentElement.classList.toggle("lock", s.open);
    if (s.open) { if (!lastFocus) lastFocus = document.activeElement; drawer.focus(); }
    else if (lastFocus) { lastFocus.focus(); lastFocus = null; }
    wasOpen = s.open;
  }
  drawer.setAttribute("aria-busy", s.busy ? "true" : "false");

  var cart = s.cart;
  var lines = cart ? cart.lines : [];
  var err = s.error ? '<p class="err" role="alert">' + esc(s.error) + "</p>" : "";
  if (!lines.length) {
    linesEl.innerHTML = err + '<p class="empty">Your cart is empty. <a href="/merch/#shop" data-cart-close>Browse the drop</a>.</p>';
    footEl.innerHTML = "";
    footEl.hidden = true;
    return;
  }
  footEl.hidden = false;
  linesEl.innerHTML = err + lines.map(function (l) {
    var max = l.availableQuantity == null ? Infinity : l.availableQuantity;
    return '<div class="line">'
      + '<div class="line-img">' + (l.imageUrl ? '<img src="' + esc(l.imageUrl) + '" alt="">' : "") + "</div>"
      + "<div><h3>" + esc(l.productName) + "</h3>"
      + (l.descriptionLines.length ? '<p class="opts">' + l.descriptionLines.map(esc).join(" · ") + "</p>" : "")
      + (l.subscription ? '<p class="opts">' + esc(l.subscription) + "</p>" : "")
      + (l.status !== "IN_STOCK" ? '<p class="err">' + (l.status === "PARTIALLY_IN_STOCK" ? "Only part of this quantity is in stock." : "No longer available.") + "</p>" : "")
      + '<div class="stepper"><button type="button" aria-label="One less" data-line="' + esc(l.lineItemId) + '" data-qty="' + (l.quantity - 1) + '"' + (l.quantity <= 1 || s.busy ? " disabled" : "") + ">−</button>"
      + "<span>" + l.quantity + "</span>"
      + '<button type="button" aria-label="One more" data-line="' + esc(l.lineItemId) + '" data-qty="' + (l.quantity + 1) + '"' + (l.quantity >= max || s.busy ? " disabled" : "") + ">+</button></div></div>"
      + '<div class="line-end"><span>' + (l.compareAtLinePrice ? "<s>" + esc(l.compareAtLinePrice) + "</s> " : "") + esc(l.linePrice) + "</span>"
      + '<button class="remove" type="button" data-remove="' + esc(l.lineItemId) + '"' + (s.busy ? " disabled" : "") + ">Remove</button></div>"
      + "</div>";
  }).join("");

  var rows = '<div class="sum"><span>Subtotal</span><span>' + esc(cart.subtotal) + "</span></div>";
  (cart.discounts || []).forEach(function (d) { rows += '<div class="sum"><span>' + esc(d.name) + "</span><span>−" + esc(d.amount) + "</span></div>"; });
  (cart.fees || []).forEach(function (f) { rows += '<div class="sum"><span>' + esc(f.name) + "</span><span>" + esc(f.amount) + "</span></div>"; });
  if (cart.taxes && cart.taxes.length) cart.taxes.forEach(function (t) { rows += '<div class="sum"><span>' + esc(t.name) + "</span><span>" + esc(t.amount) + "</span></div>"; });
  rows += '<div class="sum"><span>Shipping' + (cart.taxes && cart.taxes.length || cart.pricesIncludeTax ? "" : " and taxes") + "</span><span>At checkout</span></div>";
  if (cart.total) rows += '<div class="sum total"><span>Total</span><span>' + esc(cart.total) + "</span></div>";
  rows += '<button class="pill fill" type="button" data-checkout' + (s.busy ? " disabled" : "") + ">Go to checkout</button>";
  footEl.innerHTML = rows;
});