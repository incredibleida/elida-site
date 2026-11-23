/* Elida merch — preview gate (client-side). Change the password by replacing HASH with sha256("new password"). */
(function () {
  var HASH = "9ebb1e6f5b2adf424b662ab2b7b0189dfe8d4b69fd9e96c50b5a5936c1c0bcb2";
  var KEY = "elida-merch-access";
  var form = document.querySelector("[data-gate]");
  var input = document.getElementById("gate-pw");
  var note = document.querySelector("[data-gate-note]");

  function nextUrl() {
    var n = new URLSearchParams(location.search).get("next") || "/merch/";
    return n.charAt(0) === "/" && n.charAt(1) !== "/" ? n : "/merch/";
  }
  function sha256(text) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    });
  }
  try { if (localStorage.getItem(KEY) === HASH) { location.replace(nextUrl()); return; } } catch (e) {}

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var value = input.value.trim().toLowerCase();
    if (!value) { input.focus(); return; }
    sha256(value).then(function (h) {
      if (h === HASH) {
        try { localStorage.setItem(KEY, HASH); } catch (err) {}
        note.textContent = "Welcome in…";
        location.replace(nextUrl());
      } else {
        form.classList.remove("wrong"); void form.offsetWidth; form.classList.add("wrong");
        note.textContent = "Check the password and try again.";
        input.select();
      }
    });
  });
})();