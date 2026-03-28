const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');


// --- 1. RUTAS PÚBLICAS (Cualquiera entra) ---
router.post('/registrar', userController.registrarVendedora);
router.post('/login', userController.login);

// --- 2. RUTAS PROTEGIDAS (Necesitan Token) ---
// Ahora 'listar' SIEMPRE pedirá token
router.get('/listar', verificarToken, userController.obtenerVendedoras);
router.get('/buscar/:telefono', verificarToken, userController.obtenerVendedoraPorTelefono);
router.post('/admin-only', verificarToken, userController.panelAdmin); // <--- Le pusimos el guardia

// SOLO la admin puede actualizar o borrar (necesita token Y ser admin)
router.put('/buscar/:telefono', verificarToken, esAdmin, userController.actualizarVendedora);
router.delete('/buscar/:telefono', verificarToken, esAdmin, userController.eliminarVendedora);

// --- 3. RUTAS POR TELÉFONO (También deberían ser protegidas) ---
router.get('/buscar/:telefono', verificarToken, userController.obtenerVendedoraPorTelefono);
router.put('/buscar/:telefono', verificarToken, userController.actualizarVendedora);
router.delete('/buscar/:telefono', verificarToken, userController.eliminarVendedora);

module.exports = router;