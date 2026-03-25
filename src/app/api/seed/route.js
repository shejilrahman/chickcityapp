import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// ─── PRICING HELPER ────────────────────────────────────────────────────────────
// For items with Qtr/Half/Full sizing (with or without rice)
// portionSlab: { withRice: { qtr, half, full }, meatOnly: { qtr, half, full } }
// For flat-price items: price field only, portionSlab: null

// ─── CATEGORIES ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { title: "KUZHI MANDI CHICKEN", emoji: "🍗", sortOrder: 1 },
  { title: "AL FAHAM CHICKEN",    emoji: "🔥", sortOrder: 2 },
  { title: "MEAT & SEA FOOD",     emoji: "🥩", sortOrder: 3 },
  { title: "NOOR SPECIALS",       emoji: "⭐", sortOrder: 4 },
  { title: "MANDI",               emoji: "🍖", sortOrder: 5 },
  { title: "BIRYANI",             emoji: "🍛", sortOrder: 6 },
  { title: "STARTERS",            emoji: "🍢", sortOrder: 7 },
  { title: "BREADS",              emoji: "🫓", sortOrder: 8 },
  { title: "CHICKEN DISHES",      emoji: "🍗", sortOrder: 9 },
  { title: "BEEF & MUTTON",       emoji: "🥩", sortOrder: 10 },
  { title: "VEG ITEMS",           emoji: "🥦", sortOrder: 11 },
  { title: "BEVERAGES",           emoji: "🥤", sortOrder: 12 },
];

