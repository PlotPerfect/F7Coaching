import { db } from './auth.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Utility Functions
const toggleDisplay = (elementId, displayStyle) => {
  const element = document.getElementById(elementId);
  if (element) element.style.display = displayStyle;
};

const toggleClass = (elementId, className) => {
  const element = document.getElementById(elementId);
  if (element) element.classList.toggle(className);
};

// Overlay Management
const OverlayManager = {
  openOverlay(id) {
    toggleDisplay(id, 'block');
    document.body.classList.add('no-scroll');
  },
  closeOverlay(id) {
    toggleDisplay(id, 'none');
    document.body.classList.remove('no-scroll');
  },
};



// Carousel Management
const Carousel = {
  currentIndex: 0,
  updateCarousel(trackId, cardClass, offsetWidth) {
    const cards = document.querySelectorAll(`.${cardClass}`);
    cards.forEach((card, i) => {
      card.classList.toggle('active', i === this.currentIndex);
    });

    const track = document.getElementById(trackId);
    const offset = this.currentIndex * offsetWidth;
    track.style.transform = `translateX(calc(50% - ${offset}px))`;
  },
  attachNavigation(nextId, prevId, cardClass, trackId, offsetWidth) {
    document.getElementById(nextId).addEventListener('click', () => {
      const cards = document.querySelectorAll(`.${cardClass}`);
      this.currentIndex = (this.currentIndex + 1) % cards.length;
      this.updateCarousel(trackId, cardClass, offsetWidth);
    });

    document.getElementById(prevId).addEventListener('click', () => {
      const cards = document.querySelectorAll(`.${cardClass}`);
      this.currentIndex = (this.currentIndex - 1 + cards.length) % cards.length;
      this.updateCarousel(trackId, cardClass, offsetWidth);
    });
  },
  attachCardClick(cardClass, trackId, offsetWidth) {
    document.querySelectorAll(`.${cardClass}`).forEach((card, index) => {
      card.addEventListener('click', () => {
        this.currentIndex = index;
        this.updateCarousel(trackId, cardClass, offsetWidth);
      });
    });
  },
};

// Initialize Menu Cards Carousel
Carousel.attachNavigation('carouselNext', 'carouselPrev', 'carousel-card', 'carouselTrack', 340);
Carousel.attachCardClick('carousel-card', 'carouselTrack', 340);
Carousel.updateCarousel('carouselTrack', 'carousel-card', 340);

// Testimonial Carousel
const TestimonialCarousel = {
  currentIndex: 0,
  update() {
    const testimonials = document.querySelectorAll('.testimonial-card');
    testimonials.forEach((card, index) => {
      card.classList.toggle('active', index === this.currentIndex);
    });
  },
  attachNavigation(nextId, prevId) {
    document.getElementById(nextId).addEventListener('click', () => {
      const testimonials = document.querySelectorAll('.testimonial-card');
      this.currentIndex = (this.currentIndex + 1) % testimonials.length;
      this.update();
    });

    document.getElementById(prevId).addEventListener('click', () => {
      const testimonials = document.querySelectorAll('.testimonial-card');
      this.currentIndex = (this.currentIndex - 1 + testimonials.length) % testimonials.length;
      this.update();
    });
  },
};

// Initialize Testimonial Carousel
TestimonialCarousel.attachNavigation('nextTestimonial', 'prevTestimonial');
TestimonialCarousel.update();

// Menu Toggle
const Menu = {
  toggle() {
    toggleClass('menuOverlay', 'show');
    const isOpen = document.getElementById('menuOverlay').classList.contains('show');
    document.getElementById('menuIcon').src = isOpen ? 'Images/menuIconOpen.svg' : 'Images/menuIconClosed.svg';
  },
  close() {
    document.getElementById('menuOverlay').classList.remove('show');
    document.getElementById('menuIcon').src = 'Images/menuIconClosed.svg';
  },
};
document.getElementById('menuBtn').addEventListener('click', Menu.toggle);
window.closeMenuOverlay = Menu.close;

// Menu Links Scroll
document.querySelectorAll('.menu-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetElement = document.getElementById(href.substring(1));
      if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
      Menu.close();
    }
  });
});

// Info Panels
const InfoPanel = {
  open(panelId) {
    toggleDisplay(panelId, 'block');
  },
  close(panelId) {
    toggleDisplay(panelId, 'none');
  },
};
window.closePanel = InfoPanel.close;


