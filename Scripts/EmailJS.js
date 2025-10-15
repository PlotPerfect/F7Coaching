// EmailJS.js - Centralized Email Handling

// Initialize EmailJS
function initEmailJSWithRetry(retries = 10, delay = 200) {
    if (window.emailjs) {
        emailjs.init("zrhJ7yTsOyxTEd7L7"); // Your EmailJS public key
        console.log("✅ EmailJS Initialized.");
    } else if (retries > 0) {
        console.warn(`EmailJS not loaded yet, retrying in ${delay}ms... (${retries} left)`);
        setTimeout(() => initEmailJSWithRetry(retries - 1, delay), delay);
    } else {
        console.error("❌ EmailJS Not Loaded - Check Script Order or Path.");
    }
}
document.addEventListener("DOMContentLoaded", () => {
    console.log("🔧 DOMContentLoaded Triggered.");
    initEmailJSWithRetry();
});

// Send Confirmation Email (Globally Accessible)
// Send Shop Purchase Confirmation Email (Globally Accessible)
window.sendShopPurchaseEmail = async function(orderId, orders, buyerEmail, cost, extra = {}) {
    try {
        if (!orderId || !orders || !buyerEmail || !cost) {
            console.error("❌ Missing Required Fields for Shop Purchase Email.");
            return;
        }
        // Flatten first order for template variables
        const order = Array.isArray(orders) && orders.length ? orders[0] : {};
        // Compose data for EmailJS template
        let buyerName = order.buyerName || cost.buyerName || '';
        if (!buyerName) buyerName = buyerEmail; // fallback if name not available
        const emailData = {
            order_id: orderId,
            buyerName: buyerName,
            buyerEmail: buyerEmail,
            item: order.name || '',
            price: order.price || '',
            image_url: order.image_url || (cost.image_url || ''),
            size: extra.size || (orders && orders[0] && orders[0].size ? orders[0].size : ''),
            orders: orders,
            cost: cost
        };
        console.log("🚀 Sending Shop Purchase Confirmation Email with EmailJS...", emailData);
        const response = await emailjs.send("service_h0mu3pe", "template_shop_purchase", emailData);
        if (response.status === 200) {
            console.log("✅ Shop Purchase Confirmation Email Sent Successfully:", response.status, response.text);
        } else {
            console.error("❌ Failed to Send Shop Purchase Email:", response.status, response.text);
        }
    } catch (error) {
        console.error("❌ Error in Sending Shop Purchase Email:", error);
    }
};
window.sendConfirmationEmail = async function(playerName, playerAge, parentEmail, parentName, parentNumber, sessionName, sessionDate, sessionTime, sessionLocation) {
    try {
        if (!parentEmail || !playerName || !sessionName || !sessionDate || !sessionTime) {
            console.error("❌ Missing Required Fields for Email.");
            return;
        }
        // Ensure location is a string
        let locationString = '';
        if (typeof sessionLocation === 'string') locationString = sessionLocation;
        else if (sessionLocation && typeof sessionLocation === 'object' && sessionLocation.name) locationString = sessionLocation.name;
        else locationString = String(sessionLocation || '');

        console.log("🚀 Sending Confirmation Email with EmailJS...");
        const response = await emailjs.send("service_h0mu3pe", "template_ltcmr9q", {
            player_name: playerName,
            player_age: playerAge,
            parent_email: parentEmail,
            parent_name: parentName,
            parent_number: parentNumber,
            session_name: sessionName,
            session_date: sessionDate,
            session_time: sessionTime,
            session_location: locationString
        });

        if (response.status === 200) {
            console.log("✅ Confirmation Email Sent Successfully:", response.status, response.text);
        } else {
            console.error("❌ Failed to Send Email:", response.status, response.text);
        }
    } catch (error) {
        console.error("❌ Error in Sending Confirmation Email:", error);
    }
};