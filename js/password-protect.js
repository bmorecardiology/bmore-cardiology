// Password Protection Script
// Prevents page access until correct password is entered

(function() {
  'use strict';
  
  const CORRECT_PASSWORD = 'gateway';
  const SESSION_KEY = 'bmore_auth_v1';
  
  // Check if already authenticated
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    return; // Allow access
  }
  
  // Create and inject password modal immediately
  const style = document.createElement('style');
  style.textContent = `
    #bmore-password-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a3a52 0%, #2e86de 100%);
      display: flex !important;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    }
    #bmore-password-modal {
      background: white;
      padding: 50px 40px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 400px;
      width: 90%;
      max-width: 400px;
    }
    #bmore-password-modal .icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    #bmore-password-modal h1 {
      color: #1a3a52;
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 600;
    }
    #bmore-password-modal p {
      color: #666;
      margin: 0 0 30px 0;
      font-size: 14px;
      line-height: 1.6;
    }
    #bmore-password-input {
      width: 100%;
      padding: 12px 15px;
      font-size: 16px;
      border: 2px solid #ddd;
      border-radius: 6px;
      margin-bottom: 20px;
      font-family: inherit;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    #bmore-password-input:focus {
      outline: none;
      border-color: #2e86de;
    }
    #bmore-password-btn {
      width: 100%;
      padding: 12px 15px;
      font-size: 16px;
      background: #2e86de;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.2s;
      font-family: inherit;
    }
    #bmore-password-btn:hover {
      background: #1a5cb0;
    }
    #bmore-password-btn:active {
      transform: scale(0.98);
    }
    #bmore-password-error {
      color: #c7254e;
      font-size: 13px;
      margin-top: 15px;
      display: none;
    }
  `;
  document.head.appendChild(style);
  
  // Create overlay HTML
  const overlay = document.createElement('div');
  overlay.id = 'bmore-password-overlay';
  overlay.innerHTML = `
    <div id="bmore-password-modal">
      <div class="icon">🔒</div>
      <h1>BMore Cardiology</h1>
      <p>This site is under compliance review.<br>Please enter the password to access.</p>
      <input type="password" id="bmore-password-input" placeholder="Enter password" autofocus>
      <button id="bmore-password-btn">Unlock Site</button>
      <div id="bmore-password-error">❌ Incorrect password. Please try again.</div>
    </div>
  `;
  
  // Add overlay to page immediately
  document.documentElement.appendChild(overlay);
  
  // Handle password submission
  function unlockSite() {
    const pwd = document.getElementById('bmore-password-input').value.trim();
    const errorEl = document.getElementById('bmore-password-error');
    
    if (pwd === CORRECT_PASSWORD) {
      // Correct password
      sessionStorage.setItem(SESSION_KEY, 'true');
      overlay.remove();
    } else {
      // Wrong password
      errorEl.style.display = 'block';
      document.getElementById('bmore-password-input').value = '';
      document.getElementById('bmore-password-input').focus();
      setTimeout(() => {
        errorEl.style.display = 'none';
      }, 3000);
    }
  }
  
  // Attach event listeners
  document.getElementById('bmore-password-btn').addEventListener('click', unlockSite);
  document.getElementById('bmore-password-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') unlockSite();
  });
  
  // Focus input
  setTimeout(() => {
    document.getElementById('bmore-password-input').focus();
  }, 100);
})();
