import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, writeBatch, serverTimestamp } from "firebase/firestore";

// ─── CATEGORIES ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { title: "MANDI",          emoji: "🍖", sortOrder: 1 },
  { title: "BIRYANI",        emoji: "🍛", sortOrder: 2 },
  { title: "STARTERS",       emoji: "🍢", sortOrder: 3 },
  { title: "BREADS",         emoji: "🫓", sortOrder: 4 },
  { title: "CHICKEN DISHES", emoji: "🍗", sortOrder: 5 },
  { title: "BEEF & MUTTON",  emoji: "🥩", sortOrder: 6 },
  { title: "VEG ITEMS",      emoji: "🥦", sortOrder: 7 },
  { title: "BEVERAGES",      emoji: "🥤", sortOrder: 8 },
];

// ─── PRODUCTS ──────────────────────────────────────────────────────────────────
// Each product: { name, category, price, mrp, isVeg, isBestseller, spiceLevel, tags?, description? }
const PRODUCTS = [
  // MANDI
  { name: "Chicken Mandi (Full)", category: "MANDI", price: 650, mrp: 700, isVeg: false, isBestseller: true, spiceLevel: "Mild", tags: ["mandi", "sharing"], description: "Slow-cooked whole chicken on fragrant mandi rice" },
  { name: "Chicken Mandi (Half)", category: "MANDI", price: 380, mrp: 420, isVeg: false, isBestseller: true, spiceLevel: "Mild", tags: ["mandi"], description: "Half portion of our signature chicken mandi" },
  { name: "Mutton Mandi (Full)",  category: "MANDI", price: 900, mrp: 950, isVeg: false, isBestseller: false, spiceLevel: "Mild", tags: ["mandi", "sharing"], description: "Slow-cooked mutton on fragrant mandi rice" },
  { name: "Mutton Mandi (Half)",  category: "MANDI", price: 520, mrp: 580, isVeg: false, isBestseller: false, spiceLevel: "Mild", tags: ["mandi"], description: "Half portion of our mutton mandi" },
  { name: "Lamb Ouzi",            category: "MANDI", price: 950, mrp: 1000, isVeg: false, isBestseller: false, spiceLevel: "Mild", tags: ["mandi", "sharing", "premium"], description: "Traditional slow-roasted whole lamb" },
  { name: "Mandi Rice (per plate)", category: "MANDI", price: 80, mrp: 100, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["rice", "side"], description: "Plain fragrant mandi rice per plate" },
  { name: "Mandi Shorba",         category: "MANDI", price: 60, mrp: 80, isVeg: false, isBestseller: false, spiceLevel: "Mild", tags: ["soup", "starter"], description: "Aromatic meat broth served with mandi" },

  // BIRYANI
  { name: "Chicken Dum Biryani",        category: "BIRYANI", price: 220, mrp: 260, isVeg: false, isBestseller: true, spiceLevel: "Medium", tags: ["biryani"], description: "Slow-cooked aromatic chicken dum biryani" },
  { name: "Mutton Biryani",             category: "BIRYANI", price: 280, mrp: 320, isVeg: false, isBestseller: true, spiceLevel: "Medium", tags: ["biryani"], description: "Tender mutton cooked in a fragrant biryani" },
  { name: "Beef Biryani",               category: "BIRYANI", price: 270, mrp: 310, isVeg: false, isBestseller: true, spiceLevel: "Medium", tags: ["biryani"], description: "Spiced Kerala-style beef biryani" },
  { name: "Prawn Biryani",              category: "BIRYANI", price: 300, mrp: 350, isVeg: false, isBestseller: false, spiceLevel: "Medium", tags: ["biryani", "seafood"], description: "Fresh prawns in aromatic basmati biryani" },
  { name: "Veg Biryani",               category: "BIRYANI", price: 160, mrp: 200, isVeg: true,  isBestseller: false, spiceLevel: "Mild", tags: ["biryani", "veg"], description: "Fragrant basmati rice with garden vegetables" },
  { name: "Egg Biryani",               category: "BIRYANI", price: 180, mrp: 220, isVeg: false, isBestseller: false, spiceLevel: "Mild", tags: ["biryani", "egg"], description: "Boiled egg biryani in aromatic rice" },
  { name: "Chicken Biryani (Family Pack)", category: "BIRYANI", price: 750, mrp: 850, isVeg: false, isBestseller: false, spiceLevel: "Medium", tags: ["biryani", "family", "value", "sharing"], description: "Giant family-size chicken biryani — serves 4-5" },

  // STARTERS
  { name: "Chicken Shawarma",     category: "STARTERS", price: 100, mrp: 120, isVeg: false, isBestseller: false, spiceLevel: "Medium", tags: ["shawarma", "snack"], description: "Arabic-style chicken shawarma wrap" },
  { name: "Beef Shawarma",        category: "STARTERS", price: 110, mrp: 130, isVeg: false, isBestseller: false, spiceLevel: "Medium", tags: ["shawarma", "snack"], description: "Tender beef shawarma wrap" },
  { name: "Chicken 65",           category: "STARTERS", price: 180, mrp: 220, isVeg: false, isBestseller: false, spiceLevel: "Hot", tags: ["fried", "snack"], description: "Crispy spicy fried chicken — South Indian classic" },
  { name: "Chicken Lollipop (6 pcs)", category: "STARTERS", price: 200, mrp: 240, isVeg: false, isBestseller: false, spiceLevel: "Hot", tags: ["lollipop", "party"], description: "6 pieces of spicy chicken lollipops" },
  { name: "Beef Fry",             category: "STARTERS", price: 200, mrp: 240, isVeg: false, isBestseller: false, spiceLevel: "Hot", tags: ["fry", "kerala"], description: "Kerala-style dry beef fry with coconut slices" },
  { name: "Mutton Chukka",        category: "STARTERS", price: 250, mrp: 290, isVeg: false, isBestseller: false, spiceLevel: "Hot", tags: ["dry", "starter"], description: "Dry-roasted spiced mutton starter" },
  { name: "Veg Spring Roll",      category: "STARTERS", price: 120, mrp: 150, isVeg: true,  isBestseller: false, spiceLevel: "Mild", tags: ["veg", "snack"], description: "Crispy fried spring rolls with vegetable filling" },
  { name: "Paneer Tikka",         category: "STARTERS", price: 200, mrp: 240, isVeg: true,  isBestseller: false, spiceLevel: "Medium", tags: ["paneer", "veg"], description: "Grilled cottage cheese with tandoori spices" },
  { name: "French Fries",         category: "STARTERS", price: 90, mrp: 120, isVeg: true,  isBestseller: false, spiceLevel: "None", tags: ["fries", "snack"], description: "Crispy golden French fries" },

  // BREADS
  { name: "Kerala Porotta",    category: "BREADS", price: 20, mrp: 25, isVeg: true, isBestseller: true, spiceLevel: "None", tags: ["porotta", "bread", "staple"], description: "Flaky multi-layered Kerala porotta" },
  { name: "Wheat Porotta",     category: "BREADS", price: 22, mrp: 28, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["porotta", "wheat", "healthy"], description: "Healthy wheat-flour porotta" },
  { name: "Appam (2 pcs)",     category: "BREADS", price: 30, mrp: 40, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["appam", "kerala"], description: "Soft rice appam with lacy edges (2 pieces)" },
  { name: "Pathiri (2 pcs)",   category: "BREADS", price: 30, mrp: 40, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["pathiri", "malabar"], description: "Thin Malabar rice bread (2 pieces)" },
  { name: "Naan",              category: "BREADS", price: 35, mrp: 45, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["naan", "tandoor"], description: "Soft tandoor-baked naan" },
  { name: "Garlic Naan",       category: "BREADS", price: 45, mrp: 55, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["naan", "garlic", "tandoor"], description: "Garlic-butter topped tandoor naan" },
  { name: "Chapathi",          category: "BREADS", price: 18, mrp: 25, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["chapathi", "healthy"], description: "Soft whole-wheat chapathi" },

  // CHICKEN DISHES
  { name: "Chicken Curry (Kerala style)", category: "CHICKEN DISHES", price: 220, mrp: 260, isVeg: false, isBestseller: false, spiceLevel: "Hot", tags: ["curry", "kerala"], description: "Authentic Kerala chicken curry with coconut milk" },
  { name: "Chicken Mappas",    category: "CHICKEN DISHES", price: 230, mrp: 270, isVeg: false, isBestseller: false, spiceLevel: "Medium", tags: ["mappas", "kerala"], description: "Malabar-style chicken in coconut milk gravy" },
  { name: "Butter Chicken",    category: "CHICKEN DISHES", price: 250, mrp: 290, isVeg: false, isBestseller: false, spiceLevel: "Mild", tags: ["butter", "north-indian"], description: "Creamy tomato-butter chicken gravy" },
  { name: "Chicken Roast",     category: "CHICKEN DISHES", price: 260, mrp: 300, isVeg: false, isBestseller: false, spiceLevel: "Hot", tags: ["roast", "dry", "kerala"], description: "Kerala-style dry-roasted masala chicken" },
  { name: "Chicken Tikka Masala", category: "CHICKEN DISHES", price: 270, mrp: 310, isVeg: false, isBestseller: false, spiceLevel: "Medium", tags: ["tikka", "masala"], description: "Grilled chicken in spiced masala gravy" },
  { name: "Chicken Stew",      category: "CHICKEN DISHES", price: 220, mrp: 260, isVeg: false, isBestseller: false, spiceLevel: "Mild", tags: ["stew", "coconut", "kerala"], description: "Mild Kerala chicken stew in coconut milk gravy" },

  // BEEF & MUTTON
  { name: "Beef Curry (Kerala style)",     category: "BEEF & MUTTON", price: 230, mrp: 270, isVeg: false, isBestseller: false, spiceLevel: "Hot", tags: ["curry", "kerala", "beef"], description: "Classic Kerala beef curry" },
  { name: "Beef Ularthiyathu (dry roast)", category: "BEEF & MUTTON", price: 250, mrp: 290, isVeg: false, isBestseller: false, spiceLevel: "Hot", tags: ["dry", "roast", "kerala", "beef"], description: "Kerala-style dry-roasted beef with coconut" },
  { name: "Mutton Curry",        category: "BEEF & MUTTON", price: 280, mrp: 320, isVeg: false, isBestseller: false, spiceLevel: "Hot", tags: ["curry", "mutton"], description: "Spiced Kerala mutton curry" },
  { name: "Mutton Rogan Josh",   category: "BEEF & MUTTON", price: 300, mrp: 340, isVeg: false, isBestseller: false, spiceLevel: "Medium", tags: ["rogan-josh", "kashmir", "mutton"], description: "Kashmiri-style aromatic mutton curry" },
  { name: "Mutton Stew",         category: "BEEF & MUTTON", price: 260, mrp: 300, isVeg: false, isBestseller: false, spiceLevel: "Mild", tags: ["stew", "coconut", "mutton"], description: "Mild mutton stew in coconut milk — with appam/porotta" },

  // VEG ITEMS
  { name: "Dal Fry",             category: "VEG ITEMS", price: 130, mrp: 160, isVeg: true, isBestseller: false, spiceLevel: "Medium", tags: ["dal", "lentil"], description: "Tempered yellow dal — goes well with rice/biryani" },
  { name: "Paneer Butter Masala", category: "VEG ITEMS", price: 220, mrp: 260, isVeg: true, isBestseller: false, spiceLevel: "Mild", tags: ["paneer", "north-indian"], description: "Creamy North Indian cottage cheese gravy" },
  { name: "Mix Veg Curry",       category: "VEG ITEMS", price: 150, mrp: 180, isVeg: true, isBestseller: false, spiceLevel: "Medium", tags: ["veg", "curry"], description: "Mixed vegetable curry in spiced gravy" },
  { name: "Kadai Paneer",        category: "VEG ITEMS", price: 230, mrp: 270, isVeg: true, isBestseller: false, spiceLevel: "Medium", tags: ["paneer", "kadai"], description: "Stir-fried cottage cheese in bell pepper masala" },
  { name: "Raita",               category: "VEG ITEMS", price: 60, mrp: 80, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["side", "yogurt"], description: "Chilled yogurt with cucumber & coriander" },
  { name: "Pickle (small)",      category: "VEG ITEMS", price: 25, mrp: 35, isVeg: true, isBestseller: false, spiceLevel: "Hot", tags: ["side", "pickle"], description: "Tangy mango or lime pickle — small portion" },
  { name: "Papad",               category: "VEG ITEMS", price: 20, mrp: 30, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["side", "crispy"], description: "Crispy roasted papad" },

  // BEVERAGES
  { name: "Mango Juice",            category: "BEVERAGES", price: 80, mrp: 100, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["juice", "cold"], description: "Fresh mango juice" },
  { name: "Pineapple Juice",        category: "BEVERAGES", price: 80, mrp: 100, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["juice", "cold"], description: "Fresh pineapple juice" },
  { name: "Fresh Lime Soda",        category: "BEVERAGES", price: 60, mrp: 80,  isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["soda", "lime"], description: "Sweet/salty fresh lime soda" },
  { name: "Watermelon Juice",       category: "BEVERAGES", price: 80, mrp: 100, isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["juice", "summer"], description: "Chilled watermelon juice" },
  { name: "Masala Chai",            category: "BEVERAGES", price: 30, mrp: 40,  isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["tea", "hot"], description: "Masala spiced milk tea" },
  { name: "Black Tea",              category: "BEVERAGES", price: 20, mrp: 30,  isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["tea"], description: "Plain black tea" },
  { name: "Soft Drink (Pepsi/7Up)", category: "BEVERAGES", price: 50, mrp: 60,  isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["soda", "cold"], description: "Chilled soft drink of your choice" },
  { name: "Water Bottle (500ml)",   category: "BEVERAGES", price: 20, mrp: 25,  isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["water"], description: "500ml packaged drinking water" },
  { name: "Sulaimani",              category: "BEVERAGES", price: 40, mrp: 55,  isVeg: true, isBestseller: false, spiceLevel: "None", tags: ["tea", "malabar", "post-meal"], description: "Malabar-style black tea with lemon & spices" },
];

