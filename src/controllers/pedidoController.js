const db = require('../config/db'); // Importamos la conexión a la base de datos

// Función para que la vendedora registre un paquete rápido
const registrarPedido = async (req, res) => {
    // 1. Extraemos los datos que la vendedora escribe en Thunder Client
    const { cliente, paquetes, entrega, socia_representante } = req.body;
    
    // 2. Extraemos el ID de la vendedora directamente del Token (seguridad)
    const vendedora_id = req.user.id;

    try {
        // 3. Preparamos la consulta SQL (usamos los nombres exactos de tu tabla en Supabase)
        const query = `
            INSERT INTO pedidos (vendedora_id, cliente, paquetes, entrega, socia_representante)
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`;
        
        // 4. Ejecutamos la consulta
        // El operador || null sirve para que si no hay socia, se guarde vacío
        const valores = [vendedora_id, cliente, paquetes, entrega, socia_representante || null];
        const resultado = await db.query(query, valores);

        // 5. Respondemos que todo salió bien
        res.status(201).json({
            mensaje: "📦 ¡Pedido registrado con éxito!",
            pedido: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error en registrarPedido:", error);
        res.status(500).json({ error: "No se pudo guardar el pedido: " + error.message });
    }
};

// Función opcional para que la vendedora vea sus propios pedidos
const listarMisPedidos = async (req, res) => {
    const vendedora_id = req.usuario.id;
    try {
        const resultado = await db.query(
            'SELECT * FROM pedidos WHERE vendedora_id = $1 ORDER BY created_at DESC', 
            [vendedora_id]
        );
        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const listarTodosLosPedidos = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id, 
                p.cliente, 
                p.paquetes, 
                p.entrega, 
                p.estado,
                u.nombre as vendedora_nombre,
                u.codigo_personal as vendedora_codigo
            FROM pedidos p
            JOIN users u ON p.vendedora_id = u.id
            ORDER BY p.created_at DESC`;

        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const listarPedidosParaAdmin = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id, 
                p.cliente, 
                p.paquetes, 
                p.entrega, 
                COALESCE(p.socia_representante, 'Entrega Personal') as socia_representante,
                p.estado,
                u.nombre AS vendedora,
                u.codigo_personal AS codigo
            FROM pedidos p
            INNER JOIN users u ON p.vendedora_id = u.id
            ORDER BY p.created_at DESC`;

        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const reporteMensualPaquetes = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.codigo_personal, 
                u.nombre, 
                SUM(p.paquetes) as total_paquetes,
                COUNT(p.id) as cantidad_pedidos
            FROM users u
            INNER JOIN pedidos p ON u.id = p.vendedora_id
            GROUP BY u.codigo_personal, u.nombre
            ORDER BY total_paquetes DESC`;

        const resultado = await db.query(query);
        res.json({
            mensaje: "Resumen de paquetes por vendedora 📈",
            reporte: resultado.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const reportePorFecha = async (req, res) => {
    // Recibimos la fecha desde la URL (ejemplo: ?fecha=2026-03-21)
    const { fecha } = req.query; 

    if (!fecha) {
        return res.status(400).json({ mensaje: "Por favor, selecciona una fecha de entrega." });
    }

    try {
        const query = `
            SELECT 
                u.codigo_personal, 
                u.nombre, 
                SUM(p.paquetes) as total_paquetes
            FROM users u
            INNER JOIN pedidos p ON u.id = p.vendedora_id
            WHERE p.entrega = $1
            GROUP BY u.codigo_personal, u.nombre
            ORDER BY total_paquetes DESC`;

        const resultado = await db.query(query, [fecha]);
        
        res.json({
            fecha_reporte: fecha,
            conteo: resultado.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const cambiarEstadoPedido = async (req, res) => {
    const { id } = req.params; // El ID del pedido
    const { nuevo_estado } = req.body; // Ejemplo: 'en sede', 'entregado', 'cancelado'

    try {
        const query = `
            UPDATE pedidos 
            SET estado = $1 
            WHERE id = $2 
            RETURNING *`;
        
        const resultado = await db.query(query, [nuevo_estado, id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ mensaje: "No se encontró el paquete." });
        }

        res.json({
            mensaje: `📦 Paquete actualizado a: ${nuevo_estado}`,
            pedido: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const listaChequeoSabado = async (req, res) => {
    const { fecha } = req.query; // Ejemplo: ?fecha=2024-03-21
    try {
        const query = `
            SELECT 
                u.codigo_personal, 
                u.nombre AS vendedora, 
                COALESCE(p.socia_representante, 'Entrega Personal') as socia_representante,
                p.cliente,
                p.paquetes,
                p.estado,
                p.id
            FROM pedidos p
            JOIN users u ON p.vendedora_id = u.id
            WHERE p.entrega = $1
            ORDER BY u.codigo_personal ASC`;

        const resultado = await db.query(query, [fecha]);
        res.json({
            fecha: fecha,
            total_pedidos: resultado.rowCount,
            revision: resultado.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const reporteFaltantes = async (req, res) => {
    const { fecha } = req.query; 

    if (!fecha) {
        return res.status(400).json({ mensaje: "Por favor, indica la fecha del sábado de entrega." });
    }

    try {
        const query = `
            SELECT 
                u.codigo_personal, 
                u.nombre AS vendedora, 
                u.telefono,
                p.paquetes, 
                COALESCE(p.socia_representante, 'Entrega Personal') as socia_representante,
                p.cliente
            FROM pedidos p
            JOIN users u ON p.vendedora_id = u.id
            WHERE p.entrega = $1 AND p.estado = 'pendiente'
            ORDER BY u.nombre ASC`;

        const resultado = await db.query(query, [fecha]);

        res.json({
            fecha_revision: fecha,
            total_faltantes: resultado.rowCount,
            vendedoras_por_llamar: resultado.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- MUY IMPORTANTE: Exportar las funciones para que las rutas las vean ---
module.exports = { 
    registrarPedido, 
    listarMisPedidos,
    listarTodosLosPedidos,
    listarPedidosParaAdmin,
    reporteMensualPaquetes,
    reportePorFecha,
    cambiarEstadoPedido,
    listaChequeoSabado,
    reporteFaltantes
};