import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // 1. Try Firestore first
    const q = query(collection(db, "categories"), orderBy("sortOrder", "asc"));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const categories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return NextResponse.json(categories, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      });
    }

    // 2. Fallback to JSON file if Firestore is empty (legacy data)
    const jsonPath = path.join(process.cwd(), "src", "lib", "tbl_categories.json");
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      const cats = (data.tbl_categories || []).map((c, i) => ({
        id: c.id || String(i),
        title: c.title || c,
        emoji: c.emoji || "🍽️",
        isActive: true,
        sortOrder: i,
      }));
      return NextResponse.json(cats, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      });
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Failed to load categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

