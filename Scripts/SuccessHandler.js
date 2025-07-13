// SuccessHandler.js - Handles Booking Confirmation Display
import { db, ref, get } from './auth.js';
import { confirmBooking } from './CompleteBookingSystem.js';

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
          // Log the exact database path being queried
          console.log("[SuccessHandler] Fetching from path:", `bookings/${groupKey}/${sessionDate}/${bookingId}`);
          // Fetch the booking data first (should be status Pending)
          const bookingRef = ref(db, `bookings/${groupKey}/${sessionDate}/${bookingId}`);
          const snapshot = await get(bookingRef);

          if (snapshot.exists()) {
              const data = snapshot.val();
              const childNameEl = document.getElementById("childName");
              const parentEmailEl = document.getElementById("parentEmail");
              const sessionNameEl = document.getElementById("sessionName");
              const sessionDateEl = document.getElementById("sessionDate");
              const sessionTimeEl = document.getElementById("sessionTime");
              const sessionLocationEl = document.getElementById("sessionLocation");
              if (childNameEl) childNameEl.textContent = data.playerName || "N/A";
              if (parentEmailEl) parentEmailEl.textContent = data.parentEmail || "N/A";
              if (sessionNameEl) sessionNameEl.textContent = data.sessionName || "N/A";
              if (sessionDateEl) sessionDateEl.textContent = data.sessionDate || "N/A";
              if (sessionTimeEl) sessionTimeEl.textContent = data.sessionTime || "N/A";
              if (sessionLocationEl) sessionLocationEl.textContent = data.sessionLocation || data.location || "N/A";

              // Inject dynamic JSON-LD structured data for SEO
              injectDynamicJSONLD(data);

              // Now, confirm the booking and send email in the background
              confirmBooking(bookingId, groupKey, sessionDate);

              // Clear localStorage after use to avoid stale data
              localStorage.removeItem("bookingId");
              localStorage.removeItem("groupKey");
              localStorage.removeItem("sessionDate");
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
