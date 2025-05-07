import { db } from '../auth.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";


export function openBookingOverlay() {
    const overlay = document.getElementById("bookingOverlay");
    overlay.style.display = "flex";
  }
  
  export function closeBookingOverlay() {
    const overlay = document.getElementById("bookingOverlay");
    overlay.style.display = "none";
  }
  
  // Attach globally so inline HTML calls work
  window.openBookingOverlay = openBookingOverlay;
  window.closeBookingOverlay = closeBookingOverlay;
  

  // menu Cards Carousel
  let currentIndex = 0;

export function updateCarousel() {
  const cards = document.querySelectorAll('.carousel-card');
  cards.forEach((card, i) => {
    card.classList.remove('active');
    if (i === currentIndex) {
      card.classList.add('active');
    }
  });

  const track = document.getElementById('carouselTrack');
  const offset = currentIndex * 340; // 300px width + 40px gap
  track.style.transform = `translateX(calc(50% - ${offset}px))`;
}

document.getElementById('carouselNext').addEventListener('click', () => {
  const cards = document.querySelectorAll('.carousel-card');
  currentIndex = (currentIndex + 1) % cards.length;
  updateCarousel();
});

document.getElementById('carouselPrev').addEventListener('click', () => {
  const cards = document.querySelectorAll('.carousel-card');
  currentIndex = (currentIndex - 1 + cards.length) % cards.length;
  updateCarousel();
});

// Initialize
updateCarousel();

// Enable card click to make active
document.querySelectorAll('.carousel-card').forEach((card, index) => {
    card.addEventListener('click', () => {
      currentIndex = index;
      updateCarousel();
    });
  });

  
  // Testimonial Carousel
  let currentTestimonial = 0;

const testimonials = document.querySelectorAll('.testimonial-card');
const prevBtn = document.getElementById('prevTestimonial');
const nextBtn = document.getElementById('nextTestimonial');

function updateTestimonials() {
  testimonials.forEach((card, index) => {
    card.classList.remove('active');
    if (index === currentTestimonial) {
      card.classList.add('active');
    }
  });
}

nextBtn.addEventListener('click', () => {
  currentTestimonial = (currentTestimonial + 1) % testimonials.length;
  updateTestimonials();
});

prevBtn.addEventListener('click', () => {
  currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
  updateTestimonials();
});

// Initial display
updateTestimonials();


// Menu Toggle
const menuBtn = document.getElementById('menuBtn');
const menuOverlay = document.getElementById('menuOverlay');
const menuIcon = document.getElementById('menuIcon'); // updated to match actual ID

const iconClosed = 'Images/menuIconClosed.svg';
const iconOpen = 'Images/menuIconOpen.svg';

menuBtn.addEventListener('click', () => {
  menuOverlay.classList.toggle('show');

  const isOpen = menuOverlay.classList.contains('show');
  menuIcon.src = isOpen ? iconOpen : iconClosed;
});

// Close overlay and scroll to section when a menu link is clicked
document.querySelectorAll('.menu-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');

    // ✅ Only prevent default if it's a hash scroll or handled with custom overlay
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }

      menuOverlay.classList.remove('show');
      menuIcon.src = iconClosed;
    }
  });
});

// Open info panels
document.getElementById('tcBtn').addEventListener('click', () => {
  document.getElementById('tcPanel').style.display = 'block';
});

document.getElementById('privacyBtn').addEventListener('click', () => {
  document.getElementById('privacyPanel').style.display = 'block';
});

// Close panel by ID (called from inline onclick)
window.closePanel = function(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) panel.style.display = 'none';
};

// Optional: Close info panel when clicking outside of it
window.addEventListener('click', (e) => {
  document.querySelectorAll('.info-panel').forEach(panel => {
    if (e.target === panel) {
      panel.style.display = 'none';
    }
  });
});

// about us overlay
function openAboutUsOverlay() {
  document.getElementById('aboutUsOverlay').style.display = 'block';
  document.body.classList.add('no-scroll'); // prevent background scroll
}

function closeAboutUsOverlay() {
  document.getElementById('aboutUsOverlay').style.display = 'none';
  document.body.classList.remove('no-scroll'); // re-enable scroll
}
  window.openAboutUsOverlay = openAboutUsOverlay;
window.closeAboutUsOverlay = closeAboutUsOverlay;

function openAboutUsFromMenu() {
  closeMenuOverlay(); // if you want to close the menu before opening the About panel
  openAboutUsOverlay(); // opens the About panel
}

function closeMenuOverlay() {
  const menu = document.getElementById('menuOverlay');
  menu.classList.remove('active');
}
window.closeMenuOverlay = closeMenuOverlay; // make it globally accessible
window.openAboutUsFromMenu = openAboutUsFromMenu; // make it globally accessible

function openFrameworkOverlay() {
  document.getElementById('frameworkOverlay').style.display = 'block';
  document.body.classList.add('no-scroll');
}

