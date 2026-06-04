import type { Citation } from "./contracts";

/**
 * External (non-HDFC) reference links allowed by product requirements.
 *
 * Current rule:
 * - ONLY expense-ratio answers show a Groww link (as a secondary source).
 */
const GROWW_BY_SCHEME: Record<string, string> = {
  "HDFC Mid-Cap Opportunities Fund": "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
  "HDFC Flexi Cap Fund": "https://groww.in/mutual-funds/hdfc-equity-fund-direct-growth",
  "HDFC Focused Fund": "https://groww.in/mutual-funds/hdfc-focused-fund-direct-growth",
  "HDFC ELSS Tax Saver": "https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth",
  "HDFC Large Cap Fund": "https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth",
};

export function growwCitationForScheme(scheme: string): Citation | null {
  const url = GROWW_BY_SCHEME[scheme];
  if (!url) return null;
  return {
    url,
    label: `Groww — ${scheme} (expense ratio)`,
  };
}

