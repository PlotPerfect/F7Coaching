// Stripe payment links for each groupKey (add more as needed)
const stripePaymentLinks = {
  // Example: 'groupKey': 'https://book.stripe.com/test_14AfZhc804nk8wDaLf3AY0d',
  'fri_fairlop': 'https://book.stripe.com/8x2aEX2xtgVY0U769Hao806',
  'sat_wadham': 'https://book.stripe.com/8x2aEX2xtgVY0U769Hao806',
  'thurs_shooters': 'https://book.stripe.com/8x2aEX2xtgVY0U769Hao806',
  'tues_fairlop': 'https://book.stripe.com/8x2aEX2xtgVY0U769Hao806', //test link for Tuesday Fairlop
  'wed_fairlop': 'https://book.stripe.com/8x2aEX2xtgVY0U769Hao806'
};

import { db, ref, onValue, push, set, get } from './auth.js';

// Elements
const elements = {
  bookingLocation: document.getElementById("bookingLocation"),
  bookingDate: document.getElementById("bookingDate"),
  bookingTime: document.getElementById("bookingTime"),
  bookingForm: document.getElementById("bookingForm"),
  bookingMessage: document.getElementById("bookingMessage"),
  playerName: document.getElementById("playerName"),
  playerAge: document.getElementById("playerAge"),
  parentEmail: document.getElementById("parentEmail"),
};

let liveScheduleData = {};
let currentFlatpickr = null;

// Initialize the app


// Load schedule from Firebase
function loadSchedule() {
  const scheduleRef = ref(db, "schedule");
  onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    liveScheduleData = data;
    populateLocationOptions(data);
  });
}

// Populate location options in the dropdown
function populateLocationOptions(scheduleData) {
  elements.bookingLocation.innerHTML = '<option value="">Select Location</option>';
  const locations = {};
  Object.entries(scheduleData).forEach(([key, session]) => {
    if (session.location) {
      if (!locations[session.location]) locations[session.location] = [];
      locations[session.location].push({ key, ...session });
    }
  });
  // Define the desired order of days
  const dayOrder = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];
  // Helper to extract day from location string
  function getDayFromLocation(loc) {
    const match = loc.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
    return match ? match[0] : "";
  }
  // Sort locations by day order
  const sortedLocations = Object.keys(locations).sort((a, b) => {
    const dayA = getDayFromLocation(a);
    const dayB = getDayFromLocation(b);
    return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB);
  });
  sortedLocations.forEach(location => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    elements.bookingLocation.appendChild(option);
  });
  // Hide date and time dropdowns until location is selected
  elements.bookingDate.style.display = 'none';
  elements.bookingTime.style.display = 'none';
}

// Handle location selection
// When a location is selected, show the date input as a calendar (flatpickr), filtered to only show available days for that location
elements.bookingLocation.addEventListener("change", async () => {
  const location = elements.bookingLocation.value;
  if (!location) {
    elements.bookingDate.style.display = 'none';
    elements.bookingTime.style.display = 'none';
    if (currentFlatpickr) { currentFlatpickr.destroy(); currentFlatpickr = null; }
    return;
  }
  // Find all sessions for this location
  const sessions = Object.entries(liveScheduleData).filter(([key, session]) => session.location === location);
  const groupKeys = sessions.map(([key]) => key);
  // Find all allowed days (e.g. Tuesday, Wednesday, etc.) for this location
  const allowedDays = Array.from(new Set(sessions.map(([_, session]) => session.dayName || (session.location.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)?.[0])))).filter(Boolean);
  // Setup flatpickr for the date input
  elements.bookingDate.style.display = '';
  elements.bookingTime.style.display = 'none';
  elements.bookingDate.value = '';
  if (currentFlatpickr) { currentFlatpickr.destroy(); }
  currentFlatpickr = flatpickr(elements.bookingDate, {
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: [
      function(date) {
        // Only enable allowed days and dates that are not fully booked
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        if (!allowedDays.includes(dayName)) return true;
        // Check if all times for this date are fully booked for all groupKeys
        // (async not allowed here, so we only filter by day)
        return false;
      }
    ],
    onChange: function(selectedDates, dateStr) {
      if (!dateStr) {
        elements.bookingTime.style.display = 'none';
        return;
      }
      populateAvailableTimesForDate(location, dateStr);
    }
  });
});

