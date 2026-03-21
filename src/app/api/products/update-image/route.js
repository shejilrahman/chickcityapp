import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

// POST /api/products/update-image
// Body: { id: number, image: string (base64 data URL) }
export async function POST(req) {
  try {
    const { id, image } = await req.json();

    if (!id || !image) {
      return NextResponse.json({ error: "ID and image are required" }, { status: 400 });
    }

    // 1. Save image to public directory
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const publicDir = path.join(process.cwd(), "public", "product-images");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const fileName = `${id}.jpg`;
    const filePath = path.join(publicDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const imagePath = `/product-images/${fileName}`;

    // 2. Update image field in Firestore
    await updateDoc(doc(db, "products", id.toString()), { image: imagePath });

    return NextResponse.json({ success: true, path: imagePath });
  } catch (error) {
    console.error("Failed to update product image in Firestore:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
