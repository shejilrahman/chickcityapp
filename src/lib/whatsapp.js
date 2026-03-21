export const generateWhatsAppMessage = (items, total, name, phone, location) => {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8891930562";
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || "Palathingal Stores";

  let message = `🛒 *New Order*\n\n`;

  items.forEach(item => {
    // Assuming each item has: name, unit, price, and quantity
    const itemTotal = item.price * item.quantity;
    message += `• ${item.name} (${item.unit}) x ${item.quantity} — ₹${itemTotal}\n`;
  });

  message += `\n*Total: ₹${total}*\n\n`;
  message += `👤 Name: ${name}\n`;
  message += `📞 Phone: ${phone}\n`;
  
  if (location) {
    message += `📍 Location: ${location}\n\n`;
  } else {
    message += `\n`;
  }

  message += `_Sent via ${shopName} App_`;

  const encodedMessage = encodeURIComponent(message);
  
  // Strip any non-digit characters from the configured number
  const cleanNumber = number.replace(/\D/g, '');
  
  // Ensure the Indian country code (91) is prefixed if the number is exactly 10 digits
  const formattedNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;

  return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
};
