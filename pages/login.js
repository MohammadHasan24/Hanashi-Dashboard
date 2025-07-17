import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Set persistence based on checkbox
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && (userSnap.data().roles || []).includes('writer')) {
        alert('Login successful! ✅ Remember Me is ' + (rememberMe ? 'enabled' : 'off'));
        router.push('/writerDashboard');
      } else {
        setError("You don't have writer access.");
        await signOut(auth);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form style={styles.form} onSubmit={handleLogin}>
        <h1 style={styles.title}>📝 Writer Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe((prev) => !prev)}
            style={{ marginRight: '0.5rem' }}
          />
          Remember me
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'radial-gradient(ellipse at center, #1f1f1f 0%, #121212 100%)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(10px)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '1.8rem',
    marginBottom: '1rem',
    color: '#ffcc00',
    textAlign: 'center',
  },
  input: {
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    border: '1px solid #444',
    borderRadius: '8px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: '1rem',
  },
  checkboxLabel: {
    color: '#ddd',
    fontSize: '0.95rem',
    marginBottom: '1rem',
  },
  button: {
    padding: '0.75rem 1rem',
    backgroundColor: '#ffcc00',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  error: {
    color: '#ff4444',
    marginBottom: '1rem',
    fontWeight: 'bold',
    textAlign: 'center',
  },
};
