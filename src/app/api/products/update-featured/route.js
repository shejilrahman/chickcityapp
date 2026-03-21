import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

// POST /api/products/update-featured
// Body: { updates: [{ id: number, featured: boolean }] }
export async function POST(req) {
  try {
    const { updates } = await req.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates array is required" }, { status: 400 });
    }

    await Promise.all(
      updates.map(({ id, featured }) =>
        updateDoc(doc(db, "products", id.toString()), { featured })
      )
    );

    return NextResponse.json({ success: true, modifiedCount: updates.length });
  } catch (error) {
    console.error("Failed to update featured products in Firestore:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
