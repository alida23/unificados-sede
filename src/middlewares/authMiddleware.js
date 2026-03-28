const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) return res.status(401).json({ mensaje: "Acceso denegado. No hay token." });

    try {
        const cifrado = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.usuario = cifrado; // Guardamos los datos del usuario en la petición
        next(); // ¡Pase adelante!
    } catch (error) {
        res.status(400).json({ mensaje: "Token no válido." });
    }
};

// Este guardia solo deja pasar si el rol en el token es 'admin'
const esAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ mensaje: "Acceso denegado. Solo administradoras. 🚫" });
    }
    next();
};

// al final
module.exports = { verificarToken, esAdmin };
