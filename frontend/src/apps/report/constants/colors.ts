export const RANK_COLORS = [
  "bg-yellow-500", // 1st
  "bg-gray-400",   // 2nd
  "bg-orange-600", // 3rd
] as const;

export const SUMMARY_CARD_BG = {
  stats: "bg-gray-50",
  topProfitUsd: "bg-blue-50",
  topProfitPct: "bg-green-50",
  reviewNeeded: "bg-red-50",
} as const;

export const VALUE_COLORS = {
  positive: "text-green-600",
  negative: "text-red-600",
} as const;
