import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(request) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    // Sanitize updates
    const allowed = ["title", "emoji", "description", "sortOrder", "isActive", "imageUrl"];
    const sanitized = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) sanitized[key] = updates[key];
    }

    if (sanitized.title) sanitized.title = sanitized.title.trim().toUpperCase();
    if (sanitized.sortOrder !== undefined) sanitized.sortOrder = Number(sanitized.sortOrder);

    await updateDoc(doc(db, "categories", String(id)), sanitized);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
