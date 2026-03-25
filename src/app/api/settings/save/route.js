import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST(request) {
  try {
    const settings = await request.json();

    // Sanitize and type-cast
    const clean = {
      shopName: settings.shopName || "ABC ",
      whatsappNumber: settings.whatsappNumber || "",
      address: settings.address || "",
      openingTime: settings.openingTime || "10:00",
      closingTime: settings.closingTime || "22:00",
      isOpen: Boolean(settings.isOpen),
      minOrderAmount: Number(settings.minOrderAmount) || 300,
      deliveryRadius: Number(settings.deliveryRadius) || 5,
      deliveryFee: Number(settings.deliveryFee) || 0,
      upiId: settings.upiId || "",
      logoUrl: settings.logoUrl || "",
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "settings", "main"), clean);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
