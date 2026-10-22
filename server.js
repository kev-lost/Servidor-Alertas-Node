const express = require('express');
const cors = require('cors');
const webpush = require('web-push');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Claves VAPID oficiales
const publicVapidKey = process.env.PUBLIC_VAPID_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvBX45TW3P24f_0O392_q0fO-7_L6q_p0p_o0123456789abcdefgh';
const privateVapidKey = process.env.PRIVATE_VAPID_KEY || 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V';

webpush.setVapidDetails(
  'mailto:alertas@marianomelgar.gob.pe',
  publicVapidKey,
  privateVapidKey
);

// Base de datos temporal en memoria
let subscriptions = [];
let meshLogs = [];

// Ruta de diagnóstico
app.get('/', (req, res) => {
  res.send('Servidor Backend Operativo para Mariano Melgar');
});

// 1. Registrar dispositivo
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Suscripción inválida' });
  }

  const exists = subscriptions.some(s => s.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
  }

  res.status(201).json({ message: 'Dispositivo registrado para alertas push' });
});

// 2. Enviar notificación masiva a todos los celulares
app.post('/api/send-notification', async (req, res) => {
  const { title, message } = req.body;

  const payload = JSON.stringify({
    title: title || '🚨 ALERTA MARIANO MELGAR',
    body: message || 'Se ha reportado una emergencia vecinal.',
    icon: '/icon-192.png'
  });

  const pushPromises = subscriptions.map(subscription =>
    webpush.sendNotification(subscription, payload).catch(err => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        subscriptions = subscriptions.filter(s => s.endpoint !== subscription.endpoint);
      }
    })
  );

  await Promise.all(pushPromises);
  res.status(200).json({ message: 'Notificaciones enviadas', totalDispositivos: subscriptions.length });
});

// 3. Transmisión de estado vecinal (Red Mesh)
app.post('/api/mesh/broadcast', (req, res) => {
  const { status, location, timestamp } = req.body;
  const newLog = { status, location, timestamp: timestamp || new Date().toISOString() };
  meshLogs.unshift(newLog);
  meshLogs = meshLogs.slice(0, 10);
  res.status(200).json({ status: 'ok', logs: meshLogs });
});

app.listen(PORT, () => {
  console.log(`Servidor de Alertas activo en puerto ${PORT}`);
});
