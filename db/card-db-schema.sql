-- =========================================
-- CARDO GAME — D1-Compatible Schema
-- =========================================

-- ----------------------------
-- CARD
-- ----------------------------
CREATE TABLE card (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT UNIQUE NOT NULL,
  rarity INTEGER NOT NULL,
  atk INTEGER, NOT NULL,
  def INTEGER, NOT NULL,
  description TEXT,
  card_art TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_card_name ON card (name);

-- ----------------------------
-- CARD FACTION
-- ----------------------------
CREATE TABLE card_faction (
  id TEXT PRIMARY KEY NOT NULL,
  card_id TEXT NOT NULL,
  faction TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (card_id) REFERENCES card(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_card_faction_card_id ON card_faction (card_id);
CREATE INDEX idx_card_faction_faction ON card_faction (faction);


-- ----------------------------
-- ACCOUNT
-- ----------------------------
CREATE TABLE account (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  google_id TEXT UNIQUE
);

-- ----------------------------
-- ADMIN ACCOUNT
-- ----------------------------
CREATE TABLE admin_account (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);


-- ----------------------------
-- ACCOUNT COIN LOG
-- ----------------------------
CREATE TABLE account_coin_log (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_coin_log_account_id ON account_coin_log (account_id);
CREATE INDEX idx_coin_log_created_at ON account_coin_log (created_at);


-- ----------------------------
-- CARD PACK
-- ----------------------------
CREATE TABLE card_pack (
  id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL,
  name TEXT NOT NULL,
  price_per_card INTEGER NOT NULL,
  publish_start_date TEXT NOT NULL,
  publish_end_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_pack_status ON card_pack (status);
CREATE INDEX idx_pack_start ON card_pack (publish_start_date);
CREATE INDEX idx_pack_end ON card_pack (publish_end_date);


-- ----------------------------
-- CARD PACK CARDS
-- ----------------------------
CREATE TABLE card_pack_cards (
  id TEXT PRIMARY KEY NOT NULL,
  card_pack_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  drop_rate INTEGER,
  FOREIGN KEY (card_pack_id) REFERENCES card_pack(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (card_id) REFERENCES card(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_pack_cards_pack_id ON card_pack_cards (card_pack_id);


-- ----------------------------
-- ACCOUNT PACK PURCHASE
-- ----------------------------
CREATE TABLE account_pack_purchase (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  card_pack_id TEXT NOT NULL,
  total_cards INTEGER NOT NULL,
  total_cost INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
  FOREIGN KEY (card_pack_id) REFERENCES card_pack(id) ON DELETE CASCADE
);


-- ----------------------------
-- PACK OPENED CARD
-- ----------------------------
CREATE TABLE pack_opened_card (
  id TEXT PRIMARY KEY NOT NULL,
  purchase_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  account_cards_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES account_pack_purchase(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES card(id) ON DELETE CASCADE,
  FOREIGN KEY (account_cards_id) REFERENCES account_cards(id) ON DELETE CASCADE
);


-- ----------------------------
-- ACCOUNT CARDS (OWNED CARDS)
-- ----------------------------
CREATE TABLE account_cards (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (card_id) REFERENCES card(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_account_cards_account_id ON account_cards (account_id);
CREATE INDEX idx_account_cards_card_id ON account_cards (card_id);


-- ----------------------------
-- DECKS
-- ----------------------------
CREATE TABLE deck (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX idx_unique_deck_name ON deck (account_id, name);


-- ----------------------------
-- DECK CARDS
-- ----------------------------
CREATE TABLE deck_cards (
  id TEXT PRIMARY KEY NOT NULL,
  deck_id TEXT NOT NULL,
  account_cards_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (deck_id) REFERENCES deck(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (account_cards_id) REFERENCES account_cards(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_deck_cards_deck_id ON deck_cards (deck_id);
CREATE INDEX idx_deck_cards_account_cards_id ON deck_cards (account_cards_id);
