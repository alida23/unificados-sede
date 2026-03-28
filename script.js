// ==========================================
// CONFIGURACIÓN DE SUPABASE (CON PROTECCIÓN)
// ==========================================
const SUPABASE_URL = 'https://grmvjlqigftlroymegnc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hXoo50rFhW-9op_yzGEJ3A_lMfGmvDa';
let html5QrCode = null;
let _supabase;

try {
    if (typeof supabase !== 'undefined') {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Conexión con Supabase establecida.");
    } else {
        console.error("La librería de Supabase no se detectó.");
    }
} catch (e) {
    console.error("Error al inicializar Supabase:", e);
}

// Función para obtener Bcrypt
function obtenerBcrypt() {
    if (typeof dcodeIO !== 'undefined' && dcodeIO.bcrypt) return dcodeIO.bcrypt;
    if (typeof bcrypt !== 'undefined') return bcrypt;
    return window.bcrypt || null;
}
    

// ==========================================
// FUNCIÓN GLOBAL PARA REGISTRAR USUARIO
// ==========================================

window.enviarRegistro = async function (e) {
    e.preventDefault();

    const nombre = document.getElementById('reg_nombre').value;
    const username = document.getElementById('reg_username').value;
    const telefono = document.getElementById('reg_telefono').value;
    const codigo = document.getElementById('reg_codigo').value;
    const password = document.getElementById('registro-contrasena').value;
    const rol = document.getElementById('reg_rol').value;

    const lib = obtenerBcrypt();
    const passwordHash = lib ? lib.hashSync(password, 10) : password;

    const { error } = await _supabase.from('users').insert([{
        nombre: nombre,
        username: username,
        telefono: telefono,
        codigo_personal: codigo,
        password: passwordHash,
        rol: rol
    }]);

    if (error) {
        alert("❌ Error: " + error.message);
    } else {
        alert("✅ Usuario registrado correctamente");
        listarUsuarios();
    }
};
// ==========================================
// 1. FUNCIONES DE USUARIOS (ADMIN)
// ==========================================

