# 🎨 Cardo Game UI Architecture  
### Using **shadcn/ui** for General UI & **Pixi.js** for Gameplay Rendering

This document explains the UI technologies chosen for the Cardo Online Card Game and how they work together in a hybrid frontend architecture. The goal is to provide a clean, maintainable, and high-performance user interface across both the static pages and the animated gameplay arena.

---

# 📌 Overview

Cardo uses **two primary frontend UI systems**:

### ⭐ **1. shadcn/ui** (for general user interface)
A modern component library built on top of Radix UI + Tailwind CSS.  
Used for all standard web UI, forms, pages, dashboards, lists, dialogs, and interactions outside of the gameplay battlefield.

### ⭐ **2. Pixi.js** (for gameplay rendering)
A WebGL-accelerated 2D rendering engine used to create smooth, high-performance gameplay animations for cards, attacks, transitions, and game states.  
Ideal for rendering a dynamic battlefield similar to digital card games like Hearthstone, Runeterra, or Shadowverse.

Both systems coexist cleanly and serve different responsibilities.

---

# 🧩 Why We Use Two Systems

The game requires two types of interfaces:

### ✔ Standard UI pages  
- Account & authentication pages  
- Deck builder  
- Card browser  
- Shop & pack history  
- Admin dashboard  
- Settings  

These are **form-heavy and static** → best served by **shadcn/ui**.

### ✔ Real-time battle rendering  
- Card movements  
- Animations  
- Sentinel transitions  
- Attack effects  
- Turn flow indicators  

These require **GPU acceleration and a proper game loop** → best served by **Pixi.js**.

Using one tool for both creates compromises.  
Splitting responsibilities creates the best experience and keeps development clean.

---

# 🎨 1. shadcn/ui (General UI Layer)

shadcn/ui is used for all non-gameplay interfaces:

## Pages Using shadcn/ui
- `/` — Landing page  
- `/play` — Mode selector  
- `/account` — User account  
- `/deck`, `/deck/{id}`, `/deck/new` — Deck management  
- `/cards`, `/cards/{id}` — Card library  
- `/shop`, `/shop/pack-history` — Store pages  
- All `/admin/*` pages — Admin dashboard  

## Components Commonly Used
- Buttons  
- Inputs, Forms, Selects  
- Dialogs & Drawers  
- Tabs & Accordions  
- Cards (UI panels, not game cards)  
- Data tables  
- Toast notifications  
- Navigation menus  

## Benefits
- Fast development with reusable components  
- Beautiful consistent styling via Tailwind  
- Accessible components out-of-the-box  
- Zero WebGL or heavy JS overhead  
- Easy integration in Astro + React islands  

---

# 🕹️ 2. Pixi.js (Gameplay Rendering Layer)

Pixi.js is used exclusively on the gameplay screen:

### `/play/{room-id}`

This page loads a Pixi canvas to render the active match.

## Responsibilities of Pixi.js
- Render card sprites  
- Animate card movements (appear, slide, bounce, etc.)  
- Display the active sentinel  
- Visualize attacks and fusions  
- Display turn transitions  
- Draw effects and particle systems  
- Handle 60 FPS animations via WebGL  
- Maintain its own rendering loop separate from React  

## Why Pixi.js Instead of React for Gameplay?
React re-renders UI elements → **not suitable for 60 FPS animations**.  
Pixi.js uses **WebGL**, which is ideal for:

- Smooth gameplay  
- Real-time interactions  
- Card animations  
- Complex visual effects  
- Low performance overhead  

Pixi remains **isolated** within a single React component container — preventing performance conflicts.

---

# 🧱 How They Work Together

### ✔ shadcn/ui handles:
- Layout  
- Navigation  
- Buttons, forms, dialogs  
- All menus outside the match  
- Player and admin dashboards  

### ✔ Pixi.js handles:
- In-match visuals  
- The game board  
- Game animations  
- Sprite rendering  
- Turn flow  

### ✔ Astro + React provide:
- Routing  
- Page hydration  
- State hooks  
- Mount point for Pixi canvas  

### Integration Pattern
The gameplay page is structured as:

```tsx
<div class="game-area">
  <PixiGameBoard />  // This React component mounts Pixi
</div>
