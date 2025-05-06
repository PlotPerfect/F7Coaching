
import { db } from '../auth.js';
import {
  ref,
  onValue,
  push,
  set,
  get
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Elements
const sessionTypeSelect = document.getElementById("sessionType");
const sessionDateInput = document.getElementById("sessionDate");
const sessionTimeInput = document.getElementById("sessionTime");
const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");

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
sessionTypeSelect.addEventListener("change", () => {
  const groupKey = sessionTypeSelect.value;
  if (!groupKey) return;

  const session = liveScheduleData[groupKey];
  if (!session) return;

  const dayName = extractDayFromText(session.time);
  const dayIndex = getWeekdayIndex(dayName);

  flatpickr("#sessionDate", {
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: [
      function (date) {
        return date.getDay() !== dayIndex;
      }
    ]
  });

  const match = session.time.match(/at\s(.*?)\s?[-–]\s?(.*)/i);
  if (match) {
    sessionTimeInput.value = `${match[1]} - ${match[2]}`;
  } else {
    sessionTimeInput.value = "";
  }
});

// Booking submission
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  bookingMessage.textContent = "";

  const playerName = document.getElementById("playerName").value;
  const parentEmail = document.getElementById("parentEmail").value;
  const groupKey = sessionTypeSelect.value;
  const date = sessionDateInput.value;
  const time = sessionTimeInput.value;
  const dateTimeKey = `${date}_${time.replace(/:/g, '')}`;

  if (!groupKey || !date || !time) {
    bookingMessage.textContent = "❌ Please fill in all required fields.";
    return;
  }

  const spotsLeft = await getSpotsLeft(groupKey, dateTimeKey);
  if (spotsLeft <= 0) {
    bookingMessage.textContent = "❌ This session is fully booked.";
    return;
  }

  // Store booking info temporarily for payment.html
  localStorage.setItem("pendingBooking", JSON.stringify({
    playerName,
    parentEmail,
    groupKey,
    date,
    time,
    dateTimeKey
  }));

  // Redirect to payment
  window.location.href = "/payment.html";
});

// Initialize
document.addEventListener("DOMContentLoaded", loadSchedule);
