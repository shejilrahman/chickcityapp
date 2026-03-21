const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'tbl_products.json');
const outPath = path.join(__dirname, 'products.json');

try {
  const data = fs.readFileSync(dbPath, 'utf8');
  const tbl = JSON.parse(data).tbl_products;

  const catData = fs.readFileSync(path.join(__dirname, 'tbl_categories.json'), 'utf8');
  const validCategoriesList = JSON.parse(catData).tbl_categories.map(c => c.title.trim().toUpperCase());
  const validCategories = new Set(validCategoriesList);

  // Filter out products with zero or negative price just in case, though ignoring stock
  // User said "ignore the stock field (qty)", but didn't say to ignore out of stock. So map everything.
  const mapped = [];

  tbl.forEach(p => {
    // Only map if category is strictly valid inside the Official Categories list
    const rawCategory = (p.category || "").trim().toUpperCase();
    if (!validCategories.has(rawCategory)) {
        return; // Skip ghost items like "ELITE CARROT CAKE 500M"
    }

    // Attempt rudimentary unit extraction from name (e.g., "Loose KG", "500G")
    let unit = "item";
    const nameUpper = p.name.toUpperCase();
    if (nameUpper.includes(" KG")) unit = "kg";
    else if (nameUpper.includes("G ")) unit = "g";
    else if (nameUpper.endsWith("G")) {
      const match = p.name.match(/(\d+)(G|g)$/);
      if (match) unit = match[0].toLowerCase();
    }
    else if (nameUpper.includes("ML")) unit = "ml";
    else if (nameUpper.includes(" LTR") || nameUpper.includes(" L ")) unit = "L";

    // Intelligent Tag Injection based on User Prompt requirements
    let tags = [];
    
    // 1. Generic Synonyms & Malayalam terms
    if (nameUpper.includes("ATTA") || nameUpper.includes("WHEAT") || nameUpper.includes("GOTHAMBU")) {
      tags.push("wheat", "flour", "atta", "aata", "chakki", "roti", "ഗോതമ്പ്");
    }
    if (nameUpper.includes("RICE") || nameUpper.includes("ARI ") || nameUpper.endsWith("ARI")) {
      tags.push("chaval", "arisi", "അരി", "rice");
    }
    if (nameUpper.includes("OIL") || nameUpper.includes("ENNA")) {
      tags.push("oil", "enna", "എണ്ണ");
      if (nameUpper.includes("COCONUT") || nameUpper.includes("VELICH")) {
        tags.push("velichenna", "thengayenna", "coconut", "nalikera", "copra", "തേങ്ങ");
      }
    }
    if (nameUpper.includes("SUGAR") || nameUpper.includes("PANCHASARA")) {
      tags.push("cheeni", "panjasara", "sugar", "പഞ്ചസാര");
    }
    if (nameUpper.includes("SALT") || nameUpper.includes("UPPU")) {
      tags.push("salt", "uppu", "ഉപ്പ്");
    }
    if (nameUpper.includes("DAL") || nameUpper.includes("PARIPPU")) {
      tags.push("parippu", "lentils", "dal", "paripp");
    }
    if (nameUpper.includes("SOAP")) {
      tags.push("sabon", "soap", "സോപ്പ്");
    }

    // 2. Brand Tolerances
    if (nameUpper.includes("AASHIRVAAD") || nameUpper.includes("ASHIRVAD")) {
      tags.push("ashirvad", "aashirvad", "ashirvaad", "asirvad", "ashirwad");
    }
    if (nameUpper.includes("MAGGI")) {
      tags.push("magi", "maggie", "noodles");
    }
    if (nameUpper.includes("HORLICKS")) {
      tags.push("horlick", "horlix");
    }
    if (nameUpper.includes("LIFEBUOY")) {
      tags.push("lifeboy", "lifboy");
    }
    if (nameUpper.includes("DETTOL")) {
      tags.push("detol", "dettall");
    }
    if (nameUpper.includes("KELLOGG")) {
      tags.push("kellogs", "kelogs");
    }
    if (nameUpper.includes("BRITANNIA")) {
      tags.push("brittania", "britania");
    }

    // Standardize Name formatting (capitalize nicely instead of all caps)
    const formattedName = p.name.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    mapped.push({
      id: p.id,
      name: formattedName,
      category: rawCategory, // Use standardized valid category
      price: p.rate || p.mrp || 0,
      unit: unit,
      emoji: "📦", // fallback because we don't have images for all 2200 real products
      tags: [...new Set(tags)] // ensure unique tags
    });
  });

  // Sort them loosely so they look nice
  mapped.sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(outPath, JSON.stringify(mapped, null, 2));
  console.log(`Successfully mapped ${mapped.length} valid products directly attached to ${validCategories.size} official categories.`);

} catch (e) {
  console.error("Mapping failed: ", e);
}
