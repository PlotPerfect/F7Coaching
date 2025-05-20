// CompleteBookingSystem.js - Optimized Booking System
import { db, ref, update, get } from './auth.js';
import { sendConfirmationEmail } from './EmailJS.js';

// Confirm Booking Function
export async function confirmBooking(bookingId, groupKey, sessionDate) {
    try {
        const bookingRef = ref(db, `bookings/${groupKey}/${sessionDate}/${bookingId}`);
        await update(bookingRef, { status: "Confirmed" });

        console.log("✅ Booking Confirmed in Firebase.");

        // Fetch booking details for email
        const snapshot = await get(bookingRef);
        const bookingData = snapshot.val();
        if (!bookingData) throw new Error("❌ Booking data not found.");

        // Send confirmation email
        await sendConfirmationEmail(
            bookingData.playerName,
            bookingData.parentEmail,
            bookingData.sessionName,
            bookingData.sessionDate,
            bookingData.sessionTime
        );
    } catch (error) {
        console.error("❌ Error confirming booking:", error);
    }
}
