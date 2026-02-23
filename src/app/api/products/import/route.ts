import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface ProductImportData {
  name: string;
  description?: string;
  price?: number | string;
  category?: string;
  unit?: string;
  sku?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { products } = body as { products: ProductImportData[] };

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun produit à importer" },
        { status: 400 }
      );
    }

    // Validate and transform products
    const validProducts = [];
    const errors: string[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      if (!product.name || product.name.trim() === "") {
        errors.push(`Ligne ${i + 1}: Le nom est requis`);
        continue;
      }

      // Generate SKU if not provided
      const sku = product.sku?.trim() || `SKU-${Date.now()}-${i + 1}`;

      // Validate price
      let price = null;
      if (product.price !== undefined && product.price !== null) {
        const priceValue = typeof product.price === 'string' ? product.price.replace(",", ".") : String(product.price);
        const parsedPrice = parseFloat(priceValue);
        if (isNaN(parsedPrice)) {
          errors.push(`Ligne ${i + 1}: Prix invalide`);
          continue;
        }
        price = parsedPrice;
      }

      // Find or create category
      let categoryId = null;
      if (product.category && product.category.trim() !== "") {
        const categoryName = product.category.trim();
        
        // Try to find existing category
        let category = await prisma.productCategory.findFirst({
          where: { name: categoryName },
        });

        // Create if doesn't exist
        if (!category) {
          category = await prisma.productCategory.create({
            data: {
              name: categoryName,
              slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            },
          });
        }
        categoryId = category.id;
      }

      validProducts.push({
        sku,
        name: product.name.trim(),
        description: product.description?.trim() || null,
        price,
        categoryId,
        unit: product.unit?.trim() || "piece",
        status: "active",
        stock: 0,
        taxRate: 20,
      });
    }

    if (validProducts.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Aucun produit valide à importer",
          details: errors 
        },
        { status: 400 }
      );
    }

    // Insert products in batch
    const created = await prisma.product.createMany({
      data: validProducts,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      imported: created.count,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Product import error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'import" },
      { status: 500 }
    );
  }
}
