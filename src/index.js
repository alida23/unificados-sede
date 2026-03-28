const express = require('express');
const db = require('./config/db'); 
const userRoutes = require('./routes/userRoutes'); 
const pedidoRoutes = require('./routes/pedidoRoutes.js'); 
const path = require('path'); 
require('dotenv').config();

const app = express(); // <--- Solo una vez
const PORT = 3001; 

// MIDDLEWARES
app.use(express.json());

// SERVIMOS ARCHIVOS ESTÁTICOS (Tu carpeta public)
app.use(express.static(path.join(__dirname, '../public')));

// RUTAS DE LA API
app.use('/api/usuarios', userRoutes);
app.use('/api/pedidos', pedidoRoutes);

// RUTA INICIAL (Opcional, ahora cargará el index.html de public por defecto)
app.get('/test', (req, res) => {
  res.send('El Backend está respondiendo correctamente 🚀');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor en marcha: http://localhost:${PORT}`);
});