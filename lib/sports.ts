// Sports on the Live scores page. Football is embedded; the rest open Flashscore's live page for that sport.
export const SPORTS = [
  { key: "football", emoji: "⚽", flashscore: "" },
  { key: "tennis", emoji: "🎾", flashscore: "tennis/" },
  { key: "basketball", emoji: "🏀", flashscore: "basketball/" },
  { key: "darts", emoji: "🎯", flashscore: "darts/" },
  { key: "hockey", emoji: "🏒", flashscore: "hockey/" },
  { key: "volleyball", emoji: "🏐", flashscore: "volleyball/" },
  { key: "handball", emoji: "🤾", flashscore: "handball/" },
  { key: "snooker", emoji: "🎱", flashscore: "snooker/" },
  { key: "tableTennis", emoji: "🏓", flashscore: "table-tennis/" },
  { key: "baseball", emoji: "⚾", flashscore: "baseball/" },
  { key: "americanFootball", emoji: "🏈", flashscore: "american-football/" },
  { key: "cricket", emoji: "🏏", flashscore: "cricket/" },
  { key: "mma", emoji: "🥋", flashscore: "mma/" },
  { key: "boxing", emoji: "🥊", flashscore: "boxing/" },
  { key: "esports", emoji: "🎮", flashscore: "esports/" },
] as const;

export type SportKey = (typeof SPORTS)[number]["key"];

export const flashscoreUrl = (slug: string) => `https://www.flashscore.com/${slug}`;