// Booking Overlay
export const BookingOverlay = {
  open() {
    // Always reset booking overlay to show intro and hide form
    const intro = document.getElementById('bookingMessageIntro');
    const bookingForm = document.getElementById('bookingForm');
    const bookingMessage = document.getElementById('bookingMessage');
    if (intro) intro.style.display = 'block';
    if (bookingForm) bookingForm.style.display = 'none';
    if (bookingMessage) bookingMessage.textContent = '';
    OverlayManager.openOverlay('bookingOverlay');
  },
  close() {
    OverlayManager.closeOverlay('bookingOverlay');
  },
};
window.openBookingOverlay = BookingOverlay.open;
window.closeBookingOverlay = BookingOverlay.close;

// Helper: Close all overlays
function closeAllOverlays() {
  const overlayIds = [
    'bookingOverlay',
    'aboutUsOverlay',
    'frameworkOverlay',
    'servicesOverlay',
    'coachesOverlay',
    'scheduleOverlay',
    'contactOverlay'
  ];
  overlayIds.forEach(id => OverlayManager.closeOverlay(id));
}

// When opening overlays from menu, do NOT scroll to home
window.openBookingsFromMenu = () => {
  Menu.close();
  closeAllOverlays();
  OverlayManager.openOverlay('bookingOverlay');
};

// About Us Overlay
window.openAboutUsOverlay = () => OverlayManager.openOverlay('aboutUsOverlay');
window.closeAboutUsOverlay = () => OverlayManager.closeOverlay('aboutUsOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openAboutUsFromMenu = () => {
  Menu.close();
  closeAllOverlays();
  OverlayManager.openOverlay('aboutUsOverlay');
};

// Framework Overlay
window.openFrameworkOverlay = () => OverlayManager.openOverlay('frameworkOverlay');
window.closeFrameworkOverlay = () => OverlayManager.closeOverlay('frameworkOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openFrameworkFromMenu = () => {
  Menu.close();
  closeAllOverlays();
  OverlayManager.openOverlay('frameworkOverlay');
};

// Services Overlay
window.openServicesOverlay = () => OverlayManager.openOverlay('servicesOverlay');
window.closeServicesOverlay = () => OverlayManager.closeOverlay('servicesOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openServicesFromMenu = () => {
  Menu.close();
  closeAllOverlays();
  OverlayManager.openOverlay('servicesOverlay');
};

// Coaches Overlay
window.openCoachesOverlay = () => OverlayManager.openOverlay('coachesOverlay');
window.closeCoachesOverlay = () => OverlayManager.closeOverlay('coachesOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openCoachesFromMenu = () => {
  Menu.close();
  closeAllOverlays();
  OverlayManager.openOverlay('coachesOverlay');
};

// Schedule Overlay
window.openScheduleOverlay = () => {
  const overlay = document.getElementById('scheduleOverlay');
  const container = overlay.querySelector('.schedule-container');
  if (!overlay || !container) return console.error("❌ Schedule overlay or container not found");
  OverlayManager.openOverlay('scheduleOverlay');
  const scheduleRef = ref(db, "live_schedule");
  onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    // Define the order of days
    const dayOrder = [
      'monday','tuesday','wednesday','thursday','friday','saturday','sunday'
    ];
    let groups = data ? Object.values(data) : [];
    // Try to sort by groupName if it matches a day
    groups = groups.sort((a, b) => {
      const aIndex = dayOrder.findIndex(day => a.groupName && a.groupName.toLowerCase().includes(day));
      const bIndex = dayOrder.findIndex(day => b.groupName && b.groupName.toLowerCase().includes(day));
      // If both found, sort by index
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      // If only one found, that one comes first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // Otherwise, keep original order
      return 0;
    });
    container.innerHTML = groups.length
      ? groups.map(group => `
        <div class="schedule-item">
          <h3>${group.groupName}</h3>
          <div class="schedule-location">${group.location}</div>
          <ul class="schedule-times">
            ${Array.isArray(group.times) ? group.times.map(time => `<li>${time}</li>`).join('') : `<li>${group.time || ''}</li>`}
          </ul>
        </div>
      `).join('')
      : "<p>No schedule available at the moment.</p>";
  });
};
window.closeScheduleOverlay = () => OverlayManager.closeOverlay('scheduleOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openScheduleFromMenu = () => {
  Menu.close();
  closeAllOverlays();
  OverlayManager.openOverlay('scheduleOverlay');
};

// Admin Portal
window.openAdminPortal = () => {
  Menu.close();
  closeAllOverlays();
  setTimeout(() => window.location.href = 'adminportal.html', 200);
};

