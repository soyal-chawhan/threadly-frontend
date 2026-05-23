import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYbxhlhYzpx1VWjx3SZrgJCgKUN6C7o9I",
  authDomain: "threadly-9fcb1.firebaseapp.com",
  projectId: "threadly-9fcb1",
  storageBucket: "threadly-9fcb1.firebasestorage.app",
  messagingSenderId: "640618955070",
  appId: "1:640618955070:web:807d03d8f0e34b5d176c6f"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

export async function googleSignIn() {
  await signInWithRedirect(auth, provider);
}

export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return;

    const idToken = await result.user.getIdToken();
    const res = await fetch('https://threadly-backend.onrender.com/api/auth/google', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ idToken })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google sign-in failed');

    localStorage.setItem('_tl_sess', JSON.stringify(data.user));
    localStorage.setItem('_tl_tok',  data.token);
    window.location.href = 'dashboard.html';
  } catch(err) {
    console.error('Redirect result error:', err);
  }
}