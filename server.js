 server.js - Servidor Backend Operativo para Mariano Melgar
const express = require('express');
const webpush = require('web-push');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PUBLIC_VAPID = process.env.PUBLIC_VAPID_KEY  'TU_CLAVE_PUBLICA_VAPID';
const PRIVATE_VAPID = process.env.PRIVATE_VAPID_KEY  'TU_CLAVE_PRIVADA_VAPID';

webpush.setVapidDetails(
    'mailtoalerta@marianomelgar.gob.pe',
    PUBLIC_VAPID,
    PRIVATE_VAPID
);

 Almacenamiento en memoria (se sugiere conectar con PostgreSQL en producción)
let pushSubscriptions = [];
let meshStatusLogs = [];

 1. Registro de suscripciones Push
app.post('apisubscribe', (req, res) = {
    const sub = req.body;
    if (!sub  !sub.endpoint) return res.status(400).json({ error 'Suscripción inválida' });
    
    if (!pushSubscriptions.some(s = s.endpoint === sub.endpoint)) {
        pushSubscriptions.push(sub);
        console.log(`[PUSH] Nuevo dispositivo registrado. Total ${pushSubscriptions.length}`);
    }
    res.status(201).json({ status 'Suscrito con éxito' });
});

 2. Recepción de Estado Vecinal (Red Mesh Server-Assisted)
app.post('apimeshbroadcast', (req, res) = {
    const { status, location, timestamp } = req.body;
    const newLog = {
        id Date.now(),
        status status  'Desconocido',
        location location  { lat -16.3989, lng -71.5040 },
        timestamp timestamp  new Date().toISOString()
    };
    
    meshStatusLogs.unshift(newLog);
    meshStatusLogs = meshStatusLogs.slice(0, 50);  Mantener los últimos 50 reportes
    
    console.log(`[MESH VECINAL] Estado reportado ${status}`);
    res.status(200).json({ status 'Reporte registrado', logs meshStatusLogs.slice(0, 10) });
});

 3. Endpoint para consultar reportes vecinales activos
app.get('apimeshlogs', (req, res) = {
    res.status(200).json(meshStatusLogs.slice(0, 10));
});

 4. Emisión Masiva de Alerta Sísmica (COEL  Municipalidad)
app.post('apisend-alert', async (req, res) = {
    const { mag, location, distance } = req.body;
    
    const payload = JSON.stringify({
        title `🚨 ALERTA SÍSMICA - M ${mag  '5.5'}`,
        body `Sismo en ${location  'Arequipa'} a ${distance  '120'} km. Dirígete a tu punto seguro.`,
        icon 'httpscdn-icons-png.flaticon.com512862862819.png',
        url ''
    });

    const dispatch = pushSubscriptions.map(sub = 
        webpush.sendNotification(sub, payload).catch(err = {
            if (err.statusCode === 410  err.statusCode === 404) {
                pushSubscriptions = pushSubscriptions.filter(s = s.endpoint !== sub.endpoint);
            }
        })
    );

    await Promise.all(dispatch);
    res.status(200).json({ status 'Alerta emitida', receptores pushSubscriptions.length });
});

const PORT = process.env.PORT  3000;
app.listen(PORT, () = console.log(`Servidor de Alertas activo en puerto ${PORT}`));