import { db, ref, onValue, push, set, get } from './auth.js';


// Elements
const elements = {
  sessionTypeSelect: document.getElementById("sessionType"),
  sessionDateInput: document.getElementById("sessionDate"),
  sessionTimeInput: document.getElementById("sessionTime"),
  bookingForm: document.getElementById("bookingForm"),
  bookingMessage: document.getElementById("bookingMessage"),
};

// Stripe Payment Links
const stripePaymentLinks = {
  "U10_U12": "https://book.stripe.com/test_14AfZhc804nk8wDaLf3AY0d",
  "U11_U12": "https://book.stripe.com/3cI7sLb3Z49c32fapXao805",
  "U12_U15_Advanced": "https://book.stripe.com/00w4gz5JFaxAgT5gOlao804",
  "U13_U15": "https://book.stripe.com/eVqeVddc78psdGTcy5ao803",
  "U7_U8": "https://book.stripe.com/aFa14n2xt49c46jdC9ao802",
  "U9_U10": "https://book.stripe.com/8x2bJ19ZV358eKXapXao801",
  "U9_U11_Advanced": "https://book.stripe.com/6oU4gz9ZVgVY6ereGdao800",
};

// Global session data
let liveScheduleData = {};

// Initialize the app


// Load schedule from Firebase
function loadSchedule() {
  const scheduleRef = ref(db, "schedule");
  onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    populateSessionOptions(data);
  });
}

// Populate session options in the dropdown
function populateSessionOptions(scheduleData) {
  elements.sessionTypeSelect.innerHTML = '<option value="">Select Session Type</option>';
  liveScheduleData = scheduleData;

  Object.entries(scheduleData).forEach(([key, session]) => {
    const locationString = session.location ? (typeof session.location === 'string' ? session.location : session.location.name || '') : '';
    const option = document.createElement("option");
    option.value = key;
    option.textContent = `${session.groupName} — ${session.time}${locationString ? ` (${locationString})` : ''}`;
    elements.sessionTypeSelect.appendChild(option);
  });
}

// Handle session type selection
elements.sessionTypeSelect.addEventListener("change", async () => {
  const groupKey = elements.sessionTypeSelect.value;
  if (!groupKey) return;

  const session = liveScheduleData[groupKey];
  if (!session) return;

  autofillSessionTime(session.time);
  const dayName = extractDayName(session.time);
  await updateDatePicker(groupKey, dayName);

  // If a date is already selected, update spots for that date
  await updateBookingMessageForDate();
});

// Autofill session time
function autofillSessionTime(sessionTime) {
  const match = sessionTime.match(/at\s(\d{1,2}:\d{2}[ap]m)/i);
  if (match) {
    elements.sessionTimeInput.value = match[1];
    elements.sessionTimeInput.setAttribute("readonly", true);
    elements.sessionTimeInput.disabled = true;
  }
}

// Extract day name from session time
function extractDayName(sessionTime) {
  const match = sessionTime.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
  return match ? match[0].toLowerCase() : null;
}

// Update date picker with Flatpickr
function updateDatePicker(groupKey, allowedDay) {
  // FIX: Use correct path for bookings
  const bookingsRef = ref(db, `bookings/${groupKey}`);
  get(bookingsRef).then((snapshot) => {
    const data = snapshot.val();
    const fullyBookedDates = [];

    if (data) {
      Object.keys(data).forEach((dateKey) => {
        if (Object.keys(data[dateKey]).length >= 15) {
          fullyBookedDates.push(dateKey.split("_")[0]);
        }
      });
    }

    flatpickr("#sessionDate", {
      dateFormat: "Y-m-d",
      minDate: "today",
      disable: [
        (date) => {
          const dateString = date.toISOString().split("T")[0];
          if (fullyBookedDates.includes(dateString)) return true;
          return allowedDay
            ? date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() !== allowedDay
            : false;
        },
      ],
    });
  });
}

// Get available spots for a session on a specific date
async function getAvailableSpots(groupKey, sessionDate) {
  if (!groupKey || !sessionDate) return 15;
  const bookingsRef = ref(db, `bookings/${groupKey}/${sessionDate}`);
  const snapshot = await get(bookingsRef);
  const data = snapshot.val();
  let confirmedCount = 0;
  if (data) {
    Object.values(data).forEach(booking => {
      if (booking.status === "Confirmed") confirmedCount++;
    });
  }
  return 15 - confirmedCount;
}

