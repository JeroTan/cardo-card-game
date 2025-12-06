# 🃏 Cardo Game — Frontend Page Endpoint Specification

This document defines **all Astro page routes (UI pages only)** for the Cardo Online Card Game.  
API endpoints will be documented separately.

---

# 📌 Table of Contents
1. [Public Pages](#public-pages)
2. [Player Pages](#player-pages)
3. [Deck Management Pages](#deck-management-pages)
4. [Card Browser Pages](#card-browser-pages)
5. [Shop Pages](#shop-pages)
6. [Game Pages](#game-pages)
7. [Admin Pages](#admin-pages)

---

# 🌍 Public Pages

## `/` — Landing Page
**Purpose:** Entry point of the game.

**Features**
- “Play” button (CTA)
- Mode options:
  - Quick Game
  - Normal
  - VS Bots
  - Custom
- When “Play” is clicked, UI reveals options without reloading the page
- If user has an ongoing match → show **Continue Game**

---

## `/play` — Game Mode Selector
Shows all play modes:

- **Quick Game** — auto-match with random decks  
- **Normal** — requires login + deck  
- **VS Bots** — play with AI  
- **Custom** — create private rooms

Selecting a mode triggers matchmaking or room creation.

---

# 👤 Player Pages

## `/account`
User profile page.

**Displays**
- Username
- Email
- Linked providers (Google)
- Change password button
- Coin balance
- Recent match activity (optional)
- Recent pack openings (optional)

---

# 🃏 Deck Management Pages

## `/deck`
Shows user’s deck list.

**Features**
- Create new deck
- Delete deck
- Duplicate deck (optional)
- Set deck as **Default**
- Show card count (must be 50)

---

## `/deck/new`
Deck creation page.

**User can**
- Enter deck name  
- Add cards from inventory  
- See remaining slots  
- Validate deck

---

## `/deck/{deck-id}`
Deck editor for a specific deck.

**Features**
- Add/remove cards
- Validate copies (max 5 per type)
- Rename deck
- Delete deck
- Set as default deck
- Show remaining slots

---

# 📚 Card Browser Pages

## `/cards`
Public card library.

**Features**
- Search by name
- Filters:
  - Owned / Not Owned
  - Rarity
  - Faction
  - ATK / DEF
- Owned cards are highlighted
- Not owned cards appear grayed
- If not logged in → show all cards without ownership markers

---

## `/cards/{card-id}`
Card details page.

**Displays**
- Name
- Art
- Rarity
- ATK / DEF
- Description
- Factions

If logged in:
- Show copies owned
- “Add to deck” quick action

---

# 🛒 Shop Pages

## `/shop`
Card pack shop.

**Features**
- List all current packs
- Show:
  - Name
  - Price per card
  - Publish start/end dates
  - Status (PUBLISHED/HIDDEN)
  - Drop rate preview
- User can purchase packs

---

## `/shop/pack-history`
Pack opening history.

**Displays**
- Packs purchased
- Time of purchase
- Cards received (with thumbnails)
- Total coin cost
- (Optional) “Replay animation”

Backed by:
- `account_pack_purchase`
- `pack_opened_card`

---

# 🎮 Game Pages

## `/play/{room-id}`
Game room UI.

**Rules**
- User may refresh or disconnect and return
- If not reconnected within **15s** → auto-loss
- Unauthorized users see an error
- Game state managed by WebSocket + Durable Object

**Features**
- Auto reconnect attempts  
- Spectator mode (optional)
- Turn timer
- Card animations

---

# 🔐 Admin Pages

## `/admin`
Admin dashboard.

**Displays**
- System overview
- Buttons/links to:
  - Card list
  - Card packs
  - Accounts
  - Users

Requires admin authentication.

---

## `/admin/cards`
Admin card list.

**Features**
- Search + filter
- View cards
- Add card
- Edit/delete card

---

## `/admin/cards/{id}`
Admin card editor.

**Admin can**
- Edit name, rarity, stats  
- Change factions  
- Upload card art (R2)
- Delete or hide card

---

## `/admin/cards/add`
Create a new card.

Fields:
- Name
- Rarity
- ATK / DEF
- Description
- Factions
- Upload card art

---

## `/admin/account`
Admin account settings.

**Features**
- View admin email
- Change password
- Link/unlink Google login (optional)

---

## `/admin/users`
User list.

**Admin can**
- Search users
- Filter by status
- Open user detail page

---

## `/admin/users/{id}`
User detail page.

**Admin can**
- View user info
- Add/deduct coins
- Reset password
- Delete user
- View their decks
- View pack purchase history
- Force logout
- Ban (optional)

---

## `/admin/card-packs`
List of card packs for management.

**Features**
- View all packs
- Filter by PUBLISHED/HIDDEN
- Sort by publish date

---

## `/admin/card-packs/{id}`
Edit a card pack.

**Admin can**
- Edit name, status, price
- Edit publish dates
- Manage drop table (cards + drop rates)
- Toggle publish status

---

# ✔️ Summary

This document contains **all frontend page routes** needed for the Cardo Card Game:

- Landing & play options  
- Game rooms  
- Account management  
- Deck building  
- Card browsing  
- Shop & pack history  
- Admin dashboards  
- Scalability + reconnection rules  

This is the final structure for Astro page routing.

