
// Import Firebase functions from auth.js
import { db, ref, set, get } from './auth.js';


// Map item names to image URLs
const itemImages = {
  'F7 Jacket & Joggers': 'Images/1.webp',
  'F7 Shorts & T-Shirt': 'Images/3.webp',
};

// Read order details from sessionStorage
let orderDetails = null;
try {
  orderDetails = JSON.parse(sessionStorage.getItem('shopOrder'));
} catch (e) {
  orderDetails = null;
}

// Fallback for direct access
if (!orderDetails) {
  orderDetails = {
    order_id: 'ORDER-' + Date.now(),
    buyerName: 'Unknown',
    buyerEmail: 'Unknown',
    item: 'Unknown',
    price: 'Unknown',
    image_url: ''
  };
}

// Add image_url to orderDetails
orderDetails.image_url = itemImages[orderDetails.item] ? window.location.origin + '/' + itemImages[orderDetails.item] : '';

// Save order to Firebase under 'shop' node
async function saveOrderToFirebase() {
  const orderData = {
    orderId: orderDetails.order_id,
    buyerName: orderDetails.buyerName,
    buyerEmail: orderDetails.buyerEmail,
    item: orderDetails.item,
    price: orderDetails.price,
    image_url: orderDetails.image_url,
    timestamp: Date.now()
  };
  try {
    await set(ref(db, `shop/${orderData.orderId}`), orderData);
    console.log('✅ Shop order saved to Firebase:', orderData);
  } catch (err) {
    console.error('❌ Error saving shop order to Firebase:', err);
  }
}

// Fetch order from Firebase and render details
async function renderOrderDetailsFromFirebase() {
  try {
    const snapshot = await get(ref(db, `shop/${orderDetails.order_id}`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      let html = `<div><strong>Order #${data.orderId}</strong></div>`;
      html += `<div><strong>Name:</strong> ${data.buyerName}</div>`;
      html += `<div><strong>Email:</strong> ${data.buyerEmail}</div>`;
      html += `<div><strong>Item:</strong> ${data.item}</div>`;
      html += `<div><strong>Price:</strong> £${data.price}</div>`;
      if (data.image_url) {
        html += `<div style='margin:12px 0;'><img src='${data.image_url}' alt='${data.item}' style='max-width:120px;border-radius:8px;'></div>`;
      }
      html += `<div style=\"margin-top:16px;color:#999;font-size:14px;\">Orders are to be collected at your next session when available.</div>`;
      document.getElementById('orderDetails').innerHTML = html;
    } else {
      document.getElementById('orderDetails').innerHTML = '<div>Order not found.</div>';
    }
  } catch (err) {
    document.getElementById('orderDetails').innerHTML = '<div>Error loading order details.</div>';
    console.error('❌ Error fetching shop order from Firebase:', err);
  }
}

// Wait for EmailJS initialization before sending confirmation email
function waitForEmailJSAndSend(retries = 15, delay = 200) {
  if (typeof sendShopPurchaseEmail === 'function' && window.emailjs) {
    sendShopPurchaseEmail(
      orderDetails.order_id,
      [{ name: orderDetails.item, units: 1, price: orderDetails.price, image_url: orderDetails.image_url, buyerName: orderDetails.buyerName }],
      orderDetails.buyerEmail,
      { total: orderDetails.price, image_url: orderDetails.image_url, buyerName: orderDetails.buyerName }
    );
  } else if (retries > 0) {
    console.warn(`EmailJS not ready, retrying in ${delay}ms... (${retries} left)`);
    setTimeout(() => waitForEmailJSAndSend(retries - 1, delay), delay);
  } else {
    console.error('sendShopPurchaseEmail or EmailJS is not available. Make sure EmailJS.js is loaded and initialized before shopSuccess.js.');
  }
}

// Main flow
(async () => {
  await saveOrderToFirebase();
  await renderOrderDetailsFromFirebase();
  setTimeout(() => waitForEmailJSAndSend(), 300); // Small initial delay to allow initialization
})();
