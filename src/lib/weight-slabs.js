/**
 * Weight Slab Definitions
 *
 * Each slab defines how a product is sold in gram increments.
 * Products without a weightSlab field behave as before (unit-based).
 *
 * baseUnit: how many grams = 1 unit in the product's price
 *   (almost always 1000 g, i.e., the product price is "per kg")
 */

export const WEIGHT_SLABS = {
  slab_10g: {
    key: "slab_10g",
    label: "10 g steps",
    shortLabel: "10g",
    step: 10,      // grams per step
    min: 10,       // minimum grams
    max: 200,      // maximum grams
    baseUnit: 1000, // price is per this many grams (1 kg)
    color: "purple",
    example: "Saffron, rare spices",
  },
  slab_100g: {
    key: "slab_100g",
    label: "100 g steps",
    shortLabel: "100g",
    step: 100,
    min: 100,
    max: 1000,
    baseUnit: 1000,
    color: "orange",
    example: "Chilli, pepper, coriander",
  },
  slab_250g: {
    key: "slab_250g",
    label: "250 g steps",
    shortLabel: "250g",
    step: 250,
    min: 250,
    max: 2000,
    baseUnit: 1000,
    color: "green",
    example: "Tomato, onion",
  },
  slab_500g: {
    key: "slab_500g",
    label: "500 g steps",
    shortLabel: "500g",
    step: 500,
    min: 500,
    max: 5000,
    baseUnit: 1000,
    color: "blue",
    example: "Rice, dal, flour",
  },
};

export const SLAB_LIST = Object.values(WEIGHT_SLABS);

/**
 * Get the effective price for a slab product.
 * @param {number} basePrice - product.price (price per baseUnit grams)
 * @param {number} selectedGrams - how many grams the customer selected
 * @param {number} baseUnit - grams in one unit (default 1000)
 * @returns {number} price rounded to 2 decimal places
 */
export function getSlabPrice(basePrice, selectedGrams, baseUnit = 1000) {
  return Math.round((basePrice / baseUnit) * selectedGrams * 100) / 100;
}

/**
 * Format grams nicely: 1000g → "1 kg", 500g → "500 g"
 */
export function formatGrams(grams) {
  if (grams >= 1000 && grams % 1000 === 0) {
    return `${grams / 1000} kg`;
  }
  return `${grams} g`;
}
