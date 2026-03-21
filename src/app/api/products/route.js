import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// ISR: Vercel caches this route and regenerates it at most once every 60s
export const revalidate = 60;

export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    const products = snapshot.docs.map((doc) => doc.data());

    // Sort alphabetically by name
    products.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to load products from Firestore:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
