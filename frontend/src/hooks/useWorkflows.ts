import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  status: 'draft' | 'active' | 'archived';
  createdAt: any;
  updatedAt: any;
}

export function useWorkflows() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setWorkflows([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'workflows'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Workflow[];
        setWorkflows(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching workflows:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const createWorkflow = useCallback(
    async (name: string, description: string = '') => {
      if (!user) throw new Error('Not authenticated');

      const workflow = {
        userId: user.uid,
        name,
        description,
        nodes: [],
        edges: [],
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'workflows'), workflow);
      return docRef.id;
    },
    [user]
  );

  const updateWorkflow = useCallback(
    async (id: string, updates: Partial<Workflow>) => {
      if (!user) throw new Error('Not authenticated');

      const docRef = doc(db, 'workflows', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    },
    [user]
  );

  const deleteWorkflow = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const docRef = doc(db, 'workflows', id);
      await deleteDoc(docRef);
    },
    [user]
  );

  return {
    workflows,
    loading,
    error,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
  };
}
