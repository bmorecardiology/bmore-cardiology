// ============================================
// Interactive Elements Manager
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  initializeToggles();
  initializeTabs();
});

// ============================================
// Expandable/Collapsible Toggles
// ============================================

function initializeToggles() {
  const toggleHeaders = document.querySelectorAll('.toggle-header');
  
  toggleHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const content = this.nextElementSibling;
      const icon = this.querySelector('.toggle-icon');
      
      // Toggle active state
      this.classList.toggle('active');
      if (content) {
        content.classList.toggle('active');
      }
      if (icon) {
        icon.classList.toggle('active');
      }
    });
  });
}

// ============================================
// Tabbed Content
// ============================================

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      this.classList.add('active');
      const activeContent = document.getElementById(tabId);
      if (activeContent) {
        activeContent.classList.add('active');
      }
    });
  });
  
  // Activate first tab by default
  if (tabButtons.length > 0) {
    tabButtons[0].classList.add('active');
    const firstTabId = tabButtons[0].getAttribute('data-tab');
    const firstContent = document.getElementById(firstTabId);
    if (firstContent) {
      firstContent.classList.add('active');
    }
  }
}

// ============================================
// Smooth Scroll for Diagrams
// ============================================

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.1
});

document.querySelectorAll('.diagram-svg, .info-card, .comparison-card').forEach(el => {
  observer.observe(el);
});
