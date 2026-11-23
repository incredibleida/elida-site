// Elida merch — the listing on index.html, grouped by collection.
// A collection is a Wix Stores category with a cover image: its cover tile comes first,
// then the tees in that category. Name, description and cover come from the category in Wix.
import { fetchCategories, searchCatalog } from "/merch/js/wix/catalog.js";
import { wixRequest } from "/merch/js/wix/client.js";
import { esc } from "/merch/assets/site.js";

// The category's manual arrangement (Wix dashboard → Categories → drag to reorder). Empty on failure.
function arrangement(categoryId) {
  return wixRequest("/categories/v1/categories/" + categoryId + "/list-items", {
    method: "POST",
    body: { treeReference: { appNamespace: "@wix/stores", treeKey: null }, useCategoryArrangement: true, cursorPaging: { limit: 100 } }
  }).then(function (r) { return (r.items || []).map(function (i) { return i.catalogItemId; }); }).catch(function () { return []; });
}

var root = document.querySelector("[data-collections]");
var catsEl = document.querySelector("[data-cats]");
var countEl = document.querySelector("[data-count]");

// Prices are hidden until the real cost estimate is in; set to true to show the Wix prices again.
var SHOW_PRICES = false;
var PLUS = '<svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M22 15v14M15 22h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function priceHtml(p) {
  if (p.fromPrice) return "From " + esc(p.price);
  if (p.maxPrice && p.maxPrice !== p.price) return esc(p.price) + " – " + esc(p.maxPrice);
  return (p.compareAtPrice ? "<s>" + esc(p.compareAtPrice) + "</s>" : "") + esc(p.price);
}

function tile(p) {
  var href = "/merch/product.html?slug=" + encodeURIComponent(p.slug);
  var ribbons = (p.ribbons || []).slice();
  if (p.availability === "OUT_OF_STOCK") ribbons.push(p.preorder ? "Pre-order" : "Sold out");
  var meta = ["White", p.optionsSummary, "Unisex"].filter(Boolean).join(" · ");
  return '<a class="card" href="' + href + '">'
    + '<div class="card-photo">'
    + (p.imageUrl ? '<img src="' + esc(p.imageUrl) + '" alt="' + esc(p.name) + ' — white unisex tee" loading="lazy">' : "")
    + (p.hoverImageUrl ? '<img class="hover" src="' + esc(p.hoverImageUrl) + '" alt="" loading="lazy">' : "")
    + (ribbons.length ? '<div class="ribbons">' + ribbons.map(function (r) { return '<span class="ribbon">' + esc(r) + "</span>"; }).join("") + "</div>" : "")
    + '<span class="quick" aria-hidden="true">' + PLUS + "</span></div>"
    + '<div class="card-info"><div class="card-row"><h3 class="card-name">' + esc(p.name) + '</h3>' + (SHOW_PRICES ? '<span class="card-price">' + priceHtml(p) + "</span>" : '<span class="card-price tbc">Price to be confirmed</span>') + "</div>"
    + '<div class="card-meta"><span>' + esc(meta) + "</span></div></div></a>";
}

function cover(c) {
  return '<figure class="campaign cover">'
    + '<img src="' + esc(c.imageUrl) + '" alt="' + esc(c.name) + ' — campaign photo" loading="lazy">'
    + "<figcaption><strong>" + esc(c.name) + "</strong>" + (c.description ? "<span>" + esc(c.description) + "</span>" : "") + "</figcaption></figure>";
}

async function load() {
  root.innerHTML = '<p class="status">Loading the drop…</p>';
  try {
    var cats = (await fetchCategories())
      .filter(function (c) { return c.imageUrl && !c.parentId; })
      .sort(function (a, b) { return a.index - b.index; });
    var lists = await Promise.all(cats.map(function (c) {
      // Products from the catalog, in the order the owner arranged them in the category in Wix.
      return Promise.all([
        searchCatalog({ categoryId: c.id, limit: 100 }).then(function (r) { return r.products || []; }),
        arrangement(c.id)
      ]).then(function (res) {
        var order = res[1];
        var pos = function (p) { var i = order.indexOf(p.id); return i < 0 ? order.length : i; };
        return res[0].slice().sort(function (x, y) { return pos(x) - pos(y); });
      });
    }));
    var total = 0;
    var html = "";
    cats.forEach(function (c, i) {
      var items = lists[i];
      if (!items.length) return;
      total += items.length;
      var id = "collection-" + slugify(c.name);
      html += '<section class="collection" id="' + id + '" aria-labelledby="' + id + '-h">'
        + '<header class="collection-head"><p class="eyebrow" id="' + id + '-h"><span class="num">' + String(i + 1).padStart(2, "0") + "</span>" + esc(c.name) + "</p>"
        + '<p class="count">' + items.length + (items.length === 1 ? " tee" : " tees") + "</p></header>"
        + '<div class="grid">' + cover(c) + items.map(tile).join("") + "</div></section>";
    });
    if (!html) { root.innerHTML = '<p class="status">The next drop is on its way. Check back soon.</p>'; countEl.textContent = ""; catsEl.innerHTML = ""; return; }
    root.innerHTML = html;
    countEl.textContent = total + (total === 1 ? " tee" : " tees");
    catsEl.innerHTML = cats.filter(function (c, i) { return lists[i].length; }).map(function (c) {
      return '<a class="tag" href="#collection-' + slugify(c.name) + '">' + esc(c.name) + "</a>";
    }).join("");
  } catch (e) {
    root.innerHTML = '<p class="status">We could not load the shop right now. <button class="text-btn" type="button" data-retry>Try again</button></p>';
  }
}

root.addEventListener("click", function (e) { if (e.target.closest("[data-retry]")) load(); });
load();