const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Claves VAPID con fallback correcto
const PUBLIC_VAPID = process.env.PUBLIC_VAPID_KEY || 'TU_CLAVE_PUBLICA_VAPID';
const PRIVATE_VAPID = process.env.PRIVATE_VAPID_KEY || 'TU_CLAVE_PRIVADA_VAPID';

// Ruta principal de prueba
app.get('/', (req, res) => {
  res.send('Servidor Backend Operativo para Mariano Melgar');
});

// Listener para el puerto
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
