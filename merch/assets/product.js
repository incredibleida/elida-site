// Elida merch — one product on product.html?slug=…, driven by the Wix product detail store.
import { createProductDetailStore } from "/merch/js/wix/product-detail-store.js";
import { createFormStore, FORM_ERROR } from "/merch/js/wix/form-store.js";
import { esc } from "/merch/assets/site.js";

// Pre-launch: the product button registers interest through the "Merch interest" Wix form
// instead of adding to the cart. Set INTEREST_MODE to false to sell through the cart again.
var INTEREST_MODE = true;
// Prices are hidden until the real cost estimate is in; set to true to show the Wix prices again.
var SHOW_PRICES = false;
var FORM_ID = "b3cb34bd-5de6-4c49-bda9-4d2c714ce564";

var root = document.querySelector("[data-pdp]");
var slug = new URLSearchParams(location.search).get("slug") || "";
var store = createProductDetailStore({ slug: slug });
var activeImage = null;
var titled = false;
var interestOpen = false;
var sentFor = null;
var nudge = false;

var form = createFormStore({ formId: FORM_ID });
var interestEl = document.createElement("form");
interestEl.className = "interest";
interestEl.noValidate = true;
interestEl.innerHTML = '<p class="eyebrow">Register your interest</p>'
  + '<p class="pick" data-pick></p>'
  + '<label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label>'
  + '<label class="field"><span>First name <em>(optional)</em></span><input type="text" name="first" autocomplete="given-name"></label>'
  + '<label class="check"><input type="checkbox" name="optin"> Email me about future Elida merch drops</label>'
  + '<p class="err" data-ferr role="alert"></p>'
  + '<button class="pill fill add" type="submit" data-send>Send</button>'
  + '<p class="note">No payment now. We only email you about this tee, and future drops if you tick the box.</p>';
var pickEl = interestEl.querySelector("[data-pick]");
var ferrEl = interestEl.querySelector("[data-ferr]");
var sendBtn = interestEl.querySelector("[data-send]");

function target(label) {
  var f = form.getState().form;
  var hit = f ? f.fields.filter(function (x) { return x.label === label; })[0] : null;
  return hit ? hit.target : null;
}
function picks(s) {
  var out = {};
  s.optionGroups.forEach(function (g) { var c = g.choices.filter(function (x) { return x.selected; })[0]; out[g.name] = c ? c.name : ""; });
  return out;
}
function pickText(s) {
  var p = picks(s);
  return [p.Color || p.Colour || "White", p.Size].filter(Boolean).join(" · ") + (s.quantity > 1 ? " · " + s.quantity + " pcs" : "");
}
form.subscribe(function (fs) {
  var msg = fs.errors[FORM_ERROR] || "";
  if (!msg) for (var k in fs.errors) { if (fs.errors[k]) { msg = fs.errors[k]; break; } }
  ferrEl.textContent = msg;
  sendBtn.disabled = fs.loading || !fs.form;
  sendBtn.textContent = fs.loading ? "Sending…" : "Send";
});
form.start();
interestEl.addEventListener("submit", function (e) {
  e.preventDefault();
  var s = store.getState();
  if (!s.product || !s.canAdd) { ferrEl.textContent = s.blockedReason || "Choose a colour and size first."; return; }
  var p = picks(s);
  var vals = {};
  vals[target("Email")] = interestEl.email.value.trim();
  vals[target("First name")] = interestEl.first.value.trim();
  vals[target("Product")] = s.product.name;
  vals[target("Colour")] = p.Color || p.Colour || "White";
  vals[target("Size")] = p.Size || "";
  vals[target("Quantity")] = s.quantity;
  vals[target("Email me about future Elida merch drops")] = interestEl.optin.checked;
  delete vals["null"];
  form.setValues(function (prev) { return Object.assign({}, prev, vals); });
  form.submit().then(function (out) {
    if (!out) return;
    sentFor = s.product.name + (pickText(s) ? " (" + pickText(s) + ")" : "");
    interestOpen = false;
    render(store.getState());
  }).catch(function () {});
});

