import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Express app for API routes
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Middleware to verify Firebase Auth token
const authenticate = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ Workflow API ============

// Get all workflows for current user
app.get('/workflows', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const snapshot = await db
      .collection('workflows')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const workflows = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(workflows);
  } catch (error) {
    console.error('Error getting workflows:', error);
    res.status(500).json({ error: 'Failed to get workflows' });
  }
});

// Create a new workflow
app.post('/workflows', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const { name, description, nodes, edges } = req.body;

    const workflow = {
      userId,
      name: name || 'Untitled Workflow',
      description: description || '',
      nodes: nodes || [],
      edges: edges || [],
      status: 'draft',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('workflows').add(workflow);
    res.status(201).json({ id: docRef.id, ...workflow });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Update a workflow
app.put('/workflows/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const workflowId = req.params.id;
    const { name, description, nodes, edges, status } = req.body;

    // Verify ownership
    const docRef = db.collection('workflows').doc(workflowId);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    if (doc.data()?.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (nodes !== undefined) updates.nodes = nodes;
    if (edges !== undefined) updates.edges = edges;
    if (status !== undefined) updates.status = status;

    await docRef.update(updates);
    res.json({ id: workflowId, ...updates });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// Delete a workflow
app.delete('/workflows/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const workflowId = req.params.id;

    const docRef = db.collection('workflows').doc(workflowId);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    if (doc.data()?.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await docRef.delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// ============ Task API ============

// Get all tasks for current user
app.get('/tasks', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const { status } = req.query;

    let query = db.collection('tasks').where('userId', '==', userId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Create a new task
app.post('/tasks', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const { title, description, workflowId, priority } = req.body;

    const task = {
      userId,
      title: title || 'Untitled Task',
      description: description || '',
      workflowId: workflowId || null,
      priority: priority || 'medium',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('tasks').add(task);
    res.status(201).json({ id: docRef.id, ...task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task status
app.patch('/tasks/:id/status', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const taskId = req.params.id;
    const { status } = req.body;

    const docRef = db.collection('tasks').doc(taskId);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (doc.data()?.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await docRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ id: taskId, status });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
app.delete('/tasks/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const taskId = req.params.id;

    const docRef = db.collection('tasks').doc(taskId);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (doc.data()?.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await docRef.delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ============ Naver API ============

// Naver News Search
app.post('/naver/news', authenticate, async (req, res) => {
  try {
    const { query, display = 10, start = 1, sort = 'date' } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const clientId = functions.config().naver?.client_id;
    const clientSecret = functions.config().naver?.client_secret;

    if (!clientId || !clientSecret) {
      res.status(500).json({ error: 'Naver API credentials not configured' });
      return;
    }

    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=${sort}`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Naver API error:', errorText);
      res.status(response.status).json({ error: 'Naver API request failed' });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error searching Naver news:', error);
    res.status(500).json({ error: 'Failed to search news' });
  }
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);

// Firestore trigger: Log when a new user document is created
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`User document created for ${user.uid}`);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});
