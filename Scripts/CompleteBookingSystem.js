// CompleteBookingSystem.js - Optimized Booking System
import { db, ref, update, get } from './auth.js';

// Confirm Booking Function
export async function confirmBooking(bookingId, groupKey, sessionDate) {
    try {
        const bookingRef = ref(db, `bookings/${groupKey}/${sessionDate}/${bookingId}`);
        await update(bookingRef, { status: "Confirmed" });

        console.log("✅ Booking Confirmed in Firebase.");

        // Send confirmation email in the background (do not await)
        get(bookingRef).then(snapshot => {
            const bookingData = snapshot.val();
            if (bookingData) {
                if (window.sendConfirmationEmail) {
                    window.sendConfirmationEmail(
                        bookingData.playerName,
                        bookingData.playerAge,
                        bookingData.parentEmail,
                        bookingData.parentName,
                        bookingData.parentNumber,
                        bookingData.sessionName,
                        bookingData.sessionDate,
                        bookingData.sessionTime,
                        bookingData.sessionLocation
                    );
                } else {
                    console.error("❌ sendConfirmationEmail is not defined on window.");
                }
            }
        });
    } catch (error) {
        console.error("❌ Error confirming booking:", error);
    }
}
