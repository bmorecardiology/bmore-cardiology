// Password Protection Script
// Strict access control - blocks all content until correct password is entered

(function() {
  const CORRECT_PASSWORD = 'gateway';
  const SESSION_KEY = 'bmore_authenticated';
  
  // Check if already authenticated
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    return; // User already authenticated, allow access
  }
  
  // Create blocking overlay
  const blocker = document.createElement('div');
  blocker.id = 'password-blocker';
  blocker.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a3a52 0%, #2e86de 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    font-family: Arial, sans-serif;
  `;
  
  // Create password modal
  const modalHTML = `
    <div style="
      background: white;
      padding: 50px 40px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 400px;
      width: 90%;
    ">
      <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
      <h1 style="
        color: #1a3a52;
        margin: 0 0 10px 0;
        font-size: 28px;
      ">BMore Cardiology</h1>
      <p style="
        color: #666;
        margin: 0 0 30px 0;
        font-size: 14px;
      ">This site is under compliance review.<br>Please enter the password to access.</p>
      
      <input type="password" id="password-input" placeholder="Enter password" style="
        width: 100%;
        padding: 12px 15px;
        font-size: 16px;
        border: 2px solid #ddd;
        border-radius: 6px;
        margin-bottom: 20px;
        box-sizing: border-box;
        transition: border-color 0.3s ease;
      " onkeypress="if(event.key==='Enter') document.getElementById('password-submit').click();" />
      
      <button id="password-submit" style="
        width: 100%;
        padding: 12px 15px;
        font-size: 16px;
        background: #2e86de;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
      " onmouseover="this.style.background='#1a5cb0';" onmouseout="this.style.background='#2e86de';">
        Unlock Site
      </button>
      
      <p id="error-msg" style="
        color: #c7254e;
        font-size: 13px;
        margin-top: 15px;
        display: none;
      ">❌ Incorrect password. Please try again.</p>
    </div>
  `;
  
  blocker.innerHTML = modalHTML;
  
  // Hide entire body content
  document.documentElement.style.overflow = 'hidden';
  document.body.style.visibility = 'hidden';
  document.body.style.opacity = '0';
  
  // Add blocker to page
  document.documentElement.appendChild(blocker);
  
  // Handle password submission
  function checkPassword() {
    const passwordInput = document.getElementById('password-input');
    const errorMsg = document.getElementById('error-msg');
    const password = passwordInput.value;
    
    if (password === CORRECT_PASSWORD) {
      // Correct password - unlock site
      sessionStorage.setItem(SESSION_KEY, 'true');
      blocker.remove();
      document.body.style.visibility = 'visible';
      document.body.style.opacity = '1';
      document.htmlElement.style.overflow = 'auto';
    } else {
      // Wrong password - show error
      errorMsg.style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
      setTimeout(() => {
        errorMsg.style.display = 'none';
      }, 3000);
    }
  }
  
  // Wait for button to be in DOM, then attach event listener
  setTimeout(function() {
    const submitBtn = document.getElementById('password-submit');
    const passwordInput = document.getElementById('password-input');
    
    if (submitBtn) {
      submitBtn.addEventListener('click', checkPassword);
    }
    
    if (passwordInput) {
      passwordInput.focus();
    }
  }, 100);
  
})();