// Contact Overlay
window.openContactOverlay = () => OverlayManager.openOverlay('contactOverlay');
window.closeContactOverlay = () => OverlayManager.closeOverlay('contactOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openContactFromMenu = () => {
  Menu.close();
  closeAllOverlays();
  OverlayManager.openOverlay('contactOverlay');
};

// Swipe/Drag for Carousel
document.addEventListener('DOMContentLoaded', () => {
  const carouselTrack = document.getElementById('carouselTrack');
  let startX = 0;
  let currentX = 0;
  let isSwiping = false;
  let touchMoved = false;
  let activeCard = null;
  const SWIPE_THRESHOLD = 30;

  // Helper: activate card overlay/button on tap
  function activateCard(card) {
    // Remove active state from all cards
    document.querySelectorAll('.carousel-card').forEach(c => c.classList.remove('mobile-active'));
    if (card) card.classList.add('mobile-active');
    activeCard = card;
  }

  // Touch events
  carouselTrack.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isSwiping = true;
    touchMoved = false;
    // Find the card being touched
    activeCard = e.target.closest('.carousel-card');
  });
  carouselTrack.addEventListener('touchmove', (e) => {
    if (isSwiping) {
      currentX = e.touches[0].clientX;
      if (Math.abs(currentX - startX) > 5) touchMoved = true;
    }
  });
  carouselTrack.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    const diff = startX - currentX;
    if (touchMoved && Math.abs(diff) > SWIPE_THRESHOLD) {
      // Swipe
      if (diff > 0) document.getElementById('carouselNext').click();
      else document.getElementById('carouselPrev').click();
      // Remove mobile-active from all cards
      document.querySelectorAll('.carousel-card').forEach(c => c.classList.remove('mobile-active'));
    } else {
      // Treat as tap
      const card = e.target.closest('.carousel-card');
      if (card) {
        if (!card.classList.contains('mobile-active')) {
          // First tap: show overlay/button
          activateCard(card);
        } else {
          // Second tap: if tap is on button, trigger button
          const button = card.querySelector('.card-overlay button');
          if (button && e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const btnRect = button.getBoundingClientRect();
            if (
              touch.clientX >= btnRect.left && touch.clientX <= btnRect.right &&
              touch.clientY >= btnRect.top && touch.clientY <= btnRect.bottom
            ) {
              button.click();
            }
          }
        }
      }
    }
    isSwiping = false;
    startX = 0;
    currentX = 0;
    touchMoved = false;
  });

  // Mouse events (for desktop drag)
  let mouseMoved = false;
  carouselTrack.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isSwiping = true;
    mouseMoved = false;
  });
  carouselTrack.addEventListener('mousemove', (e) => {
    if (isSwiping) {
      currentX = e.clientX;
      mouseMoved = true;
    }
  });
  carouselTrack.addEventListener('mouseup', (e) => {
    if (isSwiping) {
      const diff = startX - currentX;
      if (mouseMoved && Math.abs(diff) > 10) {
        if (diff > 50) document.getElementById('carouselNext').click();
        else if (diff < -50) document.getElementById('carouselPrev').click();
      } else if (!mouseMoved) {
        // Treat as click: find the card and trigger its click event
        const card = e.target.closest('.carousel-card');
        if (card) card.click();
      }
      isSwiping = false;
      startX = 0;
      currentX = 0;
      mouseMoved = false;
    }
  });
  // Prevent accidental text selection while dragging
  carouselTrack.addEventListener('mouseleave', () => {
    isSwiping = false;
    startX = 0;
    currentX = 0;
    mouseMoved = false;
  });
});

document.addEventListener("DOMContentLoaded", function() {
  const tcBtn = document.getElementById("tcBtn");
  const privacyBtn = document.getElementById("privacyBtn");
  if (tcBtn) tcBtn.addEventListener("click", () => InfoPanel.open('tcPanel'));
  if (privacyBtn) privacyBtn.addEventListener("click", () => InfoPanel.open('privacyPanel'));
});

document.addEventListener('DOMContentLoaded', function() {
  const continueBtn = document.getElementById('continueToBookingBtn');
  const bookingForm = document.getElementById('bookingForm');
  const intro = document.getElementById('bookingMessageIntro');
  if (continueBtn && bookingForm && intro) {
    continueBtn.addEventListener('click', function() {
      intro.style.display = 'none';
      bookingForm.style.display = 'block';
    });
  }
});
