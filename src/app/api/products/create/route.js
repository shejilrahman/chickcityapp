import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name, description, category, categoryId,
      price, mrp, image, isVeg, isBestseller,
      spiceLevel, portionSlab, tags, sortOrder, isAvailable
    } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const newProduct = {
      name: name.trim(),
      description: description || "",
      category: category || "",
      categoryId: categoryId || "",
      price: Number(price),
      mrp: mrp ? Number(mrp) : Number(price),
      image: image || "",
      isVeg: Boolean(isVeg),
      isBestseller: Boolean(isBestseller),
      isFeatured: false,
      isAvailable: isAvailable !== false,
      hidden: isAvailable === false,
      spiceLevel: spiceLevel || "Medium",
      portionSlab: portionSlab || null,
      tags: tags || [],
      sortOrder: sortOrder ? Number(sortOrder) : 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "products"), newProduct);

    // Also update the doc with its own id
    const { updateDoc, doc } = await import("firebase/firestore");
    await updateDoc(doc(db, "products", docRef.id), { id: docRef.id });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