window.mostrarFormularioRegistro = function () {
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="form-container">
            <h3>📝 Registrar Nuevo Usuario</h3>
            <form id="formRegistroUsuario" class="admin-form">
                <div class="form-grid">
                    <input type="text" id="reg_nombre" placeholder="Nombre Completo" required>
                    <input type="text" id="reg_username" placeholder="Nombre de Usuario" required>
                    <input type="tel" id="reg_telefono" placeholder="Teléfono" required>
                    <input type="text" id="reg_codigo" placeholder="Código Personal" required>
                    <div class="password-wrapper">
                        <input type="password" id="registro-contrasena" placeholder="Contraseña" required>
                        <span id="btnToggleReg" class="toggle-icon">👁️</span>
                    </div>
                    <select id="reg_rol">
                        <option value="vendedora">Vendedora</option>
                        <option value="admin">Administradora</option>
                    </select>
                </div>
                <button type="submit" class="btn-save">Guardar Usuario</button>
            </form>
        </div>
    `;

    // LÓGICA DEL OJITO
    const btnToggle = document.getElementById('btnToggleReg');
    if (btnToggle) {
        btnToggle.addEventListener('click', function () {
            const inputPass = document.getElementById('registro-contrasena');
            if (inputPass) {
                inputPass.type = (inputPass.type === "password") ? "text" : "password";
                this.textContent = (inputPass.type === "password") ? "👁️" : "🔒";
            }
        });
    }
    // LÓGICA DEL BOTÓN GUARDAR
    const formReg = document.getElementById('formRegistroUsuario');
    if (formReg) {
        formReg.addEventListener('submit', function (e) {
            e.preventDefault();
            if (typeof enviarRegistro === 'function') enviarRegistro(e);
        });
    }
}; // <--- AQUÍ SE CIERRA CORRECTAMENTE EL FORMULARIO

// ... El resto de tus funciones (listarUsuarios, logout, etc.) están bien de estructura

window.listarUsuarios = async function () {
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) return;
    contenedor.innerHTML = "<p>Cargando usuarios...</p>";
    const { data: usuarios, error } = await _supabase.from('users').select('*');

    if (error) {
        contenedor.innerHTML = `<p style="color:red;">❌ Error: ${error.message}</p>`;
        return;
    }


    let html = `
        <div class="table-container">
            <h3>👥 Usuarios Registrados</h3>
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>Código</th><th>Nombre</th><th>Usuario</th><th>Teléfono</th><th>Rol</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>`;
    usuarios.forEach(u => {
        html += `
            <tr>
                <td>${u.codigo_personal}</td>
                <td>${u.nombre}</td>
                <td>${u.username}</td>
                <td>${u.telefono}</td>
                <td><span class="badge ${u.rol}">${u.rol}</span></td>
                <td>
                    <button onclick='mostrarFormularioEdicion(${JSON.stringify(u)})' class="btn-edit">✏️</button>
                    <button onclick="eliminarUsuario('${u.id}')" class="btn-delete">❌</button>
                </td>
            </tr>`;
    });
    html += `</tbody></table></div>`;
    contenedor.innerHTML = html;
};

// ✅ PONLO ARRIBA O ABAJO, PERO SUELTO
window.logout = function () {
    localStorage.removeItem('token');
    localStorage.removeItem('idUsuario');
    localStorage.removeItem('nombreUsuario');
    localStorage.removeItem('rol');

    window.location.replace('login.html');
};

// ==========================================
// 2. LÓGICA DE INICIO DE SESIÓN (SOLO FORMULARIO)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userIn = document.getElementById('username').value.trim();
            const passIn = document.getElementById('password').value.trim();

            // Consultar a Supabase
            const { data: usuarios, error } = await _supabase
                .from('users')
                .select('*')
                .eq('username', userIn);

            if (error) return alert("Error: " + error.message);

            if (usuarios && usuarios.length > 0) {
                const usuario = usuarios[0];
                const lib = obtenerBcrypt();
                let coinciden = false;

                if (usuario.password.startsWith('$2')) {
                    coinciden = lib ? lib.compareSync(passIn, usuario.password) : false;
                } else {
                    coinciden = (passIn === usuario.password);
                }

                if (coinciden) {
                    // Guardamos la sesión
                    localStorage.setItem('token', 'true');
                    localStorage.setItem('idUsuario', usuario.id);
                    localStorage.setItem('nombreUsuario', usuario.nombre);
                    localStorage.setItem('rol', usuario.rol);

                    // Redirigimos
                    window.location.replace(usuario.rol === 'admin' ? 'admin.html' : 'vendedora.html');
                } else {
                    alert("❌ Contraseña incorrecta");
                }
            } else {
                alert("❌ El usuario no existe.");
            }
        });
    }
});

// ==========================================
// 3. GESTIÓN DE PEDIDOS (CORREGIDO)
// ==========================================

window.abrirEscannerQR = async function () {
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) return;

    if (html5QrCode) {
        try {
            if (html5QrCode.getState() === 2) await html5QrCode.stop();
            await html5QrCode.clear();
        } catch (e) { }
    }

    contenedor.innerHTML = `
        <style>
            body, html { overflow-x: hidden !important; position: relative; }
            .scanner-fix-container { width: 100%; max-width: 400px; margin: 0 auto; position: relative; z-index: 10; }
            #reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; position: absolute !important; top: 0; left: 0; }
            #reader { width: 100% !important; padding-top: 100% !important; position: relative !important; overflow: hidden !important; background: #000; border-radius: 15px; border: 2px solid #3498db; }
        </style>

        <div class="form-container scanner-fix-container">
            <h3 style="margin-bottom: 15px; text-align: center;">📷 Lector Activo</h3>
            <div id="reader"></div>
            <div id="resultado-scan" style="margin-top: 15px; padding: 12px; background: #f0fdf4; border-radius: 8px; text-align: center; font-weight: bold; color: #166534;">
                Esperando código QR...
            </div>
            <button onclick="detenerEscanner()" class="btn-delete" style="width: 100%; margin-top: 15px; padding: 12px; font-weight: bold;">
                ❌ Cerrar y Regresar
            </button>
            <input type="text" id="input-pistola" style="position: absolute; opacity: 0; pointer-events: none;">
        </div>
    `;

    html5QrCode = new Html5Qrcode("reader");
    const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        videoConstraints: { width: { ideal: 640 }, height: { ideal: 640 } }
    };

    try {
        window.scrollTo(0, 0);
        setTimeout(async () => {
            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                async (text) => {
                    document.getElementById('resultado-scan').innerText = "✅ Código: " + text;
                    if (typeof marcarPedidoRecibido === 'function') {
                        await marcarPedidoRecibido(text);
                    }
                }
            );
            document.getElementById('input-pistola')?.focus();
        }, 200);
    } catch (err) {
        console.error(err);
        document.getElementById('resultado-scan').innerHTML = `<span style="color:red">⚠️ Error de acceso a cámara</span>`;
    }
};

window.detenerEscanner = async function () {
    // CAMBIO DE SEGURIDAD: Solo procede si la variable html5QrCode existe y no es nula
    if (typeof html5QrCode !== 'undefined' && html5QrCode !== null) {
        try {
            // Verificamos si está corriendo (State 2 es SCANNING)
            if (typeof html5QrCode.getState === 'function' && html5QrCode.getState() === 2) {
                await html5QrCode.stop();
            }
            await html5QrCode.clear();
            html5QrCode = null;
        } catch (err) {
            console.warn("Error al detener escáner:", err);
        }
    }

    // Limpieza del contenedor
    const contenedor = document.getElementById('contenedor-dinamico');
    if (contenedor) {
        contenedor.innerHTML = "<h3>Selecciona una opción del menú</h3>";
    }
};

// ==========================================
// 4. REGISTRO DE PAQUETES (ADMIN)
// ==========================================

window.mostrarFormularioPaquete = function () {
    if (window.detenerEscanner) window.detenerEscanner();
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) return;

    const hoy = new Date().toISOString().split('T')[0];
    contenedor.innerHTML = `
        <div class="form-container">
            <h3>📥 Registrar Nuevo Paquete</h3>
            <form id="formRegistroPaquete" class="admin-form">
                <div class="form-grid">
                    <div>
                        <label>Nombre del Cliente</label>
                        <input type="text" id="p_cliente" placeholder="Nombre del cliente" required>
                    </div>
                    <div>
                        <label>Cantidad de Paquetes</label>
                        <input type="number" id="p_cantidad" value="1" min="1" required>
                    </div>
                    <div>
                        <label>Fecha de Entrega</label>
                        <input type="date" id="p_entrega" value="${hoy}" required>
                    </div>
                    <div>
                        <label>Socia / Representante</label>
                        <input type="text" id="p_socia" placeholder="Nombre de quien entrega">
                    </div>
                </div>
                <button type="submit" class="btn-save" id="btnGuardarPaquete" style="margin-top:20px;">Guardar Pedido</button>
            </form>
            <div id="mensaje-status" style="margin-top:15px; text-align:center;"></div>
        </div>
    `;

    document.getElementById('formRegistroPaquete').addEventListener('submit', guardarNuevoPaquete);
};

window.guardarNuevoPaquete = async function (e) {
    e.preventDefault();
    const btn = document.getElementById('btnGuardarPaquete');
    const status = document.getElementById('mensaje-status');
    btn.disabled = true;
    btn.innerText = "Guardando...";

    const vendedoraId = localStorage.getItem('idUsuario');
    const nuevoPedido = {
        cliente: document.getElementById('p_cliente').value,
        paquetes: parseInt(document.getElementById('p_cantidad').value),
        entrega: document.getElementById('p_entrega').value, // <--- Verifica que esta línea exista
        socia_representante: document.getElementById('p_socia').value,
        vendedora_id: vendedoraId,
        estado: 'pendiente'
    };

    const { error } = await _supabase.from('pedidos').insert([nuevoPedido]);
    if (error) {
        status.innerHTML = `<p style="color:red;">❌ Error: ${error.message}</p>`;
        btn.disabled = false;
        btn.innerText = "Guardar Pedido";
    } else {
        status.innerHTML = `<p style="color:green;">✅ Pedido guardado correctamente</p>`;
        setTimeout(() => { mostrarFormularioPaquete(); }, 1500);
    }
};
// ==========================================
// 5. EDICIÓN Y ELIMINACIÓN DE USUARIOS
// ==========================================

window.mostrarFormularioEdicion = function (usuario) {
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="form-container">
            <h3>✏️ Editar Usuario: ${usuario.nombre}</h3>
            <form id="formEditarUsuario" class="admin-form">
                <input type="hidden" id="edit_id" value="${usuario.id}">
                <div class="form-grid">
                    <input type="text" id="edit_nombre" value="${usuario.nombre}" required placeholder="Nombre">
                    <input type="text" id="edit_username" value="${usuario.username}" required placeholder="Usuario">
                    <input type="tel" id="edit_telefono" value="${usuario.telefono}" required placeholder="Teléfono">
                    <input type="text" id="edit_codigo" value="${usuario.codigo_personal}" required placeholder="Código">
                    <select id="edit_rol">
                        <option value="vendedora" ${usuario.rol === 'vendedora' ? 'selected' : ''}>Vendedora</option>
                        <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Administradora</option>
                    </select>
                </div>
                <div style="margin-top:20px; display:flex; gap:10px;">
                    <button type="submit" class="btn-save">Actualizar Datos</button>
                    <button type="button" onclick="listarUsuarios()" class="btn-delete" style="background:#666;">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('formEditarUsuario').addEventListener('submit', actualizarUsuario);
};

window.actualizarUsuario = async function (e) {
    e.preventDefault();
    const id = document.getElementById('edit_id').value;
    const datosActualizados = {
        nombre: document.getElementById('edit_nombre').value,
        username: document.getElementById('edit_username').value,
        telefono: document.getElementById('edit_telefono').value,
        codigo_personal: document.getElementById('edit_codigo').value,
        rol: document.getElementById('edit_rol').value
    };
    const { error } = await _supabase.from('users').update(datosActualizados).eq('id', id);
    if (error) {
        alert("Error al actualizar: " + error.message);
    } else {
        alert("✅ Usuario actualizado correctamente");
        listarUsuarios();
    }
};

window.eliminarUsuario = async function (id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    const { error } = await _supabase.from('users').delete().eq('id', id);
    if (error) {
        alert("Error al eliminar: " + error.message);
    } else {
        listarUsuarios();
    }
};


// ==========================================
// 6. CHECK-LIST GENERAL (UNIFICADO: ORDEN INTELIGENTE + MEMORIA)
// ==========================================

let vistaActualChecklist = 'tabla';
let grupoAbiertoId = null; // Esta variable recordará qué cliente tienes desplegado

window.cargarChecklist = async function () {
    if (window.detenerEscanner) window.detenerEscanner();
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) return;

    contenedor.innerHTML = "<p>Cargando lista de paquetes...</p>";
    const { data: pedidos, error } = await _supabase
        .from('pedidos')
        .select('*, users!vendedora_id(nombre)')
        .order('created_at', { ascending: false });

    if (error) {
        contenedor.innerHTML = `<p style="color:red;">❌ Error al cargar: ${error.message}</p>`;
        return;
    }

    if (!pedidos || pedidos.length === 0) {
        contenedor.innerHTML = "<p>No hay paquetes registrados para unificar todavía.</p>";
        return;
    }

    // --- VISTA 1: TABLA TRADICIONAL ---
    const renderTablaNormal = () => {
        let html = `
            <table class="tabla-admin">
                <thead>
                    <tr>
                        <th>ID</th><th>Vendedora</th><th>Estado</th><th>Cliente</th><th>Cant.</th><th>Entrega</th><th>Socia/Rep.</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>`;

        pedidos.forEach(p => {
            const estaRecibido = p.estado === 'recibido';
            const claseEstado = estaRecibido ? 'badge vendedora' : 'badge admin';
            const textoEstado = estaRecibido ? 'RECIBIDO' : 'PENDIENTE';
            const nombreVendedora = p.users ? p.users.nombre : "No asignada";
            const fechaFormateada = p.entrega ? p.entrega.split('-').reverse().join('/') : '---';

            html += `
                <tr style="${estaRecibido ? 'background-color: #f0fdf4;' : ''}">
                    <td><b style="color:#000; font-size: 16px;">#${p.id.toString().slice(-4)}</b></td>
                    <td><span style="color:#000; font-size: 14px;">${nombreVendedora}</span></td>
                    <td><span class="${claseEstado}" style="font-size: 12px;">${textoEstado}</span></td>
                    <td><b style="font-size: 14px;">${p.cliente}</b></td>
                    <td><b style="font-size: 15px;">${p.paquetes}</b></td>
                    <td>${fechaFormateada}</td>
                    <td><span style="color:#000; font-size: 14px;">${p.socia_representante || '---'}</span></td>
                    <td>
                        ${!estaRecibido ? `<button onclick="marcarManual('${p.id}')" class="btn-edit" title="Marcar como Recibido">✔️</button>` : `<span title="Ya en sede">📍</span>`}
                        <button onclick="eliminarPedido('${p.id}')" class="btn-delete" title="Eliminar este registro">❌</button>
                    </td>
                </tr>`;
        });
        html += `</tbody></table>`;
        return html;
    };

    // --- VISTA 2: AGRUPADA POR CLIENTE (CON ORDEN Y MEMORIA) ---
    const renderVistaAgrupada = () => {
        const grupos = {};
        pedidos.forEach(p => {
            if (!grupos[p.cliente]) grupos[p.cliente] = [];
            grupos[p.cliente].push(p);
        });

        // Ordenamos: primero los que tienen pendientes, luego los terminados
        const clientesOrdenados = Object.keys(grupos).sort((a, b) => {
            const pendientesA = grupos[a].filter(p => p.estado !== 'recibido').length;
            const pendientesB = grupos[b].filter(p => p.estado !== 'recibido').length;
            if (pendientesA > 0 && pendientesB === 0) return -1;
            if (pendientesA === 0 && pendientesB > 0) return 1;
            return 0;
        });

        let html = `<div class="agrupado-container">`;

        clientesOrdenados.forEach((cliente) => {
            const items = grupos[cliente];
            // ID único basado en el nombre para que la memoria funcione aunque se mueva de lugar
            const idGrupo = `grupo-${cliente.replace(/\s+/g, '')}`;
            const totalPendientes = items.filter(p => p.estado !== 'recibido').length;

            // Verificamos si este grupo debe estar abierto según la memoria
            const estaAbierto = grupoAbiertoId === idGrupo;
            const displayStyle = estaAbierto ? "block" : "none";
            const iconoFlecha = estaAbierto ? "▲" : "▼";

            const estiloFinalizado = totalPendientes === 0 ? 'opacity: 0.6; border: 1px solid #ccc;' : 'border: 1px solid #e0e0e0;';
            const badgeColor = totalPendientes === 0 ? '#6c757d' : '#28a745'; // Gris si terminó, Verde si falta

            html += `
                <div class="client-group-card" style="${estiloFinalizado} border-radius: 10px; margin-bottom: 10px; background: #fff; overflow: hidden;">
                    <div onclick="toggleAcordeon('${idGrupo}')" style="background: #f8f9fa; padding: 12px 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee;">
                        <div>
                            <span style="font-size: 1.1rem; margin-right: 10px;">${totalPendientes === 0 ? '✅' : '👥'}</span>
                            <strong style="color: var(--primary); font-size: 1.1rem;"> ${cliente} ${totalPendientes === 0 ? '(PAQUETE COMPLETO)' : ''}</strong>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="background: ${badgeColor}; color: #fff; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">
                                ${totalPendientes === 0 ? 'LISTO' : totalPendientes + ' EMPRENDEDORAS PENDIENTES DE UNIFICAR'}
                            </span>
                            <span id="icon-${idGrupo}">${iconoFlecha}</span>
                        </div>
                    </div>
                    
                    <div id="${idGrupo}" style="display: ${displayStyle}; padding: 10px; background: #fff;">
                        ${items.map(p => {
                const vendedora = p.users ? p.users.nombre : "N/A";
                return `
                            <div style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px dashed #ddd; align-items: center; gap: 10px;">
                                <div style="flex: 1.5;">
                                    <div style="color: #000; font-weight: bold; font-size: 13px;">ID: #${p.id.toString().slice(-5)}</div>
                                    <div style="font-weight: bold; color: #000; font-size: 15px; margin: 2px 0;">Vendedora: ${vendedora}</div>
                                    <div style="color: #000; font-size: 14px;">Socia/Rep: ${p.socia_representante || '---'}</div>
                                </div>
                                <div style="flex: 1; text-align: center; border-left: 1px solid #eee; border-right: 1px solid #eee;">
                                    <span style="display: block; font-size: 16px; font-weight: bold; color: #000;">📦 Cant: ${p.paquetes}</span>
                                    <div style="color: ${p.estado === 'recibido' ? '#28a745' : '#f39c12'}; font-weight: 900; font-size: 14px; margin-top: 4px;">
                                        ${p.estado.toUpperCase()}
                                    </div>
                                </div>
                                <div style="display: flex; gap: 15px; padding-left: 10px;">
                                    ${p.estado !== 'recibido' ?
                        `<button onclick="marcarManual('${p.id}')" title="Recibir" style="background:none; border:none; font-size:22px; cursor:pointer; color: #28a745;">✔️</button>` :
                        `<span style="font-size:14px; font-weight: bold; color: #28a745;">En Sede📍</span>`
                    }
                                    <button onclick="eliminarPedido('${p.id}')" title="Eliminar" style="background:none; border:none; font-size:20px; cursor:pointer; color: #dc3545;">❌</button>
                                </div>
                            </div>`;
            }).join('')}
                    </div>
                </div>`;
        });
        html += `</div>`;
        return html;
    };

    // --- FUNCIÓN PARA ABRIR/CERRAR (CON MEMORIA) ---
    window.toggleAcordeon = function (id) {
        const elemento = document.getElementById(id);
        const icono = document.getElementById(`icon-${id}`);
        if (elemento.style.display === "none") {
            elemento.style.display = "block";
            icono.innerText = "▲";
            grupoAbiertoId = id; // Guardamos que Fer abrió este grupo
        } else {
            elemento.style.display = "none";
            icono.innerText = "▼";
            if (grupoAbiertoId === id) grupoAbiertoId = null; // Si lo cierra ella, limpiamos
        }
    };

    const estiloActivo = "padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";
    const estiloInactivo = "padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; background: none;";

    contenedor.innerHTML = `
        <div class="table-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin:0;">✅ Check-List General</h3>
                <div style="display: flex; gap: 5px; background: #eee; padding: 4px; border-radius: 8px;">
                    <button id="btnVistaTabla" title="Ver lista normal" style="${vistaActualChecklist === 'tabla' ? estiloActivo : estiloInactivo}">📋 Tabla</button>
                    <button id="btnVistaAgrupada" title="Vista por Clientes" style="${vistaActualChecklist === 'clientes' ? estiloActivo : estiloInactivo}">👥 Clientes</button>
                </div>
                <button onclick="cargarChecklist()" class="btn-edit" title="Actualizar" style="font-size: 0.8rem;">🔄 Actualizar</button>
            </div>
            <div id="checklist-content">
                ${vistaActualChecklist === 'tabla' ? renderTablaNormal() : renderVistaAgrupada()}
            </div>
        </div>
    `;

    const contentDiv = document.getElementById('checklist-content');
    const btnT = document.getElementById('btnVistaTabla');
    const btnA = document.getElementById('btnVistaAgrupada');

    btnT.onclick = () => {
        vistaActualChecklist = 'tabla';
        contentDiv.innerHTML = renderTablaNormal();
        btnT.style.cssText = estiloActivo;
        btnA.style.cssText = estiloInactivo;
    };

    btnA.onclick = () => {
        vistaActualChecklist = 'clientes';
        contentDiv.innerHTML = renderVistaAgrupada();
        btnA.style.cssText = estiloActivo;
        btnT.style.cssText = estiloInactivo;
    };

    actualizarBarraProgreso(pedidos);
};

window.marcarManual = async function (id) {
    const { error } = await _supabase.from('pedidos').update({ estado: 'recibido' }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else {
        // Al recargar, como 'grupoAbiertoId' tiene valor, el acordeón se quedará abierto
        cargarChecklist();
    }
};

window.eliminarPedido = async function (id) {
    if (!confirm("¿Eliminar este registro de paquete?")) return;
    const { error } = await _supabase.from('pedidos').delete().eq('id', id);
    if (!error) cargarChecklist();
};

function actualizarBarraProgreso(pedidos) {
    const total = pedidos.length;
    const recibidos = pedidos.filter(p => p.estado === 'recibido').length;
    const porcentaje = total > 0 ? Math.round((recibidos / total) * 100) : 0;
    const barra = document.getElementById('progreso-llenado');
    const texto = document.getElementById('porcentaje-texto');
    if (barra && texto) {
        barra.style.width = porcentaje + "%";
        texto.innerText = porcentaje + "%";
    }
}
// ==========================================
// 7. VER PENDIENTES (FILTRO DE FALTANTES)
// ==========================================

window.cargarFaltantes = async function () {
    if (window.detenerEscanner) window.detenerEscanner();
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) return;

    contenedor.innerHTML = "<p>Buscando paquetes pendientes...</p>";
    const { data: pendientes, error } = await _supabase
        .from('pedidos')
        .select('*, users!vendedora_id(nombre)') // Forzamos la relación por la columna vendedora_id
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: true });

    if (error) {
        contenedor.innerHTML = `<p style="color:red;">❌ Error: ${error.message}</p>`;
        return;
    }

    if (!pendientes || pendientes.length === 0) {
        contenedor.innerHTML = `<div class="success-card"><p>🎉 ¡Excelente! No hay paquetes pendientes por recibir.</p><button onclick="cargarChecklist()">Ver historial completo</button></div>`;
        return;
    }

    let html = `
        <div class="table-container">
            <h3>⚠️ Paquetes Pendientes de Recepción</h3>
            <table class="tabla-admin">
                <thead>
                    <tr><th>Vendedora</th><th>Cliente</th><th>Cant</th><th>Fecha de Entrega</th><th>Socia Representante</th><th>Acción</th></tr>
                </thead>
                <tbody>`;
    pendientes.forEach(p => {
        // CAMBIO 2: FORMATO DE FECHA D/M/Y [cite: 304]
        const fechaFormateada = p.entrega ? p.entrega.split('-').reverse().join('/') : '---';
        const nombreVendedora = p.users ? p.users.nombre : "No asignada";
        html += `
            <tr>
                <td><small>${nombreVendedora}</small></td>
                <td><b>${p.cliente}</b></td>
                <td>${p.paquetes}</td>
                <td>${fechaFormateada}</td>
                <td>${p.socia_representante || '---'}</td>
                <td><button onclick="marcarDesdePendientes('${p.id}')" class="btn-edit">📥 Recibir</button></td>
            </tr>`;
    });
    html += `</tbody></table></div>`;
    contenedor.innerHTML = html;
};

window.marcarDesdePendientes = async function (id) {
    const { error } = await _supabase.from('pedidos').update({ estado: 'recibido' }).eq('id', id);
    if (!error) {
        cargarFaltantes();
        const { data: todos } = await _supabase.from('pedidos').select('estado');
        if (todos) actualizarBarraProgreso(todos);
    }
};

// ==========================================
// 8. REPORTE DE RESUMEN (SÁBADO) - SIN CAMBIOS DE DISEÑO
// ==========================================

window.generarReporteSabado = async function () {
    if (window.detenerEscanner) window.detenerEscanner();
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) return;

    contenedor.innerHTML = "<p>Generando reporte de hoy...</p>";
    const { data: pedidos, error } = await _supabase
        .from('pedidos')
        .select(`paquetes, estado, vendedora_id, users (nombre)`);

    if (error) {
        contenedor.innerHTML = `<p style="color:red;">❌ Error: ${error.message}</p>`;
        return;
    }

    let totalPaquetes = 0, totalRecibidos = 0;
    let resumenVendedoras = {};

    pedidos.forEach(p => {
        totalPaquetes += p.paquetes;
        if (p.estado === 'recibido') totalRecibidos += p.paquetes;
        const nombreV = p.users ? p.users.nombre : "Vendedora Desconocida";
        if (!resumenVendedoras[nombreV]) resumenVendedoras[nombreV] = 0;
        resumenVendedoras[nombreV] += p.paquetes;
    });

    let html = `
        <div class="report-container">
            <h2 style="text-align: center; color: #2c3e50; margin-bottom: 25px;">📅 Resumen Operativo de Sábado</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                <div class="card-scanner" style="background: #ebf8ff; border-left: 5px solid #3182ce; padding: 20px; text-align: center;">
                    <p style="margin:0; font-size: 0.9rem; color: #2c5282;">PAQUETES REGISTRADOS</p>
                    <h3 style="margin:5px 0; font-size: 2rem; color: #2a4365;">${totalPaquetes}</h3>
                </div>
                <div class="card-scanner" style="background: #f0fdf4; border-left: 5px solid #38a169; padding: 20px; text-align: center;">
                    <p style="margin:0; font-size: 0.9rem; color: #22543d;">PAQUETES RECIBIDOS</p>
                    <h3 style="margin:5px 0; font-size: 2rem; color: #22543d;">${totalRecibidos}</h3>
                </div>
            </div>
            <div class="table-container">
                <h3 style="margin-bottom: 15px;">📊 Rendimiento por Vendedora</h3>
                <table class="tabla-admin">
                    <thead><tr><th>Vendedora</th><th>Total Paquetes Entregados</th><th>Eficiencia</th></tr></thead>
                    <tbody>`;
    for (const v in resumenVendedoras) {
        const cant = resumenVendedoras[v];
        const eficiencia = totalPaquetes > 0 ? Math.round((cant / totalPaquetes) * 100) : 0;
        html += `<tr><td><b>${v}</b></td><td style="text-align: center;">${cant}</td><td>
                    <div style="background: #edf2f7; border-radius: 10px; height: 10px; width: 100%;">
                        <div style="background: #4299e1; width: ${eficiencia}%; height: 100%; border-radius: 10px;"></div>
                    </div><small>${eficiencia}% del volumen total</small></td></tr>`;
    }
    html += `</tbody></table></div><button onclick="window.print()" class="btn-save" style="margin-top: 20px; width: 100%; background: #4a5568;">🖨️ Imprimir / Guardar PDF</button></div>`;
    contenedor.innerHTML = html;
};

// ==========================================
// 9. ARCHIVAR SÁBADO (LIMPIEZA DE SEDE)
// ==========================================

window.confirmarLimpieza = async function () {
    if (!confirm("⚠️ ¿Estás segura de que deseas ARCHIVAR el día?")) return;
    if (prompt("Escribe: ARCHIVAR") !== "ARCHIVAR") return;

    try {
        const { error } = await _supabase.from('pedidos').delete().gt('id', 0);
        if (error) throw error;
        if (typeof actualizarBarraProgreso === 'function') actualizarBarraProgreso([]);
        alert("✅ La base de datos ha sido vaciada satisfactoriamente.");
        location.reload();
    } catch (error) {
        alert("❌ Error: " + error.message);
    }
};

// ==========================================
// 10. BUSCADOR GLOBAL EN TIEMPO REAL
// ==========================================

window.buscadorGlobal = function () {
    const filtro = document.getElementById('inputBusqueda').value.toLowerCase();
    const tabla = document.querySelector('#contenedor-dinamico table');
    if (!tabla) return;
    const filas = tabla.getElementsByTagName('tr');
    for (let i = 1; i < filas.length; i++) {
        let mostrarFila = false;
        const celdas = filas[i].getElementsByTagName('td');
        for (let j = 0; j < celdas.length; j++) {
            const texto = celdas[j].innerText.toLowerCase();
            if (texto.indexOf(filtro) > -1) { mostrarFila = true; break; }
        }
        filas[i].style.display = mostrarFila ? "" : "none";
    }
};


// ==========================================
// 11. GENERADOR DE ETIQUETAS QR PARA IMPRESIÓN (OPTIMIZADO PARA AHORRAR PAPEL)
// ==========================================

window.generarPlanillaQR = async function () {
    if (window.detenerEscanner) window.detenerEscanner();
    const contenedor = document.getElementById('contenedor-dinamico');
    const { data: pedidos, error } = await _supabase.from('pedidos').select('*').eq('estado', 'pendiente').order('created_at', { ascending: false });

    if (error || !pedidos || pedidos.length === 0) return alert("No hay paquetes pendientes.");

    // Estilos internos para forzar que quepan varios por fila al imprimir
    let html = `
        <style>
            .contenedor-etiquetas {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); /* Esto pone varias por fila */
                gap: 10px;
                padding: 10px;
            }
            .etiqueta-qr {
                width: 140px; /* Tamaño reducido para que quepan más */
                border: 1px solid #ccc;
                padding: 5px;
                text-align: center;
                background: white;
                page-break-inside: avoid;
            }
            .etiqueta-qr img {
                width: 80px; /* QR más pequeño pero legible */
                height: 80px;
            }
            .etiqueta-info p {
                font-size: 10px; /* Texto más pequeño para ahorrar espacio */
                margin: 2px 0;
            }
            @media print {
                .no-print { display: none; }
                body { margin: 0; padding: 0; }
                .contenedor-etiquetas { grid-template-columns: repeat(4, 1fr); } /* 4 etiquetas por fila en la hoja */
            }
        </style>
        
        <div class="no-print" style="margin-bottom: 20px; text-align: center; padding: 15px; background: #fff5f5; border-radius: 10px;">
            <h3 style="color: #c53030;">🖨️ Vista Previa</h3>
            <p>Se pueden imprimir hasta 24 etiquetas por hoja.</p>
            <button onclick="window.print()" class="btn-save" style="background: #27ae60;">📇 Imprimir Etiquetas</button>
            <button onclick="cargarChecklist()" class="btn-edit" style="background: #8db1fa;">Volver</button>
        </div>
        
        <div class="contenedor-etiquetas">`;

    pedidos.forEach(p => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${p.id}`;
        const fTag = p.entrega ? p.entrega.split('-').reverse().join('/') : '';
        html += `
            <div class="etiqueta-qr">
                <div style="font-size: 9px; font-weight: bold;">SEDE ${fTag}</div>
                <img src="${qrUrl}" alt="QR">
                <div class="etiqueta-info">
                    <p><strong>${p.cliente.substring(0, 18)}</strong></p>
                    <p>Cant: ${p.paquetes} | ID: ${p.id}</p>
                </div>
            </div>`;
    });
    contenedor.innerHTML = html + `</div>`;
};

