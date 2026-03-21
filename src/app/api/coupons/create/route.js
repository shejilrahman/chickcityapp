import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

export async function POST(request) {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = await request.json();

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ error: "code, discountType and discountValue are required" }, { status: 400 });
    }

    const newCoupon = {
      code: code.trim().toUpperCase(),
      discountType, // "percent" | "flat"
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxUses: maxUses ? Number(maxUses) : null, // null = unlimited
      usedCount: 0,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "coupons"), newCoupon);
    await updateDoc(doc(db, "coupons", docRef.id), { id: docRef.id });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Failed to create coupon:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