// ─── PRODUCTS ──────────────────────────────────────────────────────────────────
// Only NEW items (old items completely removed)
const PRODUCTS = [

  // ─── KUZHI MANDI CHICKEN ──────────────────────────────────────────────────
  {
    name: "Classic Mandhi",
    category: "KUZHI MANDI CHICKEN",
    price: 189,
    mrp: null,
    isVeg: false,
    isBestseller: true,
    spiceLevel: "Mild",
    tags: ["mandi", "kuzhi", "chicken", "arabic"],
    description: "The authentic taste of Arabia in a mild flavor.",
    portionSlab: { withRice: { qtr: 189, half: 354, full: 659 }, meatOnly: { qtr: 139, half: 249, full: 489 } },
  },
  {
    name: "Noor Special (Mandi)",
    category: "KUZHI MANDI CHICKEN",
    price: 199,
    mrp: null,
    isVeg: false,
    isBestseller: true,
    spiceLevel: "Medium",
    tags: ["mandi", "kuzhi", "chicken", "signature"],
    description: "Our kitchen's exclusive treat with a perfect mild spicy touch.",
    portionSlab: { withRice: { qtr: 199, half: 374, full: 709 }, meatOnly: { qtr: 148, half: 264, full: 499 } },
  },
  {
    name: "Smoky Grain",
    category: "KUZHI MANDI CHICKEN",
    price: 214,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Medium",
    tags: ["mandi", "kuzhi", "chicken", "smoky", "arabic"],
    description: "Famous for its authentic Arabic smoky flavor.",
    portionSlab: { withRice: { qtr: 214, half: 394, full: 759 }, meatOnly: { qtr: 159, half: 293, full: 567 } },
  },
  {
    name: "Triple Spicy",
    category: "KUZHI MANDI CHICKEN",
    price: 229,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Hot",
    tags: ["mandi", "kuzhi", "chicken", "spicy", "kerala"],
    description: "Arabic Mandi meets the heat of Kerala spices — the perfect alternative to Masala Shawaya.",
    portionSlab: { withRice: { qtr: 229, half: 423, full: 799 }, meatOnly: { qtr: 178, half: 321, full: 609 } },
  },
  {
    name: "Green Velvet",
    category: "KUZHI MANDI CHICKEN",
    price: 238,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Hot",
    tags: ["mandi", "kuzhi", "chicken", "kerala", "fusion"],
    description: "A spicy Kerala fusion with Bird's Eye chili and pepper.",
    portionSlab: { withRice: { qtr: 238, half: 456, full: 849 }, meatOnly: { qtr: 187, half: 357, full: 654 } },
  },
  {
    name: "Nachos Tex Mex",
    category: "KUZHI MANDI CHICKEN",
    price: 249,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Medium",
    tags: ["mandi", "kuzhi", "chicken", "mexican", "fusion"],
    description: "Mexican flavors meet Mandi Chicken with a Nacho flavour.",
    portionSlab: { withRice: { qtr: 249, half: 476, full: 879 }, meatOnly: { qtr: 198, half: 374, full: 687 } },
  },

  // ─── AL FAHAM CHICKEN ─────────────────────────────────────────────────────
  {
    name: "Turkish",
    category: "AL FAHAM CHICKEN",
    price: 213,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Medium",
    tags: ["faham", "chicken", "turkish", "grilled"],
    description: "Flavour from the land of Turkey.",
    portionSlab: { withRice: { qtr: 213, half: 393, full: 767 }, meatOnly: { qtr: 148, half: 264, full: 499 } },
  },
  {
    name: "Peri Peri (Faham)",
    category: "AL FAHAM CHICKEN",
    price: 228,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Hot",
    tags: ["faham", "chicken", "peri-peri", "portuguese"],
    description: "A spicy Portuguese kick to our Chicken.",
    portionSlab: { withRice: { qtr: 228, half: 423, full: 818 }, meatOnly: { qtr: 159, half: 293, full: 567 } },
  },
  {
    name: "Honey Chilly",
    category: "AL FAHAM CHICKEN",
    price: 238,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Medium",
    tags: ["faham", "chicken", "honey", "sweet-spicy"],
    description: "A delightful spicy and sweet combination for loved ones.",
    portionSlab: { withRice: { qtr: 238, half: 456, full: 840 }, meatOnly: { qtr: 180, half: 340, full: 599 } },
  },
  {
    name: "Kanthari (Faham)",
    category: "AL FAHAM CHICKEN",
    price: 240,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Hot",
    tags: ["faham", "chicken", "kanthari", "spicy"],
    description: "Ready to immerse in the spiciness.",
    portionSlab: { withRice: { qtr: 240, half: 460, full: 888 }, meatOnly: { qtr: 198, half: 376, full: 689 } },
  },
  {
    name: "Red Rub",
    category: "AL FAHAM CHICKEN",
    price: 258,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Medium",
    tags: ["faham", "chicken", "kerala", "shallots"],
    description: "A flavourful Chicken using shallots for a rich Kerala flavour.",
    portionSlab: { withRice: { qtr: 258, half: 498, full: 916 }, meatOnly: { qtr: 198, half: 378, full: 676 } },
  },
  {
    name: "Iffa Cheezy Meshawi",
    category: "AL FAHAM CHICKEN",
    price: 259,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Medium",
    tags: ["faham", "chicken", "cheezy", "meshawi"],
    description: "Trendy Cheezy Oozy Iffa Chicken.",
    portionSlab: { withRice: { qtr: 259, half: 494, full: 918 }, meatOnly: { qtr: 199, half: 374, full: 678 } },
  },
  {
    name: "Peri Peri Cheezy Meshawi",
    category: "AL FAHAM CHICKEN",
    price: 269,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Hot",
    tags: ["faham", "chicken", "peri-peri", "cheezy", "meshawi"],
    description: "A pizza-flavoured Chicken which fills your appetite.",
    portionSlab: { withRice: { qtr: 269, half: 515, full: 969 }, meatOnly: { qtr: 209, half: 388, full: 699 } },
  },
  {
    name: "Kanthari Cheezy Meshawi",
    category: "AL FAHAM CHICKEN",
    price: 269,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Hot",
    tags: ["faham", "chicken", "kanthari", "cheezy", "meshawi"],
    description: "Kanthari with a Cheezy twist.",
    portionSlab: { withRice: { qtr: 269, half: 515, full: 969 }, meatOnly: { qtr: 209, half: 388, full: 699 } },
  },
  {
    name: "Signature Sweet Meshawi",
    category: "AL FAHAM CHICKEN",
    price: 269,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Mild",
    tags: ["faham", "chicken", "sweet", "meshawi", "signature"],
    description: "So soft, it melts, so sweet, it charms.",
    portionSlab: { withRice: { qtr: 269, half: 515, full: 969 }, meatOnly: { qtr: 209, half: 388, full: 699 } },
  },

  // ─── MEAT & SEA FOOD ──────────────────────────────────────────────────────
  {
    name: "Beef Tawa",
    category: "MEAT & SEA FOOD",
    price: 209,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Mild",
    tags: ["beef", "tawa", "slow-cooked"],
    description: "Mild flavoured meat which is slow cooked in Tawa.",
    portionSlab: { withRice: { qtr: 264, half: 489, full: 914 }, meatOnly: { qtr: 209, half: 392, full: 714 } },
  },
  {
    name: "Beef Kanthari",
    category: "MEAT & SEA FOOD",
    price: 229,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Hot",
    tags: ["beef", "kanthari", "spicy"],
    description: "Soft meat with spice tint is the need of the hour.",
    portionSlab: { withRice: { qtr: 278, half: 534, full: 993 }, meatOnly: { qtr: 229, half: 433, full: 794 } },
  },
  {
    name: "Sizzling Kuttan",
    category: "MEAT & SEA FOOD",
    price: 239,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Hot",
    tags: ["buffalo", "sizzling", "special"],
    description: "The baby buffalo meat sizzling with flavours will melt in your mouth.",
    portionSlab: { withRice: { qtr: 289, half: 543, full: 999 }, meatOnly: { qtr: 239, half: 444, full: 799 } },
  },
  {
    name: "Spice Route Mutton",
    category: "MEAT & SEA FOOD",
    price: 349,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Hot",
    tags: ["mutton", "slow-cooked", "spice"],
    description: "Slow cooked mutton meat with right amount of Spice is a heaven.",
    portionSlab: { withRice: { qtr: 399, half: 768, full: 1468 }, meatOnly: { qtr: 349, half: 666, full: 1264 } },
  },
  {
    name: "Grilled Fish",
    category: "MEAT & SEA FOOD",
    price: 0,
    mrp: null,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Medium",
    tags: ["fish", "grilled", "seafood"],
    description: "The sea of flavours in one dish.",
    portionSlab: null,
    priceNote: "As per size / Item",
  },

  // ─── NOOR SPECIALS ────────────────────────────────────────────────────────
  {
    name: "Noor Special Rice",
    category: "NOOR SPECIALS",
    price: 149,
    mrp: 180,
    isVeg: true,
    isBestseller: false,
    spiceLevel: "Mild",
    tags: ["rice", "special", "veg", "quarter"],
    description: "A special quarter portion rice dish with veggies (2 flavours).",
    portionSlab: null,
  },
  {
    name: "Beef Chutney",
    category: "NOOR SPECIALS",
    price: 49,
    mrp: 60,
    isVeg: false,
    isBestseller: false,
    spiceLevel: "Medium",
    tags: ["beef", "chutney", "side", "special"],
    description: "This recipe is so good, it's like a party in your mouth.",
    portionSlab: null,
  },
  {
    name: "Mandi Rice",
    category: "NOOR SPECIALS",
    price: 98,
    mrp: 120,
    isVeg: true,
    isBestseller: false,
    spiceLevel: "None",
    tags: ["rice", "mandi", "quarter", "side"],
    description: "A standard quarter-portion of Mandi rice.",
    portionSlab: null,
  },

  // ─── NEW BREADS ───────────────────────────────────────────────────────────
  {
    name: "Khuboos",
    category: "BREADS",
    price: 10,
    mrp: null,
    isVeg: true,
    isBestseller: false,
    spiceLevel: "None",
    tags: ["khuboos", "arabic", "bread"],
    description: "Soft Arabic bread. A perfect combo for everything.",
    portionSlab: null,
  },
  {
    name: "Rumali Roti",
    category: "BREADS",
    price: 20,
    mrp: null,
    isVeg: true,
    isBestseller: false,
    spiceLevel: "None",
    tags: ["roti", "thin", "bread"],
    description: "Super thin, soft Indian flatbread, folded like a handkerchief.",
    portionSlab: null,
  },
  {
    name: "Mayonnaise",
    category: "BREADS",
    price: 20,
    mrp: null,
    isVeg: true,
    isBestseller: false,
    spiceLevel: "None",
    tags: ["condiment", "eggless", "dip"],
    description: "Our trademark eggless mayonnaise recipe.",
    portionSlab: null,
  },
];

