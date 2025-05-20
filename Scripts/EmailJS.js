// EmailJS.js - Centralized Email Handling

// Initialize EmailJS
document.addEventListener("DOMContentLoaded", () => {
    console.log("🔧 DOMContentLoaded Triggered.");

    if (window.emailjs) {
        emailjs.init("zrhJ7yTsOyxTEd7L7"); // Replace with your correct EmailJS public key
        console.log("✅ EmailJS Initialized.");
    } else {
        console.error("❌ EmailJS Not Loaded - Check Script Order or Path.");
    }
});

// Send Confirmation Email (Globally Accessible)
window.sendConfirmationEmail = async function(playerName, parentEmail, sessionName, sessionDate, sessionTime) {
    try {
        if (!parentEmail || !playerName || !sessionName || !sessionDate || !sessionTime) {
            console.error("❌ Missing Required Fields for Email.");
            return;
        }

        console.log("🚀 Sending Confirmation Email with EmailJS...");
        const response = await emailjs.send("service_h0mu3pe", "template_ltcmr9q", {
            player_name: playerName,
            parent_email: parentEmail,
            session_name: sessionName,
            session_date: sessionDate,
            session_time: sessionTime
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