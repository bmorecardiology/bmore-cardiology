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
  blocker.innerHTML = '<div style="text-align: center; color: white;"><h1>🔒 Access Restricted</h1><p>BMore Cardiology is under compliance review.</p></div>';
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
      // User clicked cancel - keep site blocked permanently
      blocker.innerHTML = '<div style="text-align: center; color: white;"><h1>Access Denied</h1><p>This site is currently under compliance review.</p><p style="font-size: 0.9em; margin-top: 20px;">Please contact the site administrator if you believe this is an error.</p></div>';
      document.body.style.visibility = 'hidden';
      document.body.style.opacity = '0';
      return; // Exit - do NOT re-prompt
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
