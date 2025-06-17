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
    const option = document.createElement("option");
    option.value = key;
    option.textContent = session.groupName;
    elements.sessionTypeSelect.appendChild(option);
  });
  // Reset time and date fields
  elements.sessionTimeInput.value = '';
  elements.sessionTimeInput.disabled = true;
  elements.sessionTimeInput.setAttribute('readonly', true);
}

// Handle session type selection
elements.sessionTypeSelect.addEventListener("change", async () => {
  const groupKey = elements.sessionTypeSelect.value;
  if (!groupKey) return;

  const session = liveScheduleData[groupKey];
  if (!session) return;

  // Display the location for the selected session
  const locationDiv = document.getElementById('sessionLocationDisplay');
  if (locationDiv) {
    locationDiv.textContent = session.location ? `Location: ${session.location}` : '';
  }

  // Reset date and time fields on session change
  elements.sessionDateInput.value = '';
  // Remove the type assignment that causes error
  if (elements.sessionTimeInput.tagName === 'SELECT') {
    elements.sessionTimeInput.selectedIndex = 0;
  } else {
    elements.sessionTimeInput.value = '';
  }

  // Populate time dropdown if multiple times exist
  if (Array.isArray(session.times) && session.times.length > 0) {
    // Replace input with a select dropdown
    const select = document.createElement('select');
    select.id = 'sessionTime';
    select.required = true;
    select.innerHTML = '<option value="">Select Time</option>' + session.times.map(t => `<option value="${t}">${t}</option>`).join('');
    elements.sessionTimeInput.replaceWith(select);
    elements.sessionTimeInput = select;
    attachSessionTimeListener();
  } else {
    // Fallback to text input for legacy data
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'sessionTime';
    input.value = session.time || '';
    input.setAttribute('readonly', true);
    input.disabled = true;
    elements.sessionTimeInput.replaceWith(input);
    elements.sessionTimeInput = input;
    attachSessionTimeListener();
  }

  const dayName = session.location.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)?.[0]?.toLowerCase();
  await updateDatePicker(groupKey, dayName);
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
      Object.entries(data).forEach(([dateKey, bookingsForDate]) => {
        // For each date, check all times
        const timeCounts = {};
        Object.values(bookingsForDate).forEach(booking => {
          if (booking.sessionTime) {
            timeCounts[booking.sessionTime] = (timeCounts[booking.sessionTime] || 0) + (booking.status === 'Confirmed' ? 1 : 0);
          }
        });
        // If all times for this date are fully booked, disable the date
        const allTimesFull = Object.values(timeCounts).length > 0 && Object.values(timeCounts).every(count => count >= 15);
        if (allTimesFull) {
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

// Get available spots for a session on a specific date and time
async function getAvailableSpots(groupKey, sessionDate, sessionTime) {
  if (!groupKey || !sessionDate || !sessionTime) return 15;
  const bookingsRef = ref(db, `bookings/${groupKey}/${sessionDate}`);
  const snapshot = await get(bookingsRef);
  const data = snapshot.val();
  // Only count bookings with status 'Confirmed' and matching time
  let confirmedCount = 0;
  if (data) {
    Object.values(data).forEach(booking => {
      if (booking.status === 'Confirmed' && booking.sessionTime === sessionTime) confirmedCount++;
    });
  }
  return 15 - confirmedCount;
}

// Update booking message based on available spots for selected date and time
async function updateBookingMessageForDate() {
  const groupKey = elements.sessionTypeSelect.value;
  const sessionDate = elements.sessionDateInput.value;
  let sessionTime = "";
  if (elements.sessionTimeInput) {
    if (elements.sessionTimeInput.tagName === 'SELECT') {
      sessionTime = elements.sessionTimeInput.value;
    } else {
      sessionTime = elements.sessionTimeInput.value;
    }
  }
  if (!groupKey || !sessionDate || !sessionTime) return;
  const spotsLeft = await getAvailableSpots(groupKey, sessionDate, sessionTime);
  updateBookingMessage(spotsLeft);
}

// Listen for date and time changes to update spots left
if (elements.sessionDateInput) {
  elements.sessionDateInput.addEventListener("change", updateBookingMessageForDate);
}
// Always re-attach event listener after replacing sessionTimeInput
function attachSessionTimeListener() {
  if (elements.sessionTimeInput) {
    elements.sessionTimeInput.removeEventListener("change", updateBookingMessageForDate);
    elements.sessionTimeInput.addEventListener("change", updateBookingMessageForDate);
  }
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
  // Get the selected session time (from dropdown or input)
  let sessionTime = "";
  if (elements.sessionTimeInput.tagName === 'SELECT') {
    sessionTime = elements.sessionTimeInput.value;
  } else {
    sessionTime = elements.sessionTimeInput.value;
  }

  if (!playerName || !parentEmail || !groupKey || !sessionDate || !sessionTime) {
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
  const sessionLocation = sessionData.location || sessionData.sessionLocation || "";

  try {
    elements.bookingMessage.textContent = "✅ Saving booking... Please wait.";
    const bookingId = await saveBooking(playerName, parentEmail, sessionName, sessionDate, sessionTime, sessionLocation);
    console.log("✅ Booking saved:", bookingId);
    redirectToPayment(bookingId);
  } catch (error) {
    console.error("❌ Error saving booking:", error);
    elements.bookingMessage.textContent = "❌ Error saving booking. Please try again.";
  }
});

// Save booking to Firebase and then redirect
async function saveBooking(playerName, parentEmail, sessionName, sessionDate, sessionTime, sessionLocation) {
  const groupKey = elements.sessionTypeSelect.value;
  const bookingRef = ref(db, `bookings/${groupKey}/${sessionDate}`);
  const newBookingRef = push(bookingRef);

  await set(newBookingRef, {
    playerName,
    parentEmail,
    sessionName,
    sessionDate,
    sessionTime,
    sessionLocation,
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