// Password Protection Script
// Checks for valid password before allowing site access

(function() {
  const CORRECT_PASSWORD = 'gateway';
  const SESSION_KEY = 'bmore_authenticated';
  
  // Check if already authenticated in this session
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    return; // User already authenticated, allow access
  }
  
  // Show password prompt
  function promptPassword() {
    const password = prompt('🔒 BMore Cardiology is currently under compliance review.\n\nEnter password to access:');
    
    if (password === null) {
      // User clicked cancel, show message
      document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #1a3a52 0%, #2e86de 100%); font-family: Arial, sans-serif;"><div style="text-align: center; color: white;"><h1>Access Restricted</h1><p>This site is currently under compliance review.</p></div></div>';
      return;
    }
    
    if (password === CORRECT_PASSWORD) {
      // Correct password - store in session and allow access
      sessionStorage.setItem(SESSION_KEY, 'true');
      // Page will reload or access will be granted on next check
    } else {
      // Wrong password - show error and re-prompt
      alert('❌ Incorrect password. Please try again.');
      promptPassword(); // Recursively ask again
    }
  }
  
  // Block access until password is correct
  promptPassword();
})();
