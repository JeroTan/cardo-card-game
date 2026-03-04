# Challenge Mechanics

## How to Attack

Challenging is the heart of CARDO! Here's how it works:

![Challenge Flow](https://placehold.co/600x400/06b6d4/ffffff?text=Challenge+System)

## Step-by-Step Process

### 1. Select Your Attacking Cards
- Choose **1, 2, or 3 cards** from your hand
- You can combo multiple cards together!

### 2. Calculate Total ATK
```
Total_ATK = Card1_ATK + Card2_ATK + Card3_ATK
```

### 3. Calculate Sentinel DEF
```
Sentinel_DEF = SentinelCard1_DEF + SentinelCard2_DEF + ...
```

### 4. Compare Values
- **Success:** `Total_ATK > Sentinel_DEF`
- **Failure:** `Total_ATK ≤ Sentinel_DEF`

## Challenge Success! 🎉

When you win a challenge:

1. **Old Sentinel → Jail** (all cards discarded)
2. **Your attacking cards → New Sentinel** (you become owner)
3. If you attacked with multiple cards, they **fuse** into one Sentinel
4. Your turn ends

## Challenge Failure ❌

If your attack is too weak:

- **This is an illegal move!**
- You **cannot** make this challenge
- The game will prevent invalid attacks
- Choose stronger cards or draw instead

## Example Battle

**Scenario:**
- Sentinel: Cards [7, 3] → DEF = 3 + 7 = **10**
- Your Attack: Cards [6, 5] → ATK = 6 + 5 = **11**

**Result:** ✅ Success! 11 > 10. You capture the Sentinel!
