import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export async function GET() {
  try {
    const q = query(collection(db, "categories"), orderBy("sortOrder", "asc"));
    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to load categories from Firestore:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
