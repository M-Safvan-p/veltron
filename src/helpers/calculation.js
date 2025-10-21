function calculateTotalAmount(cart, coupon = null, taxRate = 0.18) {
  if (!cart || !Array.isArray(cart.items)) {
    return { subtotal: 0, discount: 0, tax: 0, total: 0 };
  }

  // subtotal
  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += Number(item.discountedPrice) * Number(item.quantity);
  }

  // coupon discount
  let discount = 0;
  if (coupon && coupon > 0 && coupon <= 100) {
    discount = (subtotal * coupon) / 100;
  }

  // price after applying coupon
  const priceAfterDiscount = subtotal - discount;

  // tax
  const tax = Math.round(priceAfterDiscount * taxRate);

  // total
  const total = priceAfterDiscount + tax + 50; // 50 shipping charge

  return { total, subtotal, tax, discount };
}

function calculateCommission(total) {
  const commission = total * 0.1; // 10%
  const vendorEarnings = total - commission;

  return { commission, vendorEarnings };
}

function calculateProductTotal(product, couponDiscount = 0, taxRate = 0.18) {
  // Calculate product subtotal
  const subtotal = Number(product.discountedPrice) * Number(product.quantity);
  let discount = 0;
  if (couponDiscount && couponDiscount > 0 && couponDiscount <= 100) {
    discount = (subtotal * couponDiscount) / 100;
  }
  const priceAfterDiscount = subtotal - discount;

  const tax = Math.round(priceAfterDiscount * taxRate);
  // Final total
  const total = priceAfterDiscount + tax;

  return { total, subtotal, tax, discount };
}

module.exports = {
  calculateTotalAmount,
  calculateCommission,
  calculateProductTotal,
};
