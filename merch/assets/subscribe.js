// Elida merch — "Subscribe" in The prints section: an email list for the screen-printed editions,
// stored as submissions of the "Screenprint updates" Wix form (each email also becomes a contact).
import { createFormStore, FORM_ERROR } from "/merch/js/wix/form-store.js";

var FORM_ID = "34541f23-60d9-4d59-bd55-6aaecb683db6";
var el = document.querySelector("[data-subscribe]");
if (el) {
  var msg = el.querySelector("[data-sub-msg]");
  var btn = el.querySelector("button");
  var form = createFormStore({ formId: FORM_ID });
  var target = function () {
    var f = form.getState().form;
    var hit = f ? f.fields.filter(function (x) { return x.identifier === "CONTACTS_EMAIL" || x.label === "Email"; })[0] : null;
    return hit ? hit.target : null;
  };
  form.subscribe(function (s) {
    var err = s.errors[FORM_ERROR] || "";
    if (!err) for (var k in s.errors) { if (s.errors[k]) { err = s.errors[k]; break; } }
    if (err) { msg.textContent = err; msg.className = "err"; }
    btn.disabled = s.loading || !s.form;
    btn.textContent = s.loading ? "Sending…" : "Subscribe";
  });
  form.start();
  el.addEventListener("submit", function (e) {
    e.preventDefault();
    var t = target();
    if (!t) return;
    form.setValue(t, el.email.value.trim());
    form.submit().then(function (out) {
      if (!out) return;
      el.innerHTML = '<p class="note sub-done" role="status">Thanks, you’re on the list. We’ll email you when the screen prints are in stock.</p>';
    }).catch(function () {});
  });
}