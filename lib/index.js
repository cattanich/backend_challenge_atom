"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const admin = __importStar(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: '*' })); // Allow all origins
app.use(express_1.default.json());
// Middleware para manejar errores async
function asyncHandler(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    };
}
// Endpoint para obtener todas las tareas
app.get('/tasks', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tasksSnapshot = yield db.collection('tasks').orderBy('createdAt', 'desc').get();
    const tasks = tasksSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    res.status(200).json(tasks);
})));
// Endpoint para agregar una nueva tarea
app.post('/tasks', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const taskRef = yield db.collection('tasks').add(newTask);
    const taskDoc = yield taskRef.get();
    res.status(201).json(Object.assign({ id: taskRef.id }, taskDoc.data()));
})));
// Endpoint para actualizar una tarea existente
app.put('/tasks/:id', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = req.params.id;
    const updateData = req.body;
    if (updateData.createdAt) {
        delete updateData.createdAt; // No permitir actualizar createdAt
    }
    yield db.collection('tasks').doc(taskId).update(updateData);
    const updatedTask = yield db.collection('tasks').doc(taskId).get();
    res.status(200).json(Object.assign({ id: updatedTask.id }, updatedTask.data()));
})));
// Endpoint para eliminar una tarea existente
app.delete('/tasks/:id', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = req.params.id;
    yield db.collection('tasks').doc(taskId).delete();
    res.status(200).json({ message: 'Tarea eliminada correctamente' });
})));
// Endpoint para buscar usuario por correo
app.get('/users', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.query.email;
    if (!email) {
        return res.status(400).json({ error: 'Correo es requerido' });
    }
    const usersSnapshot = yield db.collection('users').where('email', '==', email).get();
    if (usersSnapshot.empty) {
        return res.status(404).json({ exists: false });
    }
    const user = usersSnapshot.docs[0].data();
    res.status(200).json({ exists: true, user });
})));
// Endpoint para agregar un nuevo usuario
app.post('/users', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Correo es requerido' });
    }
    const usersSnapshot = yield db.collection('users').where('email', '==', email).get();
    if (!usersSnapshot.empty) {
        return res.status(409).json({ error: 'Usuario ya existe' });
    }
    const newUser = { email, createdAt: admin.firestore.FieldValue.serverTimestamp() };
    const userRef = yield db.collection('users').add(newUser);
    const userDoc = yield userRef.get();
    res.status(201).json(Object.assign({ id: userRef.id }, userDoc.data()));
})));
// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
