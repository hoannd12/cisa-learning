// =============================================================
// FIREBASE AUTH + FIRESTORE SYNC
// Handles Google login and cloud progress sync
// Falls back to localStorage if Firebase is not configured
// =============================================================

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let currentUser = null;

/**
 * Initialize Firebase (only if configured)
 */
async function initFirebase() {
  if (!FIREBASE_ENABLED || FIREBASE_CONFIG.apiKey === "YOUR_API_KEY_HERE") {
    console.log('[Firebase] Not configured — using localStorage only');
    return false;
  }

  try {
    // Import Firebase from CDN (loaded in index.html)
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    const { getFirestore, doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    firebaseApp = initializeApp(FIREBASE_CONFIG);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);

    // Listen for auth state changes
    onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        localStorage.setItem('cisa_user', JSON.stringify(currentUser));
        // Sync progress from cloud
        await loadProgressFromCloud();
        // Refresh UI
        if (window.router) window.router();
      } else {
        currentUser = null;
      }
    });

    console.log('[Firebase] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Firebase] Init failed:', error);
    return false;
  }
}

/**
 * Sign in with Google popup
 */
async function signInWithGoogle() {
  if (!firebaseAuth) {
    // Fallback: use localStorage login
    return false;
  }

  try {
    const { signInWithPopup, GoogleAuthProvider } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(firebaseAuth, provider);
    return result.user;
  } catch (error) {
    console.error('[Firebase] Google sign-in failed:', error);
    return null;
  }
}

/**
 * Sign out
 */
async function firebaseSignOut() {
  if (!firebaseAuth) return;
  try {
    const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    await signOut(firebaseAuth);
    currentUser = null;
    localStorage.removeItem('cisa_user');
  } catch (error) {
    console.error('[Firebase] Sign out failed:', error);
  }
}

/**
 * Save progress to Firestore
 */
async function saveProgressToCloud() {
  if (!firebaseDb || !currentUser) return;

  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    const progressData = {
      progress: localStorage.getItem('cisa_progress') || '{}',
      pretest: {},
      posttest: {},
      updatedAt: new Date().toISOString(),
    };

    // Collect all test scores
    for (let i = 1; i <= 5; i++) {
      const pre = localStorage.getItem(`cisa_pretest_${i}`);
      const post = localStorage.getItem(`cisa_posttest_${i}`);
      if (pre) progressData.pretest[i] = pre;
      if (post) progressData.posttest[i] = post;
    }

    await setDoc(doc(firebaseDb, 'users', currentUser.uid), progressData);
    console.log('[Firebase] Progress saved to cloud');
  } catch (error) {
    console.error('[Firebase] Save progress failed:', error);
  }
}

/**
 * Load progress from Firestore
 */
async function loadProgressFromCloud() {
  if (!firebaseDb || !currentUser) return;

  try {
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    const docSnap = await getDoc(doc(firebaseDb, 'users', currentUser.uid));

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Restore progress
      if (data.progress) {
        localStorage.setItem('cisa_progress', data.progress);
      }

      // Restore test scores
      if (data.pretest) {
        for (const [domain, value] of Object.entries(data.pretest)) {
          localStorage.setItem(`cisa_pretest_${domain}`, value);
        }
      }
      if (data.posttest) {
        for (const [domain, value] of Object.entries(data.posttest)) {
          localStorage.setItem(`cisa_posttest_${domain}`, value);
        }
      }

      console.log('[Firebase] Progress loaded from cloud');
    }
  } catch (error) {
    console.error('[Firebase] Load progress failed:', error);
  }
}

/**
 * Check if user is logged in (Firebase or localStorage)
 */
function isLoggedIn() {
  if (currentUser) return true;
  const stored = localStorage.getItem('cisa_user');
  return !!stored;
}

/**
 * Get current user info
 */
function getCurrentUser() {
  if (currentUser) return currentUser;
  const stored = localStorage.getItem('cisa_user');
  return stored ? JSON.parse(stored) : null;
}
