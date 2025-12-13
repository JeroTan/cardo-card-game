-- =========================================
-- CARDO GAME — D1-Compatible Schema (Final)
-- =========================================

-- ----------------------------
-- CARD
-- ----------------------------
CREATE TABLE card (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT UNIQUE NOT NULL,
  atk INTEGER NOT NULL,
  def INTEGER NOT NULL,
  card_art TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_card_name ON card (name);


-- ----------------------------
-- USER ACCOUNT
-- ----------------------------
CREATE TABLE user_account (
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
  FOREIGN KEY (account_id) REFERENCES user_account(id) ON DELETE CASCADE ON UPDATE CASCADE
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
  pack_price INTEGER NOT NULL,
  publish_start_date TEXT NOT NULL,
  publish_end_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_pack_status ON card_pack (status);
CREATE INDEX idx_pack_start ON card_pack (publish_start_date);
CREATE INDEX idx_pack_end ON card_pack (publish_end_date);


-- ----------------------------
-- CARD PACK → CARD (PACK CONTENTS)
-- ----------------------------
CREATE TABLE card_pack_cards (
  id TEXT PRIMARY KEY NOT NULL,
  card_pack_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  FOREIGN KEY (card_pack_id) REFERENCES card_pack(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (card_id)   REFERENCES card(id)      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_pack_cards_pack_id ON card_pack_cards (card_pack_id);


-- ----------------------------
-- PACK PURCHASE HISTORY
-- ----------------------------
CREATE TABLE account_pack_purchase (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  card_pack_id TEXT NOT NULL,
  total_price INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (account_id)  REFERENCES user_account(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (card_pack_id) REFERENCES card_pack(id)   ON DELETE CASCADE ON UPDATE CASCADE
);


-- ----------------------------
-- OWNED PACKS (THE USER OWNS WHOLE PACKS)
-- ----------------------------
CREATE TABLE account_packs (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  card_packs_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (account_id)    REFERENCES user_account(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (card_packs_id) REFERENCES card_pack(id)    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_account_packs_account_id ON account_packs (account_id);
CREATE INDEX idx_account_packs_pack_id ON account_packs (card_packs_id);
