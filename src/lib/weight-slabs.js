/**
 * Portion Slab Definitions (formerly Weight Slabs)
 *
 * Each slab defines how a product is sold in portions (Qtr, Half, Full).
 * For a restaurant, portions are based on a base price (e.g., Full price).
 * 
 * baseUnit: conceptually 1.0 (Full)
 */

export const WEIGHT_SLABS = {
  slab_portions: {
    key: "slab_portions",
    label: "Standard Portions",
    shortLabel: "Q/H/F",
    step: 0.25,      // portion step
    min: 0.25,       // Qtr
    max: 1.0,        // Full
    baseUnit: 1.0,   // price is per 1.0 (Full)
    color: "purple",
    example: "Chicken, Mandi, Biryani",
  },
  slab_family: {
    key: "slab_family",
    label: "Family Portions",
    shortLabel: "F/XL",
    step: 0.5,
    min: 1.0,
    max: 2.0,
    baseUnit: 1.0,
    color: "orange",
    example: "Family Buckets, Platters",
  },
};

export const SLAB_LIST = Object.values(WEIGHT_SLABS);

/**
 * Get the effective price for a slab product.
 * @param {number} basePrice - product.price (price per baseUnit)
 * @param {number} selectedValue - portion value (0.25, 0.5, 1.0, etc.)
 * @param {number} baseUnit - default 1.0
 * @returns {number} price rounded to 2 decimal places
 */
export function getSlabPrice(basePrice, selectedValue, baseUnit = 1.0) {
  return Math.round((basePrice / baseUnit) * selectedValue * 100) / 100;
}

/**
 * Format portions nicely: 0.25 → "Qtr", 0.5 → "Half", 1.0 → "Full"
 */
export function formatGrams(value) {
  if (value === 0.25) return "Qtr";
  if (value === 0.5) return "Half";
  if (value === 1.0) return "Full";
  if (value === 1.5) return "1.5 Full";
  if (value === 2.0) return "Double / XL";
  return `${value} Portion`;
}

