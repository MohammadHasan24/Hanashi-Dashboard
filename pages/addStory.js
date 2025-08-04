// pages/addStory.js
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { useUserRole } from '../hooks/useUserRole';

export default function AddStory() {
  const router = useRouter();
  const { user, roles, loading } = useUserRole();

  // redirect non-writers to login
  useEffect(() => {
    if (!loading && (!user || !roles?.includes('writer'))) {
      router.replace('/login');
    }
  }, [user, roles, loading, router]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsUploading(true);

    try {
      let coverImagePath = '';
      if (coverFile) {
        // store under covers/ with uuid
        coverImagePath = `covers/${uuidv4()}`;
        const storageRef = ref(storage, coverImagePath);
        const snap = await uploadBytes(storageRef, coverFile);
        // get full download URL
        const downloadUrl = await getDownloadURL(snap.ref);
        coverImagePath = downloadUrl;
      }

      // add Firestore doc
      const docRef = await addDoc(collection(db, 'stories'), {
        title,
        description,
        tags: tag ? [tag] : [],
        chapters: [],
        coverImage: coverImagePath,
        published: false,
        createdAt: serverTimestamp(),
      });

      // navigate into your new book’s flow
      router.push(`/writerDashboard/${docRef.id}`);
    } catch (err) {
      console.error('Error posting story:', err);
      alert('Oops! Something went wrong.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !roles?.includes('writer')) {
    return null; // or a loading spinner
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Add a New Book</h1>
      <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: '0.75rem', fontSize: '1rem' }}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ padding: '0.75rem', fontSize: '1rem' }}
        />
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          style={{ padding: '0.75rem', fontSize: '1rem' }}
        >
          <option value="">Select genre</option>
          <option value="horror">Horror</option>
          <option value="drama">Drama</option>
          <option value="romance">Romance</option>
          <option value="sci-fi">Sci-Fi</option>
          <option value="fantasy">Fantasy</option>
        </select>

        <input type="file" accept="image/*" onChange={handleImageChange} />

        {previewUrl && (
          <div>
            <img
              src={previewUrl}
              alt="Cover preview"
              style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          style={{
            padding: '0.75rem',
            fontSize: '1rem',
            background: '#ffcc00',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {isUploading ? 'Uploading…' : 'Post'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/writerDashboard')}
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: '#333',
            color: '#ffcc00',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Back to Dashboard
        </button>
      </form>
    </main>
  );
}
