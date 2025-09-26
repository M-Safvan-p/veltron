const Product = require("../models/common/productSchema");

async function filterValidCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const productIds = items.map((i) => i?.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: productIds } });

  const productMap = new Map(products.map((p) => [String(p._id), p]));
  const validItems = [];

  for (const item of items) {
    const productId = item.productId?._id || item.productId;
    const product = productMap.get(String(productId));
    if (!product) continue;

    if (!product.isListed || product.productStatus !== "Available") continue;

    const variant = product.variants?.id(item.variantId);
    if (!variant) continue;

    const availableStock = variant.stock ?? 0;
    if (availableStock <= 0) continue;
    if (item.quantity > availableStock) continue;

    const image = variant.images?.[0]?.url || product.images?.[0]?.url || "";

    validItems.push({
      productId: product._id,
      vendorId: product.vendorId,
      productName: product.name,
      quantity: item.quantity > 0 ? item.quantity : 1,
      price: Number(product.price) || 0,
      discountedPrice: Number(product.discountedPrice ?? product.price) || 0,
      image,
      selectedColor: variant.color || item.selectedColor || null,
      variantId: String(variant._id),
    });
  }

  return validItems;
}

module.exports = { filterValidCartItems };
