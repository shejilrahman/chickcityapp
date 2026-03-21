import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

// POST /api/products/update-categories
// Body: { updates: [{ id: number, category: string }] }
export async function POST(req) {
  try {
    const { updates } = await req.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    await Promise.all(
      updates.map(({ id, category }) =>
        updateDoc(doc(db, "products", id.toString()), { category })
      )
    );

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error) {
    console.error("Failed to update categories in Firestore:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
