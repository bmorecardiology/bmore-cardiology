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

// ============================================
// BP Log Tracking (if on relevant page)
// ============================================

function initializeBPTracker() {
  const bpForm = document.getElementById('bp-tracker-form');
  if (!bpForm) return;
  
  bpForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('bp-date').value;
    const reading1 = document.getElementById('bp-reading1').value;
    const reading2 = document.getElementById('bp-reading2').value;
    const reading3 = document.getElementById('bp-reading3').value;
    
    if (!date || !reading1 || !reading2 || !reading3) {
      alert('Please fill in all readings');
      return;
    }
    
    // Extract systolic values
    const sys1 = parseInt(reading1.split('/')[0]);
    const sys2 = parseInt(reading2.split('/')[0]);
    const sys3 = parseInt(reading3.split('/')[0]);
    
    // Find lowest
    const lowest = Math.min(sys1, sys2, sys3);
    
    // Add to log
    addBPEntry(date, reading1, reading2, reading3, lowest);
    
    // Clear form
    bpForm.reset();
    document.getElementById('bp-date').focus();
  });
}

function addBPEntry(date, r1, r2, r3, lowest) {
  const logTable = document.getElementById('bp-log-table');
  if (!logTable) return;
  
  const tbody = logTable.querySelector('tbody');
  const row = document.createElement('tr');
  
  row.innerHTML = `
    <td>${new Date(date).toLocaleDateString()}</td>
    <td>${r1}</td>
    <td>${r2}</td>
    <td>${r3}</td>
    <td style="color: #d32f2f; font-weight: bold;">${lowest}</td>
    <td><button class="delete-btn" onclick="this.parentElement.parentElement.remove()">Delete</button></td>
  `;
  
  tbody.appendChild(row);
  updateBPAverage();
}

function updateBPAverage() {
  const logTable = document.getElementById('bp-log-table');
  if (!logTable) return;
  
  const rows = logTable.querySelectorAll('tbody tr');
  if (rows.length === 0) return;
  
  const values = Array.from(rows).map(row => {
    const lowest = parseInt(row.cells[4].textContent);
    return lowest;
  });
  
  const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const avgDisplay = document.getElementById('bp-average');
  if (avgDisplay) {
    avgDisplay.textContent = average;
  }
}

// Initialize BP tracker if present
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBPTracker);
} else {
  initializeBPTracker();
}