// Update booking message based on available spots for selected date
async function updateBookingMessageForDate() {
  const groupKey = elements.sessionTypeSelect.value;
  const sessionDate = elements.sessionDateInput.value;
  if (!groupKey || !sessionDate) return;
  const spotsLeft = await getAvailableSpots(groupKey, sessionDate);
  updateBookingMessage(spotsLeft);
}

// Listen for date changes to update spots left
if (elements.sessionDateInput) {
  elements.sessionDateInput.addEventListener("change", updateBookingMessageForDate);
}

// Update booking message based on available spots
function updateBookingMessage(spotsLeft) {
  if (spotsLeft <= 0) {
    elements.bookingMessage.textContent = "❌ No spaces left for this session.";
    elements.bookingForm.querySelector("button[type='submit']").disabled = true;
  } else {
    elements.bookingMessage.textContent = `✅ ${spotsLeft} spots left.`;
    elements.bookingForm.querySelector("button[type='submit']").disabled = false;
  }
}

elements.bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  elements.bookingMessage.textContent = "";

  const playerName = document.getElementById("playerName").value;
  const parentEmail = document.getElementById("parentEmail").value;
  const groupKey = elements.sessionTypeSelect.value;
  const sessionDate = elements.sessionDateInput.value;

  if (!playerName || !parentEmail || !groupKey || !sessionDate) {
    elements.bookingMessage.textContent = "❌ Please complete all booking details.";
    return;
  }

  // Fetch latest session details from Firebase
  const sessionRef = ref(db, `schedule/${groupKey}`);
  const sessionSnap = await get(sessionRef);
  const sessionData = sessionSnap.val();
  if (!sessionData) {
    elements.bookingMessage.textContent = "❌ Session details not found. Please try again.";
    return;
  }
  const sessionName = sessionData.groupName;
  const sessionTime = sessionData.time;
  // If you want to use location in the email, you can also get sessionData.location

  try {
    elements.bookingMessage.textContent = "✅ Saving booking... Please wait.";
    const bookingId = await saveBooking(playerName, parentEmail, sessionName, sessionDate, sessionTime);
    console.log("✅ Booking saved:", bookingId);
    redirectToPayment(bookingId);
  } catch (error) {
    console.error("❌ Error saving booking:", error);
    elements.bookingMessage.textContent = "❌ Error saving booking. Please try again.";
  }
});

// Save booking to Firebase and then redirect
async function saveBooking(playerName, parentEmail, sessionName, sessionDate, sessionTime) {
  const groupKey = elements.sessionTypeSelect.value;
  const bookingRef = ref(db, `bookings/${groupKey}/${sessionDate}`);
  const newBookingRef = push(bookingRef);

  // Fetch location from schedule
  const sessionRef = ref(db, `schedule/${groupKey}`);
  const sessionSnap = await get(sessionRef);
  const sessionData = sessionSnap.val();
  const location = sessionData && sessionData.location
  ? (typeof sessionData.location === 'string' ? sessionData.location : sessionData.location.name || '')
  : '';
  
  await set(newBookingRef, {
    playerName,
    parentEmail,
    sessionName,
    sessionDate,
    sessionTime,
    location, // Save location
    status: "Pending",
  });

  console.log("✅ Booking saved in Firebase:", newBookingRef.key);
  return newBookingRef.key;
}

// Redirect to payment with all necessary parameters
function redirectToPayment(bookingId) {
  const paymentLink = stripePaymentLinks[elements.sessionTypeSelect.value];
  if (paymentLink) {
    // Save booking data to local storage for success page
    localStorage.setItem("bookingId", bookingId);
    localStorage.setItem("groupKey", elements.sessionTypeSelect.value);
    localStorage.setItem("sessionDate", elements.sessionDateInput.value);

    console.log("✅ Redirecting to payment:", paymentLink);
    window.location.href = paymentLink;
  } else {
    elements.bookingMessage.textContent = "❌ No payment link available for this session.";
  }
}




document.addEventListener("DOMContentLoaded", loadSchedule);