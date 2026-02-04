import { SECRET_USER_JWT_SECRET_KEY } from "astro:env/server";
import { jwtEncrypt } from "../crypto/jwt";
import { PUBLIC_GOOGLE_CLIENT_ID, SECRET_GOOGLE_CLIENT_SECRET} from "astro:env/server";
import { PUBLIC_APP_URL } from "astro:env/client";
import type { AstroCookies } from "astro";
import type { CookieUserAuthInformation } from "@/types/auth/user/types";
import sample from "lodash/sample";

export async function generateJWTForUser({userId}:{userId:string}){
  const jwtResult = await jwtEncrypt({
    payload: { userId },
    secretKey: SECRET_USER_JWT_SECRET_KEY,
    expiresInSeconds: 3600*24*30, // 30 days
  });
  return jwtResult.data ? jwtResult.data : null;
}

export function generateGoogleOAuthPayloadForVerification({code}:{code:string}){
  return new URLSearchParams({
    client_id: PUBLIC_GOOGLE_CLIENT_ID,
    client_secret: SECRET_GOOGLE_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: PUBLIC_APP_URL + "/api/player/auth/login-with-google",
  });
}
export function generateGoogleOAuthPayloadForRequest(){
  return new URLSearchParams({
    client_id: PUBLIC_GOOGLE_CLIENT_ID,
    redirect_uri: PUBLIC_APP_URL + "/api/player/auth/login-with-google",
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });
}

export function getUserAuthInformation(cookie: AstroCookies):{data: CookieUserAuthInformation, error: null}|{data: null, error: string}{
  const data =  cookie.get("CDO_USER_INFO")?.value || null;
  if(!data){
    return {data: null, error: "No user auth information found"};
  }
  try{
    const dataParsed = JSON.parse(atob(data));
    if(
      typeof dataParsed !== "object"
      || dataParsed === null
      || !("id" in dataParsed)
      || !("username" in dataParsed)
      || !("email" in dataParsed)
    ){
      return {data: null, error: "Invalid user auth information format"};
    }
    return {
      data: dataParsed,
      error: null
    };
  }catch(e){
    return {data: null, error: "Failed to decode user auth information"};
  }
}

export function setTemporaryUser(cookie: AstroCookies){
  const info = {
    id: sample(Array.from({length: 1000000}, (_, i) => (i + 1).toString().padStart(6, '0'))) || "000001",
    username: generateTemporaryUsername(),
  }
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7 days expiry
  const expiredInSeconds = 7 * 24 * 60 * 60; // 7 days in seconds
  const hostname = PUBLIC_APP_URL.replace(/^https?:\/\//, '').replace(/:\d+/, '').replace(/\/$/, '');
  cookie.set("CDO_TEMPORARY_USER", btoa(JSON.stringify(info)), {
   expires: expiryDate ,
    maxAge:expiredInSeconds,
    httpOnly: true,
    secure: true, //If commented please turn it on again after testing on http without s
    sameSite: "strict",
    path: '/', 
    domain: hostname, 
  });
  return info;
}

export function getTemporaryUser(cookie: AstroCookies):{data: Omit<CookieUserAuthInformation, "email">, error: null}|{data: null, error: string}{
  const data =  cookie.get("CDO_TEMPORARY_USER")?.value || null;
  if(!data){
    return {data: null, error: "No temporary user information found"};
  }
  try{
    const dataParsed = JSON.parse(atob(data));
    if(
      typeof dataParsed !== "object" 
      || dataParsed === null 
      || !("id" in dataParsed) 
      || !("email" in dataParsed)
    ){
      return {data: null, error: "Invalid temporary user information format"};
    }
    return {
      data: dataParsed,
      error: null
    };
  }catch(e){
    return {data: null, error: "Failed to decode temporary user information"};
  }
}


/**
 * @paremter index use to pick a username by index. If not provided, a random username will be generated.
 * @returns string
 */
export function generateTemporaryUsername(props?:{
  index?:number
  noUnique?:boolean
}){
  const index = props?.index;
  const noUnique = props?.noUnique || false;
   const listOfUserName = [
    "shadow-ninja", "crimson-knight", "phantom-mage", "ice-warden", "thunder-sage",
    "midnight-wolf", "silver-fox", "golden-eagle", "bronze-bear", "ruby-dragon",
    "emerald-serpent", "sapphire-phoenix", "obsidian-raven", "crystal-unicorn", "pearl-dolphin",
    "amber-lion", "jade-tiger", "coral-shark", "storm-hawk", "frost-owl",
    "flame-phoenix", "earth-titan", "wind-spirit", "water-nymph", "void-spectre",
    "light-angel", "shadow-demon", "chaos-beast", "order-guardian", "balance-seeker",
    "swift-runner", "strong-guardian", "wise-scholar", "cunning-fox", "brave-warrior",
    "silent-assassin", "loud-bard", "wild-ranger", "holy-priest", "dark-warlock",
    "mystic-seer", "cosmic-traveler", "ancient-spirit", "future-prophet", "timeless-being",
    "endless-wanderer", "forever-seeker", "eternal-guardian", "infinite-soul", "boundless-mind",
    "sharp-blade", "sturdy-shield", "quick-arrow", "heavy-hammer", "keen-sword",
    "swift-dagger", "mighty-axe", "noble-spear", "sacred-staff", "cursed-tome",
    "blessed-ring", "enchanted-amulet", "mystical-crystal", "ancient-rune", "hidden-scroll",
    "lost-treasure", "found-fortune", "stolen-artifact", "guarded-secret", "whispered-tale",
    "echoing-voice", "silent-scream", "broken-promise", "kept-oath", "forsaken-hope",
    "shattered-dream", "mended-heart", "wounded-soul", "healed-spirit", "peaceful-mind",
    "restless-wanderer", "weary-traveler", "eager-adventurer", "cautious-explorer", "fearless-pioneer",
    "lonely-hermit", "friendly-companion", "loyal-ally", "trusted-friend", "sworn-enemy",
    "bitter-rival", "noble-foe", "worthy-opponent", "skilled-master", "eager-student",
    "humble-servant", "proud-leader", "wise-mentor", "foolish-jester", "clever-trickster",
    "honest-merchant", "greedy-banker", "generous-philanthropist", "miserly-miser", "charitable-soul",
    "cruel-tyrant", "just-ruler", "fair-judge", "corrupt-official", "honest-guard",
    "traitorous-spy", "loyal-soldier", "brave-knight", "cowardly-knave", "heroic-champion",
    "legendary-hero", "forgotten-villain", "rising-star", "fallen-angel", "awakened-demon",
    "reborn-phoenix", "petrified-statue", "living-statue", "animate-golem", "sentient-construct",
    "mechanical-heart", "clockwork-mind", "digital-soul", "virtual-ghost", "cyber-specter",
    "holographic-shade", "quantum-being", "dimensional-traveler", "parallel-self", "alternate-ego",
    "twin-soul", "split-personality", "united-whole", "divided-self", "fragmented-memory",
    "complete-consciousness", "partial-awareness", "full-enlightenment", "partial-ignorance", "blissful-oblivion",
    "painful-truth", "comfortable-lie", "harsh-reality", "sweet-illusion", "bitter-medicine",
    "honey-poison", "sugar-spike", "salt-tear", "pepper-flame", "spice-breeze",
    "vanilla-dream", "chocolate-wish", "cherry-kiss", "berry-bliss", "apple-core",
    "orange-burst", "lemon-zest", "lime-splash", "grape-vine", "melon-patch",
    "peach-fuzz", "plum-jam", "fig-leaf", "date-palm", "coconut-shell",
    "almond-smile", "walnut-brain", "cashew-curve", "peanut-dust", "sunflower-seed",
    "pumpkin-patch", "corn-stalk", "wheat-field", "barley-grain", "rice-paddy",
    "bean-pod", "pea-shoot", "carrot-stick", "beet-root", "turnip-top",
    "radish-bite", "onion-layer", "garlic-clove", "pepper-seed", "chili-heat",
    "mint-fresh", "basil-green", "sage-wise", "thyme-old", "rosemary-memory",
    "lavender-calm", "jasmine-night", "rose-thorn", "lily-pure", "daisy-chain",
    "tulip-color", "iris-eye", "orchid-exotic", "peony-bloom", "sunflower-face",
    "moonflower-night", "morning-glory", "evening-star", "midnight-sky", "daybreak-dawn",
    "sunset-gold", "sunrise-red", "noon-bright", "dusk-purple", "twilight-blue",
    "starlight-shine", "moonbeam-silver", "sunray-warm", "firelight-flicker", "candle-glow",
    "torch-bright", "lantern-guide", "beacon-hope", "signal-fire", "warning-light",
    "danger-red", "caution-yellow", "safe-green", "info-blue", "calm-purple",
    "joy-bright", "sorrow-dark", "anger-hot", "fear-cold", "peace-still",
    "chaos-wild", "order-neat", "harmony-balanced", "discord-jarring", "symphony-musical",
    "melody-sweet", "harmony-voices", "rhythm-beat", "tempo-fast", "measure-slow",
    "note-high", "bass-low", "treble-clear", "key-major", "scale-minor",
    "chord-rich", "interval-gap", "phrase-flow", "sentence-structure", "word-meaning",
    "letter-symbol", "digit-number", "math-science", "logic-reason", "thought-mind",
    "idea-concept", "theory-practice", "hypothesis-test", "experiment-result", "conclusion-final",
    "beginning-start", "middle-center", "end-finish", "alpha-omega", "first-last",
    "zero-infinity", "one-many", "few-several", "some-all", "none-everything",
    "nothing-something", "emptiness-fullness", "void-substance", "absence-presence", "null-value",
    "true-false", "yes-no", "right-wrong", "good-evil", "light-dark",
    "fire-water", "earth-air", "metal-wood", "stone-cloud", "rain-drought",
    "flood-desert", "mountain-valley", "peak-base", "summit-depth", "high-low",
    "upper-lower", "inner-outer", "front-back", "left-right", "center-edge",
    "middle-side", "top-bottom", "over-under", "above-below", "north-south",
    "east-west", "forward-backward", "inward-outward", "upward-downward", "around-through",
    "across-along", "between-beside", "near-far", "close-distant", "adjacent-separate",
    "touching-apart", "connected-broken", "joined-divided", "together-apart", "united-scattered",
    "gathered-dispersed", "collected-lost", "found-missing", "present-absent", "here-there",
    "now-then", "today-tomorrow", "yesterday-future", "past-present", "moment-eternity",
    "second-age", "hour-era", "day-epoch", "week-eon", "month-millennium",
    "year-century", "decade-generation", "season-period", "spring-autumn", "summer-winter",
    "warm-cold", "hot-cool", "heat-frost", "fire-ice", "steam-snow",
    "rain-sun", "storm-calm", "wind-still", "breeze-gust", "zephyr-tempest",
    "gentle-fierce", "soft-hard", "smooth-rough", "flat-bumpy", "straight-curved",
    "round-angular", "square-triangle", "circle-line", "dot-dash", "solid-hollow",
    "full-empty", "thick-thin", "wide-narrow", "broad-slim", "fat-skinny",
    "tall-short", "long-brief", "deep-shallow", "high-low", "loud-quiet",
    "bright-dim", "clear-murky", "clean-dirty", "pure-tainted", "fresh-stale",
    "new-old", "modern-ancient", "current-obsolete", "recent-distant", "latest-earliest",
    "newest-oldest", "youngest-eldest", "prime-decline", "peak-valley", "bloom-wilt",
    "flourish-fade", "grow-shrink", "expand-contract", "increase-decrease", "rise-fall",
    "climb-descend", "ascend-plunge", "soar-sink", "fly-crash", "float-drown",
    "swim-wade", "dive-surface", "jump-land", "leap-stumble", "sprint-crawl",
    "run-walk", "dash-stroll", "hurry-linger", "rush-delay", "hasten-postpone",
    "accelerate-brake", "speed-slow", "faster-slower", "quickest-slowest", "rapid-leisurely",
    "swift-sluggish", "agile-clumsy", "nimble-awkward", "graceful-ungainly", "elegant-crude",
    "refined-rough", "polished-dull", "shiny-matte", "glossy-flat", "bright-dark",
    "radiant-shadowy", "luminous-gloomy", "glowing-fading", "sparkling-drab", "glittering-dull",
    "shimmering-still", "flickering-constant", "wavering-steady", "trembling-stable", "quaking-firm",
    "shaking-solid", "vibrating-motionless", "pulsing-static", "throbbing-quiet", "beating-silent",
    "rhythmic-arrhythmic", "regular-irregular", "consistent-variable", "stable-unstable", "fixed-flexible",
    "rigid-supple", "stiff-limber", "tense-relaxed", "tight-loose", "snug-baggy",
    "fitted-oversized", "tailored-shapeless", "precise-vague", "exact-approximate", "accurate-inaccurate",
    "correct-incorrect", "right-wrong", "proper-improper", "appropriate-inappropriate", "suitable-unsuitable",
    "fitting-unfitting", "becoming-unbecoming", "seemly-unseemly", "decent-indecent", "respectable-disreputable",
    "honorable-shameful", "noble-base", "high-low", "exalted-debased", "elevated-degraded",
    "uplifted-depressed", "inspired-discouraged", "motivated-demotivated", "energized-drained", "revitalized-exhausted",
    "refreshed-fatigued", "restored-depleted", "replenished-empty", "fulfilled-unfulfilled", "satisfied-dissatisfied",
    "content-discontent", "pleased-displeased", "happy-sad", "joyful-sorrowful", "cheerful-gloomy",
    "merry-melancholy", "jovial-morose", "lighthearted-heavy-hearted", "carefree-burdened", "unburdened-loaded",
    "unencumbered-weighted", "free-bound", "liberated-imprisoned", "released-confined", "loose-tight",
    "unbound-shackled", "unchained-chained", "unfettered-fettered", "unconstrained-constrained", "unrestricted-restricted",
    "unlimited-limited", "boundless-bounded", "infinite-finite", "endless-finite", "eternal-temporary",
    "permanent-transient", "lasting-fleeting", "enduring-brief", "abiding-passing", "constant-variable",
    "unchanging-changing", "static-dynamic", "still-moving", "stationary-mobile", "fixed-moveable",
    "rooted-uprooted", "planted-floating", "anchored-adrift", "secured-loose", "fastened-unfastened",
    "attached-detached", "connected-disconnected", "linked-separated", "joined-parted", "unified-divided"
  ];

  let selectedUsername = "";
  if(!index){
    selectedUsername = sample(listOfUserName) as string;
  }else{
    selectedUsername = listOfUserName[index % listOfUserName.length];
  }

  if(!noUnique){
    return selectedUsername;
  }else{
    // use yyyymmddhhmmss
    const dateSuffix =  new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    return `${selectedUsername}-${dateSuffix}`;
  }
  
}