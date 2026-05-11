// Password Protection Script
// Strict access control - blocks all content until correct password is entered

(function() {
  const CORRECT_PASSWORD = 'gateway';
  const SESSION_KEY = 'bmore_authenticated';
  
  // Create blocking overlay immediately
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
  document.documentElement.appendChild(blocker);
  
  // Hide entire body content
  document.body.style.visibility = 'hidden';
  document.body.style.opacity = '0';
  
  // Check if already authenticated
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    // Remove blocker and show content
    blocker.remove();
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
    return;
  }
  
  // Prompt for password
  function promptPassword() {
    const password = prompt('🔒 BMore Cardiology\n\nEnter password to access:');
    
    if (password === null) {
      // User clicked cancel - keep site blocked, show "Access Denied" with retry button
      blocker.innerHTML = `
        <div style="text-align: center; color: white;">
          <h1>🔒 Access Denied</h1>
          <p>This site is currently under compliance review.</p>
          <p style="font-size: 0.9em; margin-top: 20px; margin-bottom: 30px;">Please enter the password to access.</p>
          <button id="retry-btn" style="
            padding: 12px 30px;
            font-size: 16px;
            background: white;
            color: #1a3a52;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='#e8f4f8'; this.style.transform='scale(1.05)';" 
             onmouseout="this.style.background='white'; this.style.transform='scale(1)';">
            Try Again
          </button>
        </div>
      `;
      document.getElementById('retry-btn').addEventListener('click', promptPassword);
      document.body.style.visibility = 'hidden';
      document.body.style.opacity = '0';
      return; // Exit - allow retry via button
    }
    
    if (password === CORRECT_PASSWORD) {
      // Correct password - unlock site
      sessionStorage.setItem(SESSION_KEY, 'true');
      blocker.remove();
      document.body.style.visibility = 'visible';
      document.body.style.opacity = '1';
    } else {
      // Wrong password - show error and re-prompt
      alert('❌ Incorrect password. Please try again.');
      promptPassword(); // Recursively ask again
    }
  }
  
  // Start password prompt
  promptPassword();
})();
