# RAIL

A clothing-rail storefront: garments hang from a curved cable that drifts, can be dragged or scrolled, and swing like pendulums. Click a garment for a product view (front/back, sizes, add to cart) and a slide-in cart drawer.

Plain HTML, CSS and JavaScript with [GSAP](https://gsap.com) for the motion. No build step.

```sh
python3 -m http.server 8080   # then open http://localhost:8080
```

- Garments are drawn as inline SVG (`garments.js`), so there are no image assets and no third-party photos.
- The cart is stored in `localStorage`. Checkout is a placeholder and is not connected to anything.
- GSAP 3.12.5 is vendored in `vendor/` (see its license header).
