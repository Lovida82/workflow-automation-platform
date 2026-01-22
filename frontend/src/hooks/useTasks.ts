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

export interface Task {
  id: string;
  title: string;
  description: string;
  workflowId: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: any;
  updatedAt: any;
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];
        setTasks(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tasks:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const createTask = useCallback(
    async (title: string, description: string = '', priority: Task['priority'] = 'medium') => {
      if (!user) throw new Error('Not authenticated');

      const task = {
        userId: user.uid,
        title,
        description,
        workflowId: null,
        priority,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'tasks'), task);
      return docRef.id;
    },
    [user]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      if (!user) throw new Error('Not authenticated');

      const docRef = doc(db, 'tasks', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    },
    [user]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const docRef = doc(db, 'tasks', id);
      await deleteDoc(docRef);
    },
    [user]
  );

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask
  };
}
