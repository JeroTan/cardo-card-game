# Version 1 Rule Book

# 🎴 **CARDO — OFFICIAL GAME RULEBOOK (v1.3)**

_Sentinel-Only Edition (No Spells, No Chains)_

_Supports 2–10 Players_

---

# 🟥 **1. Overview**

Cardo is a **shared-sentinel, elimination-based** card game where players take turns challenging the active **Sentinel**, a group of 1–3 cards on the field.

Players use their cards’ **ATK** values to overpower the Sentinel’s **DEF**.

If they succeed, their attacking cards become the **new Sentinel**, fusing into a stronger group.

Players who cannot challenge _and_ cannot draw cards are eliminated.

Last player standing wins.

---

# 🟧 **2. Card Types (V1 – Sentinel Only)**

All cards in this version are **Sentinel Cards** with:

- ATK
- DEF
- Rarity (cosmetic)
- Faction (cosmetic)
- Name
- Art

### **2.1 ATK/DEF Table**

Cardo uses a fixed stat pairing:

| ATK | DEF |
| --- | --- |
| 0   | 0   |
| 1   | 9   |
| 2   | 8   |
| 3   | 7   |
| 4   | 6   |
| 5   | 5   |
| 6   | 4   |
| 7   | 3   |
| 8   | 2   |
| 9   | 1   |

A deck can contain:

- Total: **50 cards**
- Each card value (0–9) has a fixed 5 cards in the deck

---

# 🟨 **3. Zones**

Each player has:

### **Personal Zones**

- **Hand** (max 9 cards)
- **Deck** (exactly 50 cards)
- **Jail** (discard pile, face-up)

### **Shared Zone**

- **Sentinel Zone** (holds 1–3 cards)

---

# 🟩 **4. Game Setup**

1. Each player shuffles their deck.
2. Each player draws **5 cards**.
3. Randomly determine first player.
4. First player **must** place the first Sentinel (cannot pass).

---

# 🟦 **5. Turn Structure**

Each player's turn follows one of two paths:

---

## 🟦 **A. If YOU ARE the Sentinel Owner**

You may:

### **Option 1 — Skip Turn**

Do nothing.

---

### **Option 3 — Surrender**

You may end the game quickly by

---

## 🟦 **B. If YOU ARE NOT the Sentinel Owner**

You must choose **one**:

### **Option 1 — Challenge the Sentinel**

Attempt to overpower the current Sentinel using **1–3 cards** from your hand.

(See Section 6)

---

### **Option 2 — Draw Cards (1–3)**

Rules:

- You must declare drawing **1, 2, or 3 cards**
- If drawing exceeds 7 cards, discard down to 7
- If you draw, you **CANNOT** challenge afterward
- If you cannot draw (deck empty), this is not allowed

---

### **Option 3 — Surrender**

You immediately lose the game.

---

# 🟪 **6. Challenge & Fusion Resolution**

A **Challenge** is an attempt to replace the Sentinel.

You attack using **1–3 cards** from your hand.

### **6.1 Calculate Total ATK**

```
Total_ATK = ATK1 + ATK2 + ATK3

```

### **6.2 Compare with Sentinel DEF**

Sentinel DEF is the **sum of all DEF values** in the current Sentinel group.

### ✔ SUCCESS (Total_ATK > Sentinel_DEF)

Follow these steps:

---

## ✔ Step 1 — Old Sentinel Goes to Jail

Move all Sentinel cards to the **previous owner’s Jail**.

---

## ✔ Step 2 — New Sentinel Forms (Fusion Sentinel)

The attacking cards stay on the field and become the **new Sentinel**.

### **The new Sentinel can contain:**

- 1 card
- 2 cards
- or 3 cards

These cards **fuse**.

---

## ✔ Step 3 — Fusion DEF Calculation

```
New_Sentinel.DEF = DEF1 + DEF2 + DEF3

```

The Sentinel now has **combined defense**, making it stronger.

---

## ✔ Step 4 — Sentinel Ownership Passes

The attacking player becomes the **new Sentinel Owner**.

---

### ❌ FAILURE (Total_ATK ≤ Sentinel_DEF)

This move is illegal.

You cannot attempt the challenge.

---

# 🟫 **7. Zero Card Rules**

The **0/0 card** is special:

### ✔ Zero can defeat ANY Sentinel

Even a fusion Sentinel with 20+ DEF.

### ✔ Zero can be used alone or as part of a 2–3 card attack.

However, if in group, the the total attack must be zero or else its ability to replace any cards in sentinel field will be invalidate.

### ❌ Zero CANNOT defeat a Zero Sentinel

If the Sentinel group contains **only zero cards**,

a Zero attack does **not** overpower it.

---

# 🟧 **8. Hand Rules**

- Maximum hand size: **9**
- If drawing causes > 9 cards, discard down to 9
- You cannot draw if deck has fewer cards than requested
- You cannot attempt to challenge first then draw afterward

---

# 🟦 **9. Deck Rules**

- Exactly **50 cards**
- Maximum **5 copies** of each ATK/DEF pair (0–9)
- Deck is **shuffled** at match start
- Deck cannot be reordered mid-game

---

# 🟥 **10. Eliminations**

A player is eliminated when:

### ❌ They cannot challenge the Sentinel

**AND**

### ❌ They cannot draw cards (deck empty)

They are immediately removed from the turn order.

---

# 🟩 **11. Winning**

The **last surviving player** wins the match.

If playing 1v1:

- Win when opponent fails their turn.

If more than 2 players:

- Continue until only one player remains.

---

# 🟦 **12. Summary of Sentinel Fusion**

When a player successfully challenges:

| Step | Result                                |
| ---- | ------------------------------------- |
| 1    | Old Sentinel → Jail                   |
| 2    | Attacking cards → new Sentinel group  |
| 3    | New DEF = sum of all DEF of attackers |
| 4    | Attacker becomes Sentinel owner       |

---

# 🟪 **13. Strategy Notes**

- Fusing 3 cards creates very high DEF, but costs many resources.
- Zero cards are god-tier but limited to 5 per deck.
- Overcommitting could make you vulnerable next turn.
- Drawing 3 cards risks hand overflow but gives more options.
- Sentinel owner can skip to save cards for later.

---

# 🟨 **14. Glossary**

- **Sentinel** — The active defending group on the field.
- **Fusion Sentinel** — Sentinel made from multiple attacking cards.
- **Jail** — Player’s discard pile.
- **Challenge** — Attempt to overpower the Sentinel.
- **Sentinel Owner** — The player whose cards currently form the Sentinel.
- **Zero Card** — Special 0/0 card that beats all but is immune to itself.
