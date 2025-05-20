// SuccessHandler.js - Handles Booking Confirmation Display
import { db, ref, get } from './auth.js';

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let bookingId = urlParams.get("bookingId");
  let groupKey = urlParams.get("groupKey");
  let sessionDate = urlParams.get("sessionDate");

  // Fallback to Local Storage
  if (!bookingId) bookingId = localStorage.getItem("bookingId");
  if (!groupKey) groupKey = localStorage.getItem("groupKey");
  if (!sessionDate) sessionDate = localStorage.getItem("sessionDate");

  console.log("✅ Booking Details:", { bookingId, groupKey, sessionDate });

  if (bookingId && groupKey && sessionDate) {
      try {
          const bookingRef = ref(db, `bookings/${groupKey}/${sessionDate}/${bookingId}`);
          const snapshot = await get(bookingRef);

          if (snapshot.exists()) {
              const data = snapshot.val();
              document.getElementById("childName").textContent = data.playerName || "N/A";
              document.getElementById("parentEmail").textContent = data.parentEmail || "N/A";
              document.getElementById("sessionName").textContent = data.sessionName || "N/A";
              document.getElementById("sessionDate").textContent = data.sessionDate || "N/A";
              document.getElementById("sessionTime").textContent = data.sessionTime || "N/A";

              // Inject dynamic JSON-LD structured data for SEO
              injectDynamicJSONLD(data);

              // Send Confirmation Email Automatically
              sendConfirmationEmail(
                data.playerName,
                data.parentEmail,
                data.sessionName,
                data.sessionDate,
                data.sessionTime
              );
          } else {
              displayError("❌ Booking data could not be loaded. Please contact support.");
          }
      } catch (error) {
          console.error("❌ Error loading booking data:", error);
          displayError("❌ Error loading booking data.");
      }
  } else {
      displayError("❌ Invalid URL. No booking data found.");
  }
});

// Function to display error message
function displayError(message) {
  document.querySelector(".success-container").innerHTML = `
      <h2>❌ Error!</h2>
      <p>${message}</p>
      <a href="index.html" class="return-btn">Return to Homepage</a>
  `;
}

// Inject dynamic JSON-LD structured data into the head
function injectDynamicJSONLD(data) {
  if (!data) return;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EventReservation",
    "reservationStatus": "https://schema.org/ReservationConfirmed",
    "underName": {
      "@type": "Person",
      "name": data.playerName || "N/A"
    },
    "provider": {
      "@type": "SportsActivityLocation",
      "name": "F7 Coaching",
      "url": "https://www.f7coaching.com"
    },
    "reservationFor": {
      "@type": "Event",
      "name": data.sessionName || "Football Coaching Session",
      "startDate": data.sessionDate || ""
    },
    "email": data.parentEmail || undefined,
    "startTime": data.sessionTime || undefined
  };
  // Remove undefined fields
  Object.keys(jsonLd).forEach(key => (jsonLd[key] === undefined) && delete jsonLd[key]);
  if (jsonLd.reservationFor) {
    Object.keys(jsonLd.reservationFor).forEach(key => (jsonLd.reservationFor[key] === undefined) && delete jsonLd.reservationFor[key]);
  }
  // Inject into the placeholder script tag
  const script = document.getElementById('dynamic-jsonld');
  if (script) {
    script.textContent = JSON.stringify(jsonLd, null, 2);
  }
}
