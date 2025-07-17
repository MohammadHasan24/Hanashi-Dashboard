import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; 

type Role = 'reader' | 'writer' | 'admin';

export const useUserRole = () => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setRoles(null); // guest
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setRoles(data.roles || []);
        } else {
          setRoles([]);
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, roles, loading };
};
