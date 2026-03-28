const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

// El error suele estar en esta línea:
router.post('/registrar', verificarToken, pedidoController.registrarPedido);
router.get('/reporte-admin', verificarToken, esAdmin, pedidoController.reporteMensualPaquetes);
router.get('/reporte-sabado', verificarToken, esAdmin, pedidoController.reportePorFecha);
router.put('/actualizar-estado/:id', verificarToken, esAdmin, pedidoController.cambiarEstadoPedido);
router.get('/check-list', verificarToken, esAdmin, pedidoController.listaChequeoSabado);
router.get('/faltantes', verificarToken, esAdmin, pedidoController.reporteFaltantes);

module.exports = router;