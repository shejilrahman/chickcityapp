import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export async function GET() {
  try {
    const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const coupons = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Serialize Firestore timestamps
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || null,
    }));
    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Failed to list coupons:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
