import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

export async function POST(request) {
  try {
    const { title, emoji, description, sortOrder, isActive, imageUrl } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Category title is required" }, { status: 400 });
    }

    const newCategory = {
      title: title.trim().toUpperCase(),
      emoji: emoji || "🍽️",
      description: description || "",
      sortOrder: sortOrder ? Number(sortOrder) : 0,
      isActive: isActive !== false,
      imageUrl: imageUrl || "",
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "categories"), newCategory);
    await updateDoc(doc(db, "categories", docRef.id), { id: docRef.id });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
