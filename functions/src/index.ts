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

// ============ OpenAI API ============

// GPT 감성 분석
app.post('/openai/sentiment', authenticate, async (req, res) => {
  try {
    const { items, textField = 'description', model = 'gpt-3.5-turbo' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Items array is required' });
      return;
    }

    const apiKey = functions.config().openai?.api_key;
    if (!apiKey) {
      res.status(500).json({ error: 'OpenAI API key not configured' });
      return;
    }

    // 각 아이템에 대해 감성 분석 수행
    const results = await Promise.all(
      items.slice(0, 20).map(async (item: any) => {
        const text = item[textField] || '';
        if (!text) {
          return { ...item, sentiment: 'neutral', confidence: 0.5 };
        }

        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'system',
                  content: 'You are a sentiment analysis assistant. Analyze the sentiment of the given text and respond with ONLY a JSON object in this exact format: {"sentiment": "positive" or "negative" or "neutral", "confidence": 0.0 to 1.0}. No other text.'
                },
                {
                  role: 'user',
                  content: text.substring(0, 500)
                }
              ],
              temperature: 0.3,
              max_tokens: 50,
            }),
          });

          if (!response.ok) {
            console.error('OpenAI API error:', await response.text());
            return { ...item, sentiment: 'neutral', confidence: 0.5 };
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';

          try {
            const parsed = JSON.parse(content);
            return {
              ...item,
              sentiment: parsed.sentiment || 'neutral',
              confidence: parsed.confidence || 0.5,
            };
          } catch {
            // JSON 파싱 실패 시 텍스트에서 감성 추출
            const lower = content.toLowerCase();
            let sentiment = 'neutral';
            if (lower.includes('positive')) sentiment = 'positive';
            else if (lower.includes('negative')) sentiment = 'negative';
            return { ...item, sentiment, confidence: 0.7 };
          }
        } catch (error) {
          console.error('Sentiment analysis error:', error);
          return { ...item, sentiment: 'neutral', confidence: 0.5 };
        }
      })
    );

    res.json({ results });
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// GPT 텍스트 생성
app.post('/openai/generate', authenticate, async (req, res) => {
  try {
    const { prompt, context, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 1000 } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const apiKey = functions.config().openai?.api_key;
    if (!apiKey) {
      res.status(500).json({ error: 'OpenAI API key not configured' });
      return;
    }

    // 컨텍스트가 있으면 프롬프트에 추가
    let fullPrompt = prompt;
    if (context) {
      const contextStr = typeof context === 'string' ? context : JSON.stringify(context, null, 2);
      fullPrompt = `Context:\n${contextStr.substring(0, 3000)}\n\nTask: ${prompt}`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      res.status(response.status).json({ error: 'OpenAI API request failed' });
      return;
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';

    res.json({
      text: generatedText,
      model,
      usage: data.usage
    });
  } catch (error) {
    console.error('Error generating text:', error);
    res.status(500).json({ error: 'Failed to generate text' });
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