async function populateAvailableTimesForDate(location, date) {
  // Find all sessions for this location
  const sessions = Object.entries(liveScheduleData).filter(([key, session]) => session.location === location);
  let availableTimes = [];
  let allTimes = [];
  // Fallback mapping for auto-generated keys
  const keyToStripeKey = {
    '-OZeuNjDKsAEc_o1jvYs': 'fri_fairlop',
    '-ObZGSYjrRQDxOzyQwlp': 'sat_wadham',
    // Add more mappings as needed
  };
  for (const [key, session] of sessions) {
    const stripeKey = session.stripeKey || keyToStripeKey[key] || key;
    if (Array.isArray(session.times)) {
      for (const time of session.times) {
        const spots = await getAvailableSpots(key, date, time);
        allTimes.push({ key: stripeKey, time, spots });
        if (spots > 0) {
          availableTimes.push({ key: stripeKey, time, spots });
        }
      }
    }
  }
  let options = '';
  if (allTimes.length === 0) {
    options = '<option value="">No sessions available</option>';
    elements.bookingTime.disabled = true;
  } else if (availableTimes.length === 0) {
    options = '<option value="">No sessions available</option>';
    elements.bookingTime.disabled = true;
  } else {
    options = '<option value="">Select Time</option>' + allTimes.map(t => {
      if (t.spots > 0) {
  return `<option value="${t.key}|${t.time}">${t.time}</option>`;
      } else {
        return `<option value="" disabled>${t.time} (Full)</option>`;
      }
    }).join('');
    elements.bookingTime.disabled = false;
  }
  elements.bookingTime.innerHTML = options;
  elements.bookingTime.style.display = '';
}

// Handle date selection
elements.bookingDate.addEventListener("change", async () => {
  const location = elements.bookingLocation.value;
  const date = elements.bookingDate.value;
  if (!location || !date) {
    elements.bookingTime.style.display = 'none';
    return;
  }
  // Find all sessions for this location
  const sessions = Object.entries(liveScheduleData).filter(([key, session]) => session.location === location);
  // For each session, get available times for this date
  let availableTimes = [];
  let allTimes = [];
  for (const [key, session] of sessions) {
    if (Array.isArray(session.times)) {
      for (const time of session.times) {
        const spots = await getAvailableSpots(key, date, time);
        allTimes.push({ key, time, spots });
        if (spots > 0) {
          availableTimes.push({ key, time, spots });
        }
      }
    }
  }
  let options = '';
  if (allTimes.length === 0) {
    options = '<option value="">No sessions available</option>';
    elements.bookingTime.disabled = true;
  } else if (availableTimes.length === 0) {
    options = '<option value="">No sessions available</option>';
    elements.bookingTime.disabled = true;
  } else {
    options = '<option value="">Select Time</option>' + allTimes.map(t => {
      if (t.spots > 0) {
  return `<option value="${t.key}|${t.time}">${t.time}</option>`;
      } else {
        return `<option value="" disabled>${t.time} (Full)</option>`;
      }
    }).join('');
    elements.bookingTime.disabled = false;
  }
  elements.bookingTime.innerHTML = options;
  elements.bookingTime.style.display = '';
});

// Helper to get all available dates for a set of groupKeys
async function getAvailableDatesForLocation(groupKeys) {
  const allDates = new Set();
  for (const groupKey of groupKeys) {
    const bookingsRef = ref(db, `bookings/${groupKey}`);
    const snapshot = await get(bookingsRef);
    const data = snapshot.val();
    if (data) {
      Object.entries(data).forEach(([dateKey, bookingsForDate]) => {
        // Check if any time slot for this date is not fully booked
        const timeCounts = {};
        Object.values(bookingsForDate).forEach(booking => {
          if (booking.sessionTime) {
            timeCounts[booking.sessionTime] = (timeCounts[booking.sessionTime] || 0) + (booking.status === 'Confirmed' ? 1 : 0);
          }
        });
        const hasAvailable = Object.values(timeCounts).some(count => count < 15);
        if (hasAvailable) allDates.add(dateKey.split("_")[0]);
      });
    }
  }
  // Also add future dates from schedule if not already booked out
  // (Optional: can be extended for more robust logic)
  return Array.from(allDates).sort();
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
  const location = elements.bookingLocation.value;
  const date = elements.bookingDate.value;
  const timeValue = elements.bookingTime.value;
  if (!location || !date || !timeValue) return;
  const [groupKey, sessionTime] = timeValue.split('|');
  const spotsLeft = await getAvailableSpots(groupKey, date, sessionTime);
  updateBookingMessage(spotsLeft);
}

elements.bookingTime.addEventListener("change", updateBookingMessageForDate);

// Update booking message based on available spots
function updateBookingMessage(spotsLeft) {
  if (spotsLeft <= 0) {
    elements.bookingMessage.textContent = "❌ No spaces left for this session.";
    elements.bookingForm.querySelector("button[type='submit']").disabled = true;
  } else {
    elements.bookingMessage.textContent = "";
    elements.bookingForm.querySelector("button[type='submit']").disabled = false;
  }
}

// Form submission handler
elements.bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  elements.bookingMessage.textContent = "";

  const playerName = elements.playerName.value;
  const playerAge = elements.playerAge.value;
  const parentEmail = elements.parentEmail.value;
  const location = elements.bookingLocation.value;
  const date = elements.bookingDate.value;
  const timeValue = elements.bookingTime.value;
  if (!playerName || !parentEmail || !location || !date || !timeValue || !playerAge) {
    elements.bookingMessage.textContent = "❌ Please complete all booking details.";
    return;
  }
  const [rawGroupKey, sessionTime] = timeValue.split('|');
  // Fallback mapping for auto-generated keys
  const keyToStripeKey = {
    '-OZeuNjDKsAEc_o1jvYs': 'fri_fairlop',
    '-ObZGSYjrRQDxOzyQwlp': 'sat_wadham',
    '-ObZIP1mauc_5PWR3W4u': 'fri_fairlop',
    '-ObZGSYjrRQDxOzyQwlp': 'sat_wadham',
    // Add more mappings as needed
  };
  const groupKey = keyToStripeKey[rawGroupKey] || rawGroupKey;
  // Fetch latest session details from Firebase
  const sessionRef = ref(db, `schedule/${rawGroupKey}`);
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
    const bookingId = await saveBooking(playerName, playerAge, parentEmail, sessionName, date, sessionTime, sessionLocation, groupKey);
    console.log("✅ Booking saved:", bookingId);
    redirectToPayment(bookingId, groupKey);
  } catch (error) {
    console.error("❌ Error saving booking:", error);
    elements.bookingMessage.textContent = "❌ Error saving booking. Please try again.";
  }
});

// Save booking to Firebase and then redirect
async function saveBooking(playerName, playerAge, parentEmail, sessionName, sessionDate, sessionTime, sessionLocation, groupKeyOverride) {
  // Use the groupKey from the time dropdown if provided, otherwise fallback
  const groupKey = groupKeyOverride || (elements.bookingTime.value ? elements.bookingTime.value.split('|')[0] : null);
  if (!groupKey) throw new Error('No groupKey found for booking');
  const bookingRef = ref(db, `bookings/${groupKey}/${sessionDate}`);
  const newBookingRef = push(bookingRef);

  await set(newBookingRef, {
    playerName,
    playerAge,
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
function redirectToPayment(bookingId, groupKey) {
  console.log('[Stripe Debug] groupKey used for payment link:', groupKey);
  const paymentLink = stripePaymentLinks[groupKey];
  if (paymentLink) {
    localStorage.setItem("bookingId", bookingId);
    localStorage.setItem("groupKey", groupKey);
    localStorage.setItem("sessionDate", elements.bookingDate.value);
    window.location.href = paymentLink;
  } else {
    console.warn('[Stripe Debug] No payment link found for groupKey:', groupKey);
    elements.bookingMessage.textContent = "❌ No payment link available for this session.";
  }
}




document.addEventListener("DOMContentLoaded", loadSchedule);