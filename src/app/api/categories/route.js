import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  console.log("GET /api/categories called");
  try {
    const jsonPath = path.join(process.cwd(), "src", "lib", "tbl_categories.json");
    console.log("Reading file from:", jsonPath);
    if (!fs.existsSync(jsonPath)) {
        console.error("Categories file not found!");
        return NextResponse.json({ error: "tbl_categories.json not found" }, { status: 404 });
    }
    const data = fs.readFileSync(jsonPath, "utf8");
    const parsedData = JSON.parse(data);
    const categories = parsedData.tbl_categories || [];
    console.log(`Returning ${categories.length} categories`);
    return NextResponse.json(categories, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to load categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
