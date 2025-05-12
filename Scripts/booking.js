
import { db } from '../auth.js';
import { ref, onValue, push, set, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Elements
const sessionTypeSelect = document.getElementById("sessionType");
const sessionDateInput = document.getElementById("sessionDate");
const sessionTimeInput = document.getElementById("sessionTime");
const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");

// Stripe Payment Links for Each Session
const stripePaymentLinks = {
  "U10_U12": "https://book.stripe.com/test_14AfZhc804nk8wDaLf3AY0d",
  "U11_U12": "https://book.stripe.com/test_28EbJ16NGbPM9AH06B3AY0c",
  "U12_U15_Advanced": "https://book.stripe.com/test_14A7sL1tm6vs7sz9Hb3AY0b",
  "U13_U15": "https://book.stripe.com/test_bJecN59ZScTQ28fg5z3AY0a",
  "U7_U8": "https://book.stripe.com/test_8x29ATgogdXU7szf1v3AY09",
  "U9_U10": "https://book.stripe.com/test_9B68wPc80g620076uZ3AY08",
  "U9_U11_Advanced": "https://book.stripe.com/test_8x2aEX9ZSaLIfZ58D73AY07"
  // Add more session keys and links here
};

// Global session data
let liveScheduleData = {};

// Load schedule
function loadSchedule() {
  const scheduleRef = ref(db, "schedule");
  onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    populateSessionOptions(data);
  });
}

function populateSessionOptions(scheduleData) {
  sessionTypeSelect.innerHTML = '<option value="">Select Session Type</option>';
  liveScheduleData = scheduleData;

  Object.entries(scheduleData).forEach(([key, session]) => {
    const label = `${session.groupName} — ${session.time}`;
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    sessionTypeSelect.appendChild(option);
  });
}

// Automatically set the time when a session is selected
sessionTypeSelect.addEventListener("change", async () => {
  const groupKey = sessionTypeSelect.value;
  if (!groupKey) return;

  const session = liveScheduleData[groupKey];
  if (!session) return;

  const match = session.time.match(/at\s(\d{1,2}:\d{2}[ap]m)/i);
  if (match) {
    sessionTimeInput.value = match[1];
    sessionTimeInput.setAttribute("readonly", true);
    sessionTimeInput.disabled = true;
  }

  // Extract the day of the week
  const dayMatch = session.time.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
  const dayName = dayMatch ? dayMatch[0].toLowerCase() : null;

  // Update date picker with availability
  updateDatePicker(groupKey, dayName);

  // Check available spots for the selected session
  const spotsLeft = await getAvailableSpots(groupKey);
  if (spotsLeft <= 0) {
    bookingMessage.textContent = "❌ No spaces left for this session.";
    bookingForm.querySelector("button[type='submit']").disabled = true;
  } else {
    bookingMessage.textContent = `✅ ${spotsLeft} spots left.`;
    bookingForm.querySelector("button[type='submit']").disabled = false;
  }
});

// Save Booking to Firebase (Triggered after payment)
async function saveBookingToFirebase(booking) {
  const bookingRef = ref(db, `bookings/${booking.groupKey}/${booking.dateTimeKey}`);
  await push(bookingRef, {
    playerName: booking.playerName,
    parentEmail: booking.parentEmail,
    groupKey: booking.groupKey,
    date: booking.date,
    time: booking.time
  });
}



async function updateDatePicker(groupKey, allowedDay) {
  const bookingsRef = ref(db, `bookings/${groupKey}`);
  const snapshot = await get(bookingsRef);
  const data = snapshot.val();

  const fullyBookedDates = [];

  if (data) {
    Object.keys(data).forEach(dateKey => {
      if (Object.keys(data[dateKey]).length >= 15) {
        fullyBookedDates.push(dateKey.split('_')[0]); // Only date part
      }
    });
  }

  flatpickr("#sessionDate", {
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: [
      function(date) {
        if (fullyBookedDates.includes(date.toISOString().split('T')[0])) return true;
        return allowedDay ? date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() !== allowedDay : false;
      }
    ]
  });
}

// Convert day name (e.g., "Saturday") to Flatpickr index (0 = Sunday)
function getWeekdayIndex(dayName) {
  const weekdays = {
    sunday: 0, monday: 1, tuesday: 2,
    wednesday: 3, thursday: 4,
    friday: 5, saturday: 6
  };
  return weekdays[dayName.toLowerCase()];
}

// Extract the day from text like "Saturday at 9:15am - 10:30am"
function extractDayFromText(timeText) {
  const match = timeText.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
  return match ? match[0] : null;
}

// Spot availability
async function getSpotsLeft(groupKey, dateTimeKey) {
  const bookingRef = ref(db, `bookings/${groupKey}_${dateTimeKey}`);
  const snapshot = await get(bookingRef);
  const data = snapshot.val();
  return 15 - (data ? Object.keys(data).length : 0);
}

// Flatpickr initial config
flatpickr("#sessionDate", {
  dateFormat: "Y-m-d",
  minDate: "today"
});

flatpickr("#sessionTime", {
  enableTime: true,
  noCalendar: true,
  dateFormat: "H:i"
});

// When a session type is selected, restrict date picker and autofill time
sessionTypeSelect.addEventListener("change", async () => {
  const groupKey = sessionTypeSelect.value;
  if (!groupKey) return;

  const session = liveScheduleData[groupKey];
  if (!session) return;

  const match = session.time.match(/at\s(\d{1,2}:\d{2}[ap]m)/i);
  if (match) {
    sessionTimeInput.value = match[1];
    sessionTimeInput.setAttribute("readonly", true);
    sessionTimeInput.disabled = true;
  }

  // Check available spots for the selected session
  const spotsLeft = await getAvailableSpots(groupKey);
  if (spotsLeft <= 0) {
    bookingMessage.textContent = "❌ No spaces left for this session.";
    bookingForm.querySelector("button[type='submit']").disabled = true;
  } else {
    bookingMessage.textContent = `✅ ${spotsLeft} spots left.`;
    bookingForm.querySelector("button[type='submit']").disabled = false;
  }
});

// Check available spots function
async function getAvailableSpots(groupKey) {
  const bookingsRef = ref(db, `bookings/${groupKey}`);
  const snapshot = await get(bookingsRef);
  const data = snapshot.val();
  return 15 - (data ? Object.keys(data).length : 0);
}

// Booking submission (Redirect to Stripe Payment Link)
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  bookingMessage.textContent = "";

  const playerName = document.getElementById("playerName").value;
  const parentEmail = document.getElementById("parentEmail").value;
  const groupKey = sessionTypeSelect.value;
  const sessionName = sessionTypeSelect.options[sessionTypeSelect.selectedIndex].text;
  const sessionDate = sessionDateInput.value;
  const sessionTime = sessionTimeInput.value;

  if (!groupKey) {
    bookingMessage.textContent = "❌ Please select a session type.";
    return;
  }

  // Save booking details in Local Storage
  localStorage.setItem("selectedPlayerName", playerName);
  localStorage.setItem("selectedParentEmail", parentEmail);
  localStorage.setItem("selectedSessionName", sessionName);
  localStorage.setItem("selectedSessionDate", sessionDate);
  localStorage.setItem("selectedSessionTime", sessionTime);

  // Get the matching Stripe Payment Link
  const paymentLink = stripePaymentLinks[groupKey];
  if (!paymentLink) {
    bookingMessage.textContent = "❌ No payment link available for this session.";
    return;
  }

  // Redirect to the Stripe Payment Link
  window.location.href = paymentLink;
});

// Initialize
document.addEventListener("DOMContentLoaded", loadSchedule);