function closeFrameworkOverlay() {
  document.getElementById('frameworkOverlay').style.display = 'none';
  document.body.classList.remove('no-scroll');
}

function openFrameworkFromMenu() {
  closeMenuOverlay(); // optional: closes menu first
  openFrameworkOverlay();
}
window.openFrameworkFromMenu = openFrameworkFromMenu; // make it globally accessible
window.openFrameworkOverlay = openFrameworkOverlay; // make it globally accessible
window.closeFrameworkOverlay = closeFrameworkOverlay; // make it globally accessible

function openServicesOverlay() {
  document.getElementById('servicesOverlay').style.display = 'block';
  document.body.classList.add('no-scroll');
}

function closeServicesOverlay() {
  document.getElementById('servicesOverlay').style.display = 'none';
  document.body.classList.remove('no-scroll');
}

function openServicesFromMenu() {
  closeMenuOverlay();
  openServicesOverlay();
}
window.openServicesFromMenu = openServicesFromMenu; // make it globally accessible
window.openServicesOverlay = openServicesOverlay; // make it globally accessible
window.closeServicesOverlay = closeServicesOverlay; // make it globally accessible


function openScheduleOverlay() {
  const overlay = document.getElementById('scheduleOverlay');
  if (!overlay) {
    console.error("❌ #scheduleOverlay not found");
    return;
  }

  const container = overlay.querySelector('.schedule-container');
  if (!container) {
    console.error("❌ .schedule-container not found inside overlay");
    return;
  }

  overlay.style.display = 'block';
  document.body.classList.add('no-scroll');

  // Load Firebase data
  const scheduleRef = ref(db, "schedule");
  onValue(scheduleRef, (snapshot) => {
    const data = snapshot.val();
    container.innerHTML = "";

    if (!data) {
      container.innerHTML = "<p>No schedule available at the moment.</p>";
      return;
    }

    Object.values(data).forEach((group) => {
      const item = document.createElement("div");
      item.className = "schedule-item";
      item.innerHTML = `
        <h3>${group.groupName}</h3>
        <p>${group.time} / ${group.location}</p>
      `;
      container.appendChild(item);
    });
  });
}

// 🔒 IMPORTANT: Make sure it's exposed globally
window.openScheduleOverlay = openScheduleOverlay;

function closeScheduleOverlay() {
  document.getElementById('scheduleOverlay').style.display = 'none';
  document.body.classList.remove('no-scroll');
}

function openScheduleFromMenu() {
  closeMenuOverlay();
  openScheduleOverlay();
} 
window.openScheduleFromMenu = openScheduleFromMenu; // make it globally accessible
window.openScheduleOverlay = openScheduleOverlay; // make it globally accessible  
window.closeScheduleOverlay = closeScheduleOverlay; // make it globally accessible

function openAdminPortal() {
  closeMenuOverlay();
  setTimeout(() => {
    window.location.href = 'adminportal.html';
  }, 200); // give the menu time to disappear
}
window.openAdminPortal = openAdminPortal; // make it globally accessible

function openContactOverlay() {
  document.getElementById('contactOverlay').style.display = 'block';
  document.body.classList.add('no-scroll');
}

function closeContactOverlay() {
  document.getElementById('contactOverlay').style.display = 'none';
  document.body.classList.remove('no-scroll');
}

function openContactFromMenu() {
  closeMenuOverlay();
  openContactOverlay();
}

// Attach globally
window.openContactOverlay = openContactOverlay;
window.closeContactOverlay = closeContactOverlay;
window.openContactFromMenu = openContactFromMenu;

document.addEventListener('DOMContentLoaded', function() {
  const carouselTrack = document.getElementById('carouselTrack');
  let startX = 0;
  let isSwiping = false;

  // Mobile Swipe (Touch Events)
  carouselTrack.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isSwiping = true;
  });

  carouselTrack.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;

      const currentX = e.touches[0].clientX;
      const diff = startX - currentX;

      if (diff > 50) { // Swipe Left
          document.getElementById('carouselNext').click();
          isSwiping = false;
      } else if (diff < -50) { // Swipe Right
          document.getElementById('carouselPrev').click();
          isSwiping = false;
      }
  });

  carouselTrack.addEventListener('touchend', () => {
      isSwiping = false;
  });

  // Desktop Drag (Mouse Events)
  carouselTrack.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      isSwiping = true;
  });

  carouselTrack.addEventListener('mousemove', (e) => {
      if (!isSwiping) return;

      const diff = startX - e.clientX;

      if (diff > 50) { // Drag Left
          document.getElementById('carouselNext').click();
          isSwiping = false;
      } else if (diff < -50) { // Drag Right
          document.getElementById('carouselPrev').click();
          isSwiping = false;
      }
  });

  carouselTrack.addEventListener('mouseup', () => {
      isSwiping = false;
  });
});
