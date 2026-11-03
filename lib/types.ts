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
  tier: "regular" | "vip";
  title_en: string;
  title_ar: string | null;
  total_odds: number;
  confidence: number;
  stake_units: number;
  notes_en: string | null;
  notes_ar: string | null;
  image_path: string | null;
  betarabia_code: string | null;
  status: SlipStatus;
  publish_at: string;
  settled_at: string | null;
  slip_legs: SlipLeg[];
};

export type Plan = {
  id: number;
  tier: "regular" | "vip";
  duration: "week" | "month" | "quarter" | "year";
  price_usd: number;
  active: boolean;
};

export const SLIP_SELECT =
  "id, tier, title_en, title_ar, total_odds, confidence, stake_units, notes_en, notes_ar, image_path, betarabia_code, status, publish_at, settled_at, slip_legs(id, position, event, market, pick, odds, kickoff_at, result)";
