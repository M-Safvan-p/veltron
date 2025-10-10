function calculateTotalAmount(cart, taxRate = 0.18) {
  if (!cart || !Array.isArray(cart.items)) {
    return { subtotal: 0, tax: 0, total: 0 };
  }

  const subtotal = cart.items.reduce((sum, item) => {
    return sum + Number(item.discountedPrice) * Number(item.quantity);
  }, 0);

  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  return { subtotal, total, tax };
}

function calculateCommission(total) {
  const commission = total * 0.1;
  const vendorEarnings = total - commission;

  return { commission, vendorEarnings };
}
module.exports = {
  calculateTotalAmount,
  calculateCommission,
};
