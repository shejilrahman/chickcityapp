import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { id, stockCount, delta } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    const docRef = doc(db, "products", id);

    // If delta is provided, fetch current and add
    if (delta !== undefined) {
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      const current = snap.data().stockCount !== undefined ? snap.data().stockCount : 999;
      const newStock = Math.max(0, current + delta);
      await updateDoc(docRef, { stockCount: newStock });
      return NextResponse.json({ success: true, stockCount: newStock });
    }

    // Otherwise absolute set
    if (stockCount === undefined || typeof stockCount !== "number") {
      return NextResponse.json({ error: "Missing or invalid stockCount" }, { status: 400 });
    }

    const finalStock = Math.max(0, stockCount);

    await updateDoc(docRef, { stockCount: finalStock });

    return NextResponse.json({ success: true, stockCount: finalStock });
  } catch (error) {
    console.error("Failed to update stock:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
