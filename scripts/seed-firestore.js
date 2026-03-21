/**
 * One-time seed script: uploads products.json → Firestore "products" collection.
 *
 * Prerequisites:
 *   1. firebase-admin is installed as devDependency (already done).
 *   2. Set the env variable before running:
 *        $env:GOOGLE_APPLICATION_CREDENTIALS="D:\palathingal store grocery app secrets\grocery-app-ab774-firebase-adminsdk-fbsvc-b6ea0796a0.json"
 *
 * Usage (from project root):
 *   node scripts/seed-firestore.js
 */

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

// ─── Init Firebase Admin ───────────────────────────────────────────────────
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "❌  GOOGLE_APPLICATION_CREDENTIALS env variable is not set.\n" +
    '    e.g.  $env:GOOGLE_APPLICATION_CREDENTIALS="D:\\path\\to\\key.json"'
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
}

const db = getFirestore();

// ─── Load products.json ────────────────────────────────────────────────────
const productsPath = path.join(__dirname, "..", "src", "lib", "products.json");
if (!fs.existsSync(productsPath)) {
  console.error("❌  products.json not found at:", productsPath);
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
console.log(`📦  Loaded ${products.length} products from products.json`);

// ─── Batch Upload ──────────────────────────────────────────────────────────
const BATCH_SIZE = 400; // Firestore max is 500 per batch

async function seedProducts() {
  let totalUploaded = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const chunk = products.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    chunk.forEach((product) => {
      const docId = product.id.toString();
      const docRef = db.collection("products").doc(docId);
      batch.set(docRef, product);
    });

    await batch.commit();
    totalUploaded += chunk.length;
    console.log(`  ✅  Uploaded ${totalUploaded} / ${products.length} products...`);
  }

  console.log(`\n🎉  Done! Seeded ${totalUploaded} products into Firestore collection "products".`);
  process.exit(0);
}

seedProducts().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