// ==========================================
// 12. PROCESO AUTOMÁTICO DE RECEPCIÓN
// ==========================================

window.marcarPedidoRecibido = async function (idDetectado) {
    const status = document.getElementById('resultado-scan');
    const idLimpio = parseInt(idDetectado.trim());
    if (isNaN(idLimpio)) return;

    try {
        const { data, error } = await _supabase.from('pedidos').update({ estado: 'recibido' }).eq('id', idLimpio).select();
        if (error) throw error;
        if (data && data.length > 0) {
            status.innerHTML = `✅ RECIBIDO: ${data[0].cliente}`;
            status.style.background = "#dcfce7";
            status.style.color = "#166534";
            if (window.speechSynthesis) {
                window.speechSynthesis.speak(new SpeechSynthesisUtterance("Recibido"));
            }
            const { data: todos } = await _supabase.from('pedidos').select('estado');
            if (todos) actualizarBarraProgreso(todos);
        } else {
            status.innerHTML = `❌ ID ${idLimpio} no encontrado`;
            status.style.background = "#fee2e2";
        }
    } catch (err) { console.error(err); status.innerHTML = `⚠️ Error de conexión`; }
};

// Funcionalidad para el ojito del formulario de REGISTRO
const toggleRegistroPassword = document.querySelector('#toggleRegistroPassword');
const registroPassword = document.querySelector('#registro-contrasena');

