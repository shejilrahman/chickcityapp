import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(request) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const productRef = doc(db, "products", String(id));
    
    // Convert numeric fields if present
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.mrp !== undefined) updates.mrp = updates.mrp ? Number(updates.mrp) : null;
    if (updates.sortOrder !== undefined) updates.sortOrder = Number(updates.sortOrder);
    
    // Sync 'hidden' with '!isAvailable' for backward compat mapping
    if (updates.isAvailable !== undefined) {
      updates.hidden = !updates.isAvailable;
    }

    updates.updatedAt = new Date();

    await updateDoc(productRef, updates);

    return NextResponse.json({ success: true, updated: updates });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
