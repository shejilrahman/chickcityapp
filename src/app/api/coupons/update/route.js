import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

export async function POST(request) {
  try {
    const { id, action, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    if (action === "delete") {
      await deleteDoc(doc(db, "coupons", String(id)));
      return NextResponse.json({ success: true, action: "deleted" });
    }

    const allowed = ["code", "discountType", "discountValue", "minOrderAmount", "maxUses", "isActive", "expiresAt"];
    const sanitized = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) sanitized[key] = updates[key];
    }

    if (sanitized.code) sanitized.code = sanitized.code.trim().toUpperCase();
    if (sanitized.discountValue !== undefined) sanitized.discountValue = Number(sanitized.discountValue);
    if (sanitized.minOrderAmount !== undefined) sanitized.minOrderAmount = Number(sanitized.minOrderAmount);
    if (sanitized.expiresAt) sanitized.expiresAt = new Date(sanitized.expiresAt);

    await updateDoc(doc(db, "coupons", String(id)), sanitized);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update coupon:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
