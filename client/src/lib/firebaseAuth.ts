import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../components/firebase/firebase.config';

export async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }