import { describe, it, expect } from "vitest";
import { validateGameEvent } from "@/features/game/utils/room";
import type { RoomState, TurnEvent } from "@/types/game/events";

describe("validateGameEvent", () => {
  const createMockRoomState = (events: TurnEvent[] = []): RoomState => ({
    roomId: "TEST123",
    playerInfo: {
      players: [
        {
          id: "player1",
          username: "Player 1",
          cardsInDeck: Array(50).fill({ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }),
          jailedCards: [],
          turnLeft: 0,
          timeLeft: new Date(Date.now() + 60000).toISOString(),
        },
        {
          id: "player2",
          username: "Player 2",
          cardsInDeck: Array(50).fill({ id: "2", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }),
          jailedCards: [],
          turnLeft: 0,
          timeLeft: new Date(Date.now() + 60000).toISOString(),
        },
      ],
    },
    events,
    createdAt: new Date().toISOString(),
    status: "waiting",
  });

  describe("Rule 1: First event must be PLAYER_JOIN", () => {
    it("should accept PLAYER_JOIN as first event", () => {
      const roomState = createMockRoomState([]);
      const event: TurnEvent = { type: "PLAYER_JOIN", playerId: "player1" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject GAME_START as first event", () => {
      const roomState = createMockRoomState([]);
      const event: TurnEvent = { type: "GAME_START" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("First event must be PLAYER_JOIN");
    });
  });

  describe("Rule 2: GAME_START should only appear once", () => {
    it("should accept GAME_START after PLAYER_JOIN", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "PLAYER_JOIN", playerId: "player2" },
      ]);
      const event: TurnEvent = { type: "GAME_START" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject second GAME_START", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "PLAYER_JOIN", playerId: "player2" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = { type: "GAME_START" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("GAME_START can only appear once");
    });
  });

  describe("Rule 3: GAME_END should only appear once", () => {
    it("should accept GAME_END", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = { type: "GAME_END" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject second GAME_END", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
        { type: "GAME_END" },
      ]);
      const event: TurnEvent = { type: "GAME_END" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("GAME_END can only appear once");
    });
  });

  describe("Rule 4: PLAYER_LOSE and PLAYER_WIN only once per player", () => {
    it("should accept PLAYER_LOSE for a player", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = { type: "PLAYER_LOSE", playerId: "player1" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject second PLAYER_LOSE for same player", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
        { type: "PLAYER_LOSE", playerId: "player1" },
      ]);
      const event: TurnEvent = { type: "PLAYER_LOSE", playerId: "player1" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("already has PLAYER_LOSE event");
    });

    it("should accept PLAYER_WIN for a player", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = { type: "PLAYER_WIN", playerId: "player1" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject second PLAYER_WIN for same player", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
        { type: "PLAYER_WIN", playerId: "player1" },
      ]);
      const event: TurnEvent = { type: "PLAYER_WIN", playerId: "player1" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("already has PLAYER_WIN event");
    });
  });

  describe("Rule 5: DRAW_CARD validation", () => {
    it("should accept drawing 1-3 cards", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = {
        type: "DRAW_CARD",
        playerId: "player1",
        drawn_cards: [
          { id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
          { id: "2", name: "Card", atk: 3, def: 7, card_art: "", created_at: "", updated_at: "" },
        ],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject drawing more than 3 cards", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = {
        type: "DRAW_CARD",
        playerId: "player1",
        drawn_cards: [
          { id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
          { id: "2", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
          { id: "3", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
          { id: "4", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
        ],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Cannot draw more than 3 cards");
    });

    it("should reject drawing more cards than available in deck", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      // Override player1 to have only 1 card
      roomState.playerInfo.players[0].cardsInDeck = [
        { id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
      ];

      const event: TurnEvent = {
        type: "DRAW_CARD",
        playerId: "player1",
        drawn_cards: [
          { id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
          { id: "2", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
        ],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Not enough cards in deck");
    });
  });

  describe("Rule 6: JAIL_CARD validation", () => {
    it("should accept jailing 1-3 cards", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = {
        type: "JAIL_CARD",
        playerId: "player1",
        jailed_cards: [
          { id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
        ],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject jailing more than 3 cards in one event", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = {
        type: "JAIL_CARD",
        playerId: "player1",
        jailed_cards: Array(4).fill({ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }),
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Cannot jail more than 3 cards in one event");
    });

    it("should reject jailing if total would exceed 50", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      // Set player1 to have 49 jailed cards
      roomState.playerInfo.players[0].jailedCards = Array(49).fill({
        id: "1",
        name: "Card",
        atk: 5,
        def: 5,
        card_art: "",
        created_at: "",
        updated_at: "",
      });

      const event: TurnEvent = {
        type: "JAIL_CARD",
        playerId: "player1",
        jailed_cards: [
          { id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
          { id: "2", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
        ],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Jailed cards would exceed 50");
    });
  });

  describe("Rule 7: ATTACKING validation", () => {
    it("should accept valid attack with 1-3 cards", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "PLAYER_JOIN", playerId: "player2" },
        { type: "GAME_START" },
        {
          type: "CHANGE_SENTINEL",
          playerId: "player1",
          new_sentinel: [{ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }],
        },
      ]);
      const event: TurnEvent = {
        type: "ATTACKING",
        playerId: "player2",
        card_used: [
          { id: "2", name: "Card", atk: 6, def: 4, card_art: "", created_at: "", updated_at: "" },
        ],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject attack with more than 3 cards", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = {
        type: "ATTACKING",
        playerId: "player1",
        card_used: Array(4).fill({ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }),
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Must attack with 1-3 cards");
    });

    it("should reject sentinel owner attacking their own sentinel", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
        {
          type: "CHANGE_SENTINEL",
          playerId: "player1",
          new_sentinel: [{ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }],
        },
      ]);
      const event: TurnEvent = {
        type: "ATTACKING",
        playerId: "player1",
        card_used: [{ id: "2", name: "Card", atk: 6, def: 4, card_art: "", created_at: "", updated_at: "" }],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Sentinel owner cannot attack their own sentinel");
    });

    it("should reject attack when ATK <= DEF", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "PLAYER_JOIN", playerId: "player2" },
        { type: "GAME_START" },
        {
          type: "CHANGE_SENTINEL",
          playerId: "player1",
          new_sentinel: [{ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }],
        },
      ]);
      const event: TurnEvent = {
        type: "ATTACKING",
        playerId: "player2",
        card_used: [{ id: "2", name: "Card", atk: 4, def: 6, card_art: "", created_at: "", updated_at: "" }],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Attack failed");
    });

    it("should accept single 0 card defeating any non-zero sentinel", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "PLAYER_JOIN", playerId: "player2" },
        { type: "GAME_START" },
        {
          type: "CHANGE_SENTINEL",
          playerId: "player1",
          new_sentinel: [
            { id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
            { id: "2", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" },
          ],
        },
      ]);
      const event: TurnEvent = {
        type: "ATTACKING",
        playerId: "player2",
        card_used: [{ id: "3", name: "Zero", atk: 0, def: 0, card_art: "", created_at: "", updated_at: "" }],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject single 0 card against zero-only sentinel", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "PLAYER_JOIN", playerId: "player2" },
        { type: "GAME_START" },
        {
          type: "CHANGE_SENTINEL",
          playerId: "player1",
          new_sentinel: [
            { id: "1", name: "Zero", atk: 0, def: 0, card_art: "", created_at: "", updated_at: "" },
          ],
        },
      ]);
      const event: TurnEvent = {
        type: "ATTACKING",
        playerId: "player2",
        card_used: [{ id: "2", name: "Zero", atk: 0, def: 0, card_art: "", created_at: "", updated_at: "" }],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Zero card cannot defeat a zero-only sentinel");
    });
  });

  describe("Rule 8: CHANGE_SENTINEL validation", () => {
    it("should accept CHANGE_SENTINEL after ATTACKING", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
        {
          type: "ATTACKING",
          playerId: "player1",
          card_used: [{ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }],
        },
      ]);
      const event: TurnEvent = {
        type: "CHANGE_SENTINEL",
        playerId: "player1",
        new_sentinel: [{ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject CHANGE_SENTINEL without preceding ATTACKING", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = {
        type: "CHANGE_SENTINEL",
        playerId: "player1",
        new_sentinel: [{ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }],
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("CHANGE_SENTINEL must come after ATTACKING");
    });

    it("should reject sentinel with more than 3 cards", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
        {
          type: "ATTACKING",
          playerId: "player1",
          card_used: [{ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }],
        },
      ]);
      const event: TurnEvent = {
        type: "CHANGE_SENTINEL",
        playerId: "player1",
        new_sentinel: Array(4).fill({ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }),
      };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Sentinel must contain 1-3 cards");
    });
  });

  describe("Rule 9: START_TURN validation", () => {
    it("should accept START_TURN after GAME_START", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = { type: "START_TURN", playerId: "player1" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject START_TURN before GAME_START", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
      ]);
      const event: TurnEvent = { type: "START_TURN", playerId: "player1" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("START_TURN can only appear after GAME_START");
    });

    it("should accept START_TURN after CHANGE_SENTINEL", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
        {
          type: "CHANGE_SENTINEL",
          playerId: "player1",
          new_sentinel: [{ id: "1", name: "Card", atk: 5, def: 5, card_art: "", created_at: "", updated_at: "" }],
        },
      ]);
      const event: TurnEvent = { type: "START_TURN", playerId: "player2" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });
  });

  describe("Rule 10: PLAYER_JOIN only before GAME_START", () => {
    it("should accept PLAYER_JOIN before GAME_START", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
      ]);
      const event: TurnEvent = { type: "PLAYER_JOIN", playerId: "player2" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(true);
    });

    it("should reject PLAYER_JOIN after GAME_START", () => {
      const roomState = createMockRoomState([
        { type: "PLAYER_JOIN", playerId: "player1" },
        { type: "GAME_START" },
      ]);
      const event: TurnEvent = { type: "PLAYER_JOIN", playerId: "player2" };
      const result = validateGameEvent(event, roomState);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Cannot add PLAYER_JOIN after GAME_START");
    });
  });
});
