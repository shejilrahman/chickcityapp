import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteField } from "firebase/firestore";

// POST /api/products/update-weight-slab
// Body: { updates: [{ id, weightSlab }] }
// weightSlab can be null/undefined to remove the slab from a product.
export async function POST(req) {
  try {
    const { updates } = await req.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "updates array is required" }, { status: 400 });
    }

    await Promise.all(
      updates.map(({ id, weightSlab }) =>
        updateDoc(doc(db, "products", id.toString()), {
          weightSlab: weightSlab || deleteField(),
        })
      )
    );

    return NextResponse.json({ success: true, modifiedCount: updates.length });
  } catch (error) {
    console.error("Failed to update weight slabs in Firestore:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