export async function POST() {
  try {
    const results = { categories: 0, products: 0, errors: [] };

    // 1. Seed Categories
    const categoryIdMap = {};
    for (const cat of CATEGORIES) {
      try {
        const docRef = await addDoc(collection(db, "categories"), {
          ...cat,
          isActive: true,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "categories", docRef.id), { id: docRef.id });
        categoryIdMap[cat.title] = docRef.id;
        results.categories++;
      } catch (e) {
        results.errors.push(`Category "${cat.title}": ${e.message}`);
      }
    }

    // 2. Seed Products
    for (const product of PRODUCTS) {
      try {
        const categoryId = categoryIdMap[product.category] || "";
        const docRef = await addDoc(collection(db, "products"), {
          name: product.name,
          description: product.description || "",
          category: product.category,
          categoryId,
          price: product.price,
          mrp: product.mrp,
          image: "",
          isVeg: Boolean(product.isVeg),
          isBestseller: Boolean(product.isBestseller),
          isAvailable: true,
          isFeatured: false,
          hidden: false,
          spiceLevel: product.spiceLevel || "Medium",
          portionSlab: null,
          tags: product.tags || [],
          sortOrder: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "products", docRef.id), { id: docRef.id });
        results.products++;
      } catch (e) {
        results.errors.push(`Product "${product.name}": ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ Seeded ${results.categories} categories and ${results.products} products.`,
      errors: results.errors,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
