import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(request) {
  try {
    const { id, name, price, mrp, image } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const productRef = doc(db, "products", String(id));
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = Number(price);
    if (mrp !== undefined) updates.mrp = Number(mrp);
    if (image !== undefined) updates.image = image;

    await updateDoc(productRef, updates);

    return NextResponse.json({ success: true, updated: updates });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
