import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET() {
  try {
    const snap = await getDoc(doc(db, "settings", "main"));
    if (!snap.exists()) {
      // Return defaults
      return NextResponse.json({
        shopName: "Noor al Mandi",
        whatsappNumber: "8891930562",
        address: "",
        openingTime: "10:00",
        closingTime: "22:00",
        isOpen: true,
        minOrderAmount: 300,
        deliveryRadius: 5,
        deliveryFee: 0,
        upiId: "",
        logoUrl: "",
      });
    }
    return NextResponse.json(snap.data());
  } catch (error) {
    console.error("Failed to load settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