function setMeta(p) {
  var text = (p.descriptionHtml || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  var desc = (text.split(/(?<=\.)\s/)[0] || ("A unisex printed tee from Elida.")).slice(0, 160);
  document.title = p.name + " — Elida merch";
  [["name", "description"], ["property", "og:description"]].forEach(function (a) {
    var m = document.querySelector("meta[" + a[0] + '="' + a[1] + '"]'); if (m) m.setAttribute("content", desc);
  });
  var t = document.querySelector('meta[property="og:title"]'); if (t) t.setAttribute("content", p.name + " — Elida");
  if (p.imageUrl) { var og = document.createElement("meta"); og.setAttribute("property", "og:image"); og.setAttribute("content", p.imageUrl); document.head.appendChild(og); }
}

root.addEventListener("click", function (e) {
  var b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.option) { activeImage = null; store.selectOption(b.dataset.option, b.dataset.choice); }
  else if (b.dataset.step) store.setQuantity(store.getState().quantity + Number(b.dataset.step));
  else if ("add" in b.dataset) store.add().catch(function () {});
  else if ("interest" in b.dataset) { if (!store.getState().canAdd) { nudge = true; render(store.getState()); return; } nudge = false; interestOpen = true; sentFor = null; render(store.getState()); interestEl.email.focus(); }
  else if ("again" in b.dataset) { form.reset(); interestEl.reset(); sentFor = null; interestOpen = true; render(store.getState()); interestEl.email.focus(); }
  else if (b.dataset.image) { activeImage = b.dataset.image; render(store.getState()); }
  else if (b.dataset.mod) store.setModifier(b.dataset.mod, b.dataset.val);
});
root.addEventListener("input", function (e) {
  if (e.target.dataset.modText) store.setModifier(e.target.dataset.modText, e.target.value);
});
root.addEventListener("submit", function (e) {
  if (!e.target.matches || !e.target.matches("[data-notify]")) return;
  e.preventDefault();
  store.notify(e.target.email.value).catch(function () {});
});

function selectedName(g) {
  var c = g.choices.filter(function (x) { return x.selected; })[0];
  return c ? c.name : "";
}

