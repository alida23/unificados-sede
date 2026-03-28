// auth.js - Solo define la función, no la ejecuta sola
function verificarAcceso(tipoPagina) {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');

    if (tipoPagina === 'admin') {
        if (token !== 'true' || rol !== 'admin') {
            window.location.replace('index.html');
            return false;
        }
    }

    if (tipoPagina === 'vendedora') {
        if (token !== 'true') {
            window.location.replace('index.html');
            return false;
        }
    }

    if (tipoPagina === 'login') {
        if (token === 'true') {
            window.location.replace(rol === 'admin' ? 'admin.html' : 'vendedora.html');
            return false;
        }
    }
    return true;
}