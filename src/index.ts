import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Firebase Admin SDK
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('Missing Firebase configuration in environment variables.');
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped newlines
  }),
});

const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Middleware para manejar errores async
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function (req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

// Endpoint para obtener todas las tareas
app.get('/tasks', asyncHandler(async (req: Request, res: Response) => {
  const tasksSnapshot = await db.collection('tasks').orderBy('createdAt', 'desc').get();
  const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.status(200).json(tasks);
}));

// Endpoint para agregar una nueva tarea
app.post('/tasks', asyncHandler(async (req: Request, res: Response) => {
  const { title, description, userId } = req.body;
  if (!title || !userId) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const newTask = {
    title,
    description: description || '',
    userId,
    completed: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const taskRef = await db.collection('tasks').add(newTask);
  const taskDoc = await taskRef.get();
  res.status(201).json({ id: taskRef.id, ...taskDoc.data() });
}));

// Endpoint para actualizar una tarea existente
app.put('/tasks/:id', asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.id;
  const updateData = req.body;
  if (updateData.createdAt) {
    delete updateData.createdAt; // No permitir actualizar createdAt
  }
  await db.collection('tasks').doc(taskId).update(updateData);
  const updatedTask = await db.collection('tasks').doc(taskId).get();
  res.status(200).json({ id: updatedTask.id, ...updatedTask.data() });
}));

// Endpoint para eliminar una tarea existente
app.delete('/tasks/:id', asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.id;
  await db.collection('tasks').doc(taskId).delete();
  res.status(200).json({ message: 'Tarea eliminada correctamente' });
}));

// Endpoint para buscar usuario por correo
app.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) {
    return res.status(400).json({ error: 'Correo es requerido' });
  }
  const usersSnapshot = await db.collection('users').where('email', '==', email).get();
  if (usersSnapshot.empty) {
    return res.status(404).json({ exists: false });
  }
  const user = usersSnapshot.docs[0].data();
  res.status(200).json({ exists: true, user });
}));

// Endpoint para agregar un nuevo usuario
app.post('/users', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Correo es requerido' });
  }
  const usersSnapshot = await db.collection('users').where('email', '==', email).get();
  if (!usersSnapshot.empty) {
    return res.status(409).json({ error: 'Usuario ya existe' });
  }
  const newUser = { email, createdAt: admin.firestore.FieldValue.serverTimestamp() };
  const userRef = await db.collection('users').add(newUser);
  const userDoc = await userRef.get();
  res.status(201).json({ id: userRef.id, ...userDoc.data() });
}));

// Middleware para manejo de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