// CAMBIO: Agrega el "if (toggleRegistroPassword)" para evitar el Uncaught TypeError
if (toggleRegistroPassword) {
    toggleRegistroPassword.addEventListener('click', function (e) {
        const type = registroPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        registroPassword.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🔒';
    });
}

window.verChecklistAgrupado = async function () {
    const contenedor = document.getElementById('contenedor-dinamico');
    if (!contenedor) return;

    contenedor.innerHTML = "<p>Organizando paquetes por clienta...</p>";

    // 1. Traer datos de Supabase (ajusta 'paquetes' al nombre de tu tabla)
    const { data: paquetes, error } = await _supabase
    from('pedidos') /// antes era from paquetes 
        .select('*')
        .order('nombre_clienta', { ascending: true });

    if (error) return contenedor.innerHTML = `<p>Error: ${error.message}</p>`;

    // 2. Lógica de Agrupamiento
    const grupos = {};
    paquetes.forEach(p => {
        if (!grupos[p.nombre_clienta]) {
            grupos[p.nombre_clienta] = [];
        }
        grupos[p.nombre_clienta].push(p);
    });

    // 3. Generar el HTML
    let html = `
        <div class="table-container">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3>📦 Checklist por Clienta</h3>
                <button onclick="verChecklistGeneral()" class="btn-archive" style="width:auto; padding:8px 15px;">Volver a vista normal</button>
            </div>
    `;

    for (const clienta in grupos) {
        const misPaquetes = grupos[clienta];
        html += `
            <div class="client-group-card">
                <div class="client-header-banner">
                    <h4>👤 ${clienta}</h4>
                    <span class="package-count-badge">${misPaquetes.length} Paquetes</span>
                </div>
                <div class="client-packages-list">
                    ${misPaquetes.map(p => `
                        <div class="package-item-row">
                            <span><b>Guía:</b> ${p.numero_guia || 'N/A'}</span>
                            <span><b>Monto:</b> Q${p.monto}</span>
                            <span><b>Estado:</b> ${p.estado}</span>
                            <button onclick="verDetallePaquete('${p.id}')" style="background:none; border:none; cursor:pointer;">👁️</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += `</div>`;
    contenedor.innerHTML = html;
};

// ==========================================
// 13. PANEL DE ACCESO A VENDEDORAS
// ==========================================

// Función para guardar el paquete en Supabase
window.registrarPaqueteVendedora = async function(vendedoraId) {
    const cliente = document.getElementById('reg-cliente').value;
    const cant = document.getElementById('reg-cant').value;
    const socia = document.getElementById('reg-socia').value;
    const fecha = document.getElementById('reg-fecha').value;
    const msg = document.getElementById('msg-vendedora');

    if (!cliente || !fecha) {
        alert("Por favor ingresa el nombre del cliente y la fecha de entrega");
        return;
    }

    const { error } = await _supabase.from('pedidos').insert([
        { 
            vendedora_id: vendedoraId, 
            cliente: cliente, 
            paquetes: cant, 
            socia_representante: socia,
            entrega: fecha,
            estado: 'pendiente'
        }
    ]);

    if (error) {
        msg.innerText = "❌ Error: " + error.message;
        msg.style.color = "red";
    } else {
        msg.innerText = "✅ ¡Paquete registrado con éxito!";
        msg.style.color = "green";
        document.getElementById('reg-cliente').value = "";
    }

    msg.style.display = "block";
}; // 👈 ESTA LLAVE FALTABA