# Elida merch shop

Lives at https://helloelida.com/merch/. Products, collections, forms and checkout come from the Wix site "Elida Shop" (Wix Headless, free plan). The pages here only display them.

- `index.html`: the shop (collections and tees)
- `product.html?slug=…`: a product page with the "Register interest" form
- `coming-soon.html`: the password page
- `assets/`: styles and page scripts
- `js/wix/`: Wix connection modules. Leave these as they are.

## Editing content
Edit tees, prices, descriptions and collections in the Wix dashboard:
https://manage.wix.com/dashboard/ed87eecb-3651-45ab-8380-aca2f92f2c53

Your changes show up here automatically, with no upload needed.

## Password page (pre-launch)
- The password is shared privately; keep it out of this public repo. It's not case sensitive, and a browser stays unlocked once the password is entered.
- To change the password, put the SHA-256 of the new password (in lowercase) in `assets/gate.js` (`HASH`) and in the first `<script>` line of `index.html` and `product.html`.
- To go live, delete the two lines marked "Pre-launch" at the top of `index.html` and `product.html`.

## Switching from interest to selling
- Set `INTEREST_MODE = false` in `assets/product.js`.
- Remove the "Pre-launch" block in `assets/shop.css`.
- Set `SHOW_PRICES = true` in `assets/shop.js` and `assets/product.js`.
- In Wix, upgrade to a plan that takes payments, and set up shipping and tax.
