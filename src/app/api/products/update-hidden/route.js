import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

// POST /api/products/update-hidden
// Body: { updates: [{ id: number, hidden: boolean }] }
export async function POST(req) {
  try {
    const { updates } = await req.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates array is required" }, { status: 400 });
    }

    await Promise.all(
      updates.map(({ id, hidden }) =>
        updateDoc(doc(db, "products", String(id)), { 
          hidden: !!hidden,
          isAvailable: !hidden,
          updatedAt: new Date(),
        })
      )
    );

    return NextResponse.json({ success: true, modifiedCount: updates.length });
  } catch (error) {
    console.error("Failed to update hidden status in Firestore:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
