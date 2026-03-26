export const generateWhatsAppMessage = (items, total, name, phone, location, landmark, paymentStatus = "") => {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8089551181";
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || "Noor al Mandi";

  let message = `🍗 *New Order - ${shopName}*\n\n`;

  items.forEach(item => {
    const itemTotal = (item.price * (item.quantity || 1)).toFixed(2);
    const unitPart = (item.unit && String(item.unit) !== "undefined") ? ` (${item.unit})` : "";
    message += `• ${item.name}${unitPart} x ${item.quantity || 1} — ₹${itemTotal}\n`;
  });

  message += `\n*Total: ₹${total}*\n\n`;
  message += `👤 Name: ${name}\n`;
  message += `📞 Phone: ${phone}\n`;
  
  if (location) {
    message += `📍 Address: ${location}\n`;
  }
  if (landmark) {
    message += `🏢 Landmark: ${landmark}\n`;
  }

  if (paymentStatus) {
    message += `\n💳 *Payment Status: ${paymentStatus}*\n`;
  }

  message += `\n_Sent via ${shopName} App_`;

  const encodedMessage = encodeURIComponent(message);
  
  // Strip any non-digit characters from the configured number
  const cleanNumber = number.replace(/\D/g, '');
  
  // Ensure the Indian country code (91) is prefixed if the number is exactly 10 digits
  const formattedNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;

  return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
};