// ─── SEED ROUTE ────────────────────────────────────────────────────────────────
export async function POST() {
  try {
    const results = { categoriesUpdated: 0, productsAdded: 0, errors: [] };

    // 1. Seed / Update Categories (upsert by title)
    const categoryIdMap = {};
    for (const cat of CATEGORIES) {
      try {
        const q = query(collection(db, "categories"), where("title", "==", cat.title));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Update existing category
          const existingDoc = snapshot.docs[0];
          await updateDoc(doc(db, "categories", existingDoc.id), {
            ...cat,
            isActive: true,
            updatedAt: serverTimestamp(),
          });
          categoryIdMap[cat.title] = existingDoc.id;
          results.categoriesUpdated++;
        } else {
          // Add new category
          const docRef = await addDoc(collection(db, "categories"), {
            ...cat,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await updateDoc(doc(db, "categories", docRef.id), { id: docRef.id });
          categoryIdMap[cat.title] = docRef.id;
          results.categoriesUpdated++;
        }
      } catch (e) {
        results.errors.push(`Category "${cat.title}": ${e.message}`);
      }
    }

    // 2. Seed Products (only new items)
    for (const product of PRODUCTS) {
      try {
        const categoryId = categoryIdMap[product.category] || "";
        const docRef = await addDoc(collection(db, "products"), {
          name: product.name,
          description: product.description || "",
          category: product.category,
          categoryId,
          price: product.price,
          mrp: product.mrp ?? null,
          image: "",
          isVeg: Boolean(product.isVeg),
          isBestseller: Boolean(product.isBestseller),
          isAvailable: true,
          isFeatured: false,
          hidden: false,
          spiceLevel: product.spiceLevel || "Medium",
          portionSlab: product.portionSlab ?? null,
          priceNote: product.priceNote || null,
          tags: product.tags || [],
          sortOrder: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "products", docRef.id), { id: docRef.id });
        results.productsAdded++;
      } catch (e) {
        results.errors.push(`Product "${product.name}": ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ Updated ${results.categoriesUpdated} categories and added ${results.productsAdded} new products (no duplicates).`,
      errors: results.errors,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}