import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(request) {
  try {
    const { id, isAvailable } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await updateDoc(doc(db, "products", String(id)), {
      isAvailable: Boolean(isAvailable),
      hidden: !Boolean(isAvailable), // keep backward compat
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to toggle availability:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
