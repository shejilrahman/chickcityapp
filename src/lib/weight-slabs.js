/**
 * Portion Slab Helpers
 *
 * New structure: portionSlab = {
 *   withRice:  { qtr, half, full },
 *   meatOnly:  { qtr, half, full }
 * }
 * or null for flat-price items.
 */

export const PORTION_SIZES = ["qtr", "half", "full"];
export const RICE_TYPES = ["withRice", "meatOnly"];

export const PORTION_LABELS = {
  qtr: "Quarter",
  half: "Half",
  full: "Full",
};

export const RICE_TYPE_LABELS = {
  withRice: "With Rice",
  meatOnly: "Meat Only",
};

/**
 * Get the explicit price from a portionSlab.
 * @param {object} portionSlab
 * @param {"withRice"|"meatOnly"} riceType
 * @param {"qtr"|"half"|"full"} size
 * @returns {number|null}
 */
export function getPortionPrice(portionSlab, riceType, size) {
  if (!portionSlab) return null;
  return portionSlab[riceType]?.[size] ?? null;
}

/**
 * Get the starting/display price for a portionSlab product (withRice qtr).
 */
export function getStartingPrice(product) {
  if (product.portionSlab?.withRice?.qtr != null) {
    return product.portionSlab.withRice.qtr;
  }
  return product.price;
}

// ── Legacy exports kept for any remaining usage ──────────────────────────────
export const WEIGHT_SLABS = {
  slab_portions: {
    key: "slab_portions",
    label: "Standard Portions",
    shortLabel: "Q/H/F",
    step: 0.25,
    min: 0.25,
    max: 1.0,
    baseUnit: 1.0,
    color: "purple",
    example: "Chicken, Mandi, Biryani",
  },
};

export function getSlabPrice(basePrice, selectedValue, baseUnit = 1.0) {
  return Math.round((basePrice / baseUnit) * selectedValue * 100) / 100;
}

export function formatGrams(value) {
  if (value === 0.25) return "Qtr";
  if (value === 0.5) return "Half";
  if (value === 1.0) return "Full";
  return `${value} Portion`;
}
