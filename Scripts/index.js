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
    OverlayManager.openOverlay('bookingOverlay');
  },
  close() {
    OverlayManager.closeOverlay('bookingOverlay');
  },
};
window.openBookingOverlay = BookingOverlay.open;
window.closeBookingOverlay = BookingOverlay.close;
// When opening overlays from menu, do NOT scroll to home
window.openBookingsFromMenu = () => {
  Menu.close();
  OverlayManager.openOverlay('bookingOverlay');
};

// About Us Overlay
window.openAboutUsOverlay = () => OverlayManager.openOverlay('aboutUsOverlay');
window.closeAboutUsOverlay = () => OverlayManager.closeOverlay('aboutUsOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openAboutUsFromMenu = () => {
  Menu.close();
  OverlayManager.openOverlay('aboutUsOverlay');
};

// Framework Overlay
window.openFrameworkOverlay = () => OverlayManager.openOverlay('frameworkOverlay');
window.closeFrameworkOverlay = () => OverlayManager.closeOverlay('frameworkOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openFrameworkFromMenu = () => {
  Menu.close();
  OverlayManager.openOverlay('frameworkOverlay');
};

// Services Overlay
window.openServicesOverlay = () => OverlayManager.openOverlay('servicesOverlay');
window.closeServicesOverlay = () => OverlayManager.closeOverlay('servicesOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openServicesFromMenu = () => {
  Menu.close();
  OverlayManager.openOverlay('servicesOverlay');
};

// Coaches Overlay
window.openCoachesOverlay = () => OverlayManager.openOverlay('coachesOverlay');
window.closeCoachesOverlay = () => OverlayManager.closeOverlay('coachesOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openCoachesFromMenu = () => {
  Menu.close();
  OverlayManager.openOverlay('coachesOverlay');
};

// Schedule Overlay
window.openScheduleOverlay = () => {
  const overlay = document.getElementById('scheduleOverlay');
  const container = overlay.querySelector('.schedule-container');
  if (!overlay || !container) return console.error("❌ Schedule overlay or container not found");

  OverlayManager.openOverlay('scheduleOverlay');

  const scheduleRef = ref(db, "schedule");
  onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    container.innerHTML = data
      ? Object.values(data).map(group => `
        <div class="schedule-item">
          <h3>${group.groupName}</h3>
          <p>${group.time} / ${group.location}</p>
        </div>
      `).join('')
      : "<p>No schedule available at the moment.</p>";
  });
};
window.closeScheduleOverlay = () => OverlayManager.closeOverlay('scheduleOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openScheduleFromMenu = () => {
  Menu.close();
  OverlayManager.openOverlay('scheduleOverlay');
};

// Admin Portal
window.openAdminPortal = () => {
  Menu.close();
  setTimeout(() => window.location.href = 'adminportal.html', 200);
};

// Contact Overlay
window.openContactOverlay = () => OverlayManager.openOverlay('contactOverlay');
window.closeContactOverlay = () => OverlayManager.closeOverlay('contactOverlay');
// When opening overlays from menu, do NOT scroll to home
window.openContactFromMenu = () => {
  Menu.close();
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
