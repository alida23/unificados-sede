const db = require('../config/db');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

// 1. REGISTRAR USUARIO/VENDEDORA
const registrarVendedora = async (req, res) => {
    // Usamos 'username' en lugar de 'email'
    const { nombre, telefono, username, password, rol, codigo_personal } = req.body;

    try {
        // Encriptamos la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO users (nombre, telefono, username, password, rol, codigo_personal) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`;
            
        const values = [nombre, telefono, username, hashedPassword, rol || 'vendedora', codigo_personal];
        
        const resultado = await db.query(query, values);
        res.status(201).json({ 
            mensaje: "¡Usuario registrado con éxito! 🔒",
            usuario: {
                nombre: resultado.rows[0].nombre,
                username: resultado.rows[0].username,
                codigo: resultado.rows[0].codigo_personal
            }
        });
    } catch (error) {
        // Error de duplicado (Código 23505 en PostgreSQL)
        if (error.code === '23505') {
            return res.status(400).json({ error: "El nombre de usuario o código personal ya existen. ⚠️" });
        }
        res.status(500).json({ error: error.message });
    }
};

// 2. LOGIN (A prueba de Mayúsculas y Espacios)
const login = async (req, res) => {
    let { username, password } = req.body;

    // Limpiamos espacios en blanco accidentales
    if (username) username = username.trim();

    try {
        // Buscamos ignorando mayúsculas/minúsculas
        const resultado = await db.query(
            'SELECT * FROM users WHERE LOWER(username) = LOWER($1)', 
            [username]
        );
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        const usuario = resultado.rows[0];

        // Comparamos la contraseña
        const esValida = await bcrypt.compare(password, usuario.password);

        if (!esValida) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta ❌" });
        }
        
        // Generamos el Token JWT (incluimos el código_personal para reportes)
        const token = jwt.sign(
            { 
                id: usuario.id, 
                rol: usuario.rol, 
                codigo: usuario.codigo_personal 
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ 
            mensaje: "¡Bienvenida al sistema! 🎉",
            token: token,
            usuario: { 
                id: usuario.id,
                nombre: usuario.nombre, 
                rol: usuario.rol 
            } 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. LISTAR TODAS LAS VENDEDORAS
const obtenerVendedoras = async (req, res) => {
    try {
        const resultado = await db.query('SELECT id, nombre, telefono, username, rol, codigo_personal FROM users ORDER BY created_at DESC');
        res.status(200).json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. BUSCAR POR TELÉFONO
const obtenerVendedoraPorTelefono = async (req, res) => {
    const { telefono } = req.params; 
    try {
        const resultado = await db.query('SELECT id, nombre, telefono, username, rol, codigo_personal FROM users WHERE telefono = $1', [telefono]);
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: "No hay vendedora con ese teléfono 📱" });
        }
        
        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. ACTUALIZAR DATOS
const actualizarVendedora = async (req, res) => {
    const { telefono } = req.params; 
    const { nombre, rol, username } = req.body; 

    try {
        const query = `
            UPDATE users 
            SET nombre = $1, rol = $2, username = $3 
            WHERE telefono = $4 
            RETURNING *`;
        
        const valores = [nombre, rol, username, telefono];
        const resultado = await db.query(query, valores);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: "No se encontró el usuario para actualizar" });
        }

        res.json({
            mensaje: "¡Datos actualizados con éxito! ✨",
            usuario: resultado.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. ELIMINAR USUARIO
const eliminarVendedora = async (req, res) => {
    const { telefono } = req.params; 

    try {
        const query = 'DELETE FROM users WHERE telefono = $1 RETURNING *';
        const resultado = await db.query(query, [telefono]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({ 
                mensaje: "No se encontró el usuario con ese teléfono 🔍" 
            });
        }

        res.json({ 
            mensaje: "¡Usuario eliminado correctamente! ❌",
            usuarioEliminado: resultado.rows[0].nombre 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 7. RUTA DE PRUEBA PANEL ADMIN
const panelAdmin = async (req, res) => {
    res.json({
        mensaje: "¡Bienvenida al Panel Maestro, Alida!. 📊"
    });
};

// EXPORTAMOS TODO
module.exports = { 
    registrarVendedora, 
    obtenerVendedoraPorTelefono,
    obtenerVendedoras, 
    actualizarVendedora, 
    eliminarVendedora,
    login,
    panelAdmin
};