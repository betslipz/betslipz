import type { Sport } from "@/lib/sports";

export type SlipStatus = "pending" | "won" | "lost" | "void" | "partial";

export type SlipLeg = {
  id: string;
  position: number;
  event: string;
  market: string;
  pick: string;
  odds: number;
  kickoff_at: string | null;
  result: SlipStatus;
};

export type Slip = {
  id: string;
  title_en: string;
  title_ar: string | null;
  total_odds: number;
  confidence: number;
  stake_units: number;
  price_usd: number;
  notes_en: string | null;
  notes_ar: string | null;
  image_path: string | null;
  status: SlipStatus;
  publish_at: string;
  settled_at: string | null;
  slip_legs: SlipLeg[];
};

// A single-game pick. Settled as won, lost or void (never partial).
export type Prediction = {
  id: string;
  sport: Sport;
  competition: string | null;
  event: string;
  kickoff_at: string | null;
  market: string;
  pick: string;
  odds: number;
  confidence: number;
  notes_en: string | null;
  notes_ar: string | null;
  status: SlipStatus;
  publish_at: string;
  settled_at: string | null;
};

// tier "vip" opens everything; tier "regular" plans each open one sport.
export type Plan = {
  id: number;
  tier: "regular" | "vip";
  sport: Sport | null;
  duration: "week" | "month" | "quarter" | "year";
  price_usd: number;
  active: boolean;
};

export const SLIP_SELECT =
  "id, title_en, title_ar, total_odds, confidence, stake_units, price_usd, notes_en, notes_ar, image_path, status, publish_at, settled_at, slip_legs(id, position, event, market, pick, odds, kickoff_at, result)";

export const PREDICTION_SELECT =
  "id, sport, competition, event, kickoff_at, market, pick, odds, confidence, notes_en, notes_ar, status, publish_at, settled_at";
