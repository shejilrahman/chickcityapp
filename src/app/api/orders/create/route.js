import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, runTransaction, collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
  try {
    const { name, phone, location, landmark, cart, total } = await req.json();

    if (!name || !phone || !location || !cart || cart.length === 0) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }

    let orderId = null;

    // Run a transaction to safely decrement stock 
    await runTransaction(db, async (transaction) => {
      // 1. Read all required products
      const productDocs = {};
      for (const item of cart) {
        if (!item.id) continue;
        const ref = doc(db, "products", item.id);
        const snap = await transaction.get(ref);
        if (!snap.exists()) {
          throw new Error(`Product ${item.name} no longer exists.`);
        }
        productDocs[item.id] = { ref, data: snap.data() };
      }

      // 2. Validate stock
      for (const item of cart) {
        if (!item.id) continue; // Safety check
        const pData = productDocs[item.id].data;
        const currentStock = pData.stockCount !== undefined ? pData.stockCount : 999;
        
        if (currentStock < item.quantity) {
          throw new Error(`Only ${currentStock} left of ${item.name}. Please reduce quantity.`);
        }
      }

      // 3. Write new stock counts
      for (const item of cart) {
        if (!item.id) continue;
        const { ref, data } = productDocs[item.id];
        const currentStock = data.stockCount !== undefined ? data.stockCount : 999;
        const newStock = Math.max(0, currentStock - item.quantity);
        transaction.update(ref, { stockCount: newStock });
      }

      // 4. Create the Order document
      // Note: We can't do addDoc inside runTransaction directly (it requires a pre-generated doc ref),
      // so we create a new doc ref in the orders collection.
      const newOrderRef = doc(collection(db, "orders"));
      transaction.set(newOrderRef, {
        customerName: name || "",
        customerPhone: phone || "",
        customerLocation: location || "",
        customerLandmark: landmark || "",
        items: cart.map(item => ({
          ...item,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1
        })),
        total: Number(total) || 0,
        status: "pending",
        timestamp: serverTimestamp(),
      });
      
      orderId = newOrderRef.id;
    });

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("Order Transaction Failed:", error);
    // Return a 400 if it's a designated stock error we threw
    const status = error.message.includes("left of") || error.message.includes("no longer exists") ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