function render(s) {
  if (!s.product) {
    root.innerHTML = s.notFound
      ? '<div class="buy"><p class="crumbs"><a href="/merch/">Merch</a></p><h1 class="pdp-name">This item is not available.</h1><p><a class="pill" href="/merch/">Back to the drop</a></p></div>'
      : '<div class="gallery"><div class="main"></div></div><div class="buy"><p class="crumbs"><a href="/merch/">Merch</a></p><p class="note">Loading…</p></div>';
    return;
  }
  var p = s.product;
  if (!titled) { setMeta(p); titled = true; }

  // gallery
  var gallery = p.gallery || [];
  var main = activeImage || s.imageUrl || gallery[0] || "";
  var g = '<div class="gallery"><div class="main">' + (main ? '<img src="' + esc(main) + '" alt="' + esc(p.name) + '">' : "") + "</div>";
  if (gallery.length > 1) g += '<div class="thumbs">' + gallery.map(function (u, i) {
    return '<button type="button" data-image="' + esc(u) + '" aria-label="Image ' + (i + 1) + '" aria-pressed="' + (u === main) + '"><img src="' + esc(u) + '" alt=""></button>';
  }).join("") + "</div>";
  g += "</div>";

  // buy box
  var h = '<div class="buy"><p class="crumbs"><a href="/merch/">Merch</a> / ' + esc(p.name) + "</p>";
  if ((p.ribbons || []).length) h += '<div class="chips">' + p.ribbons.map(function (r) { return '<span class="ribbon" style="border:1px solid var(--ink)">' + esc(r) + "</span>"; }).join("") + "</div>";
  h += '<h1 class="pdp-name">' + esc(p.name) + "</h1>";
  if (!SHOW_PRICES) h += '<div class="pdp-price tbc">Price to be confirmed</div>';
  else h += '<div class="pdp-price">' + (s.compareAtPrice ? "<s>" + esc(s.compareAtPrice) + "</s>" : "") + esc(s.price) + (s.pricePerUnit ? ' <span class="note">' + esc(s.pricePerUnit) + "</span>" : "") + "</div>";

  s.optionGroups.forEach(function (grp) {
    h += '<fieldset class="opt"><legend>' + esc(grp.name) + (selectedName(grp) ? "<span>" + esc(selectedName(grp)) + "</span>" : "") + '</legend><div class="chips">';
    grp.choices.forEach(function (c) {
      var off = !c.inStock || !c.exists;
      if (grp.isColor && c.colorCode) {
        h += '<button class="swatch" type="button" style="background:' + esc(c.colorCode) + '" data-option="' + esc(grp.id) + '" data-choice="' + esc(c.choiceId) + '" aria-pressed="' + c.selected + '" aria-label="' + esc(c.name) + (off ? " (unavailable)" : "") + '" title="' + esc(c.name) + '"' + (off ? " disabled" : "") + "></button>";
      } else {
        h += '<button class="tag" type="button" data-option="' + esc(grp.id) + '" data-choice="' + esc(c.choiceId) + '" aria-pressed="' + c.selected + '"' + (off ? " disabled" : "") + ">" + esc(c.name) + "</button>";
      }
    });
    h += "</div></fieldset>";
  });

  (p.modifiers || []).forEach(function (m) {
    h += '<fieldset class="opt"><legend>' + esc(m.name) + "</legend>";
    if (m.type === "text") h += '<input class="tag" style="padding:10px 16px;width:100%" type="text" data-mod-text="' + esc(m.key) + '"' + (m.maxChars ? ' maxlength="' + m.maxChars + '"' : "") + ' value="' + esc(s.modifierValues[m.key] || "") + '">';
    else h += '<div class="chips">' + (m.choices || []).map(function (c) { return '<button class="tag" type="button" data-mod="' + esc(m.key) + '" data-val="' + esc(c.key) + '" aria-pressed="' + (s.modifierValues[m.key] === c.key) + '">' + esc(c.name) + "</button>"; }).join("") + "</div>";
    h += "</fieldset>";
  });

  var stepper = '<div class="stepper"><button type="button" data-step="-1" aria-label="One less"' + (s.quantity <= 1 ? " disabled" : "") + ">−</button><span>" + s.quantity + '</span><button type="button" data-step="1" aria-label="One more"' + (s.quantity >= s.maxQuantity ? " disabled" : "") + ">+</button></div>";
  if (INTEREST_MODE) {
    if (sentFor) {
      h += '<div class="interest done" role="status"><p class="eyebrow">You’re on the list</p><p>Thanks for registering your interest in the ' + esc(sentFor) + '. We’ll email you when it can be ordered.</p><button class="text-btn" type="button" data-again>Register another colour or size</button></div>';
    } else {
      if (!interestOpen) h += '<div class="qty-row">' + stepper + '<button class="pill fill add" type="button" data-interest>Register interest</button></div>';
      else h += '<div class="qty-row">' + stepper + "</div>";
      if (s.blockedReason && !s.canAdd) h += (nudge ? '<p class="err" role="alert">' + esc(s.blockedReason) + ' first, then press Register interest.</p>' : '<p class="note">' + esc(s.blockedReason) + "</p>");
      else if (!interestOpen) h += '<p class="note">Pre-launch: no payment now. We print based on the interest we get.</p>';
      if (interestOpen) h += "<div data-interest-slot></div>";
    }
  } else {
    h += '<div class="qty-row">' + stepper
      + '<button class="pill fill add" type="button" data-add' + (s.canAdd && !s.adding ? "" : " disabled") + ">" + (s.adding ? "Adding…" : s.isPreorder ? "Pre-order" : "Add to cart") + "</button></div>";
    if (s.blockedReason && !s.canAdd) h += '<p class="note">' + esc(s.blockedReason) + "</p>";
  }
  if (s.isPreorder && s.preorderMessage) h += '<p class="note">' + esc(s.preorderMessage) + "</p>";
  if (s.remaining != null && s.remaining > 0 && s.remaining <= 5) h += '<p class="note">Only ' + s.remaining + " left.</p>";
  if (s.error) h += '<p class="err" role="alert">' + esc(s.error) + "</p>";
  if (s.canNotify && !INTEREST_MODE) {
    h += s.notifyResult
      ? '<p class="note">' + (s.notifyResult === "created" ? "We’ll email you when it’s back." : "You’re already on the list.") + "</p>"
      : '<form data-notify class="qty-row"><input class="tag" style="padding:12px 16px;flex:1" type="email" name="email" required placeholder="Email me when it’s back"><button class="pill" type="submit"' + (s.notifying ? " disabled" : "") + ">Notify me</button></form>"
        + (s.notifyError ? '<p class="err">' + esc(s.notifyError) + "</p>" : "");
  }
  if (p.descriptionHtml) h += '<div class="desc">' + p.descriptionHtml + "</div>";
  if ((p.infoSections || []).length) h += '<div class="acc">' + p.infoSections.map(function (sec) { return "<details><summary>" + esc(sec.title) + '</summary><div class="body">' + sec.html + "</div></details>"; }).join("") + "</div>";
  h += "</div>";

  root.innerHTML = g + h;
  var slot = root.querySelector("[data-interest-slot]");
  if (slot) {
    pickEl.textContent = s.product.name + (pickText(s) ? " · " + pickText(s) : "");
    slot.replaceWith(interestEl);
  }
}

store.subscribe(render);
render(store.getState());
store.start();