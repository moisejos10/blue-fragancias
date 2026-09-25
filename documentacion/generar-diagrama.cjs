// Regenera la documentación visual a partir del SQL, sin conectarse a PostgreSQL.
// Ejecutar desde la raíz: node documentacion/generar-diagrama.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sql = fs.readFileSync(path.join(__dirname, '../backend/database/001_esquema_inicial.sql'), 'utf8');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const relations = [
  ['marcas', 'productos', ['marca_id'], ['id'], '1', 'Una marca puede agrupar muchos perfumes.'],
  ['productos', 'variantes_producto', ['producto_id'], ['id'], '1', 'Cada presentación pertenece a un perfume.'],
  ['productos', 'imagenes_producto', ['producto_id'], ['id'], '1', 'Las fotos pertenecen al perfume, no a una variante específica.'],
  ['administradores', 'tasas_cambio', ['registrada_por'], ['id'], '0..1', 'Obligatorio cuando la tasa se carga manualmente.'],
  ['administradores', 'pedidos', ['actualizado_por'], ['id'], '0..1', 'Identifica al administrador asociado a la última modificación.'],
  ['tasas_cambio', 'pedidos', ['tasa_cambio_id', 'tasa_eur_ves'], ['id', 'tasa_eur_ves'], '1', 'La clave compuesta garantiza que el valor corresponda a la tasa elegida.'],
  ['pedidos', 'detalle_pedidos', ['pedido_id'], ['id'], '1', 'Un pedido debe tener al menos una línea al confirmar la transacción SQL.'],
  ['variantes_producto', 'detalle_pedidos', ['variante_id'], ['id'], '1', 'Identifica la presentación comprada; el detalle conserva su precio histórico.'],
  ['pedidos', 'pagos', ['pedido_id'], ['id'], '1', 'Un pedido puede tener cero, uno o varios registros de pago.'],
  ['administradores', 'pagos', ['registrado_por'], ['id'], '0..1', 'Administrador que registró el pago, si corresponde.'],
  ['administradores', 'pagos', ['revisado_por'], ['id'], '0..1', 'Obligatorio al verificar o rechazar el pago; vacío mientras está reportado.'],
  ['variantes_producto', 'movimientos_inventario', ['variante_id'], ['id'], '1', 'Todo movimiento modifica las existencias de una presentación.'],
  ['administradores', 'movimientos_inventario', ['administrador_id'], ['id'], '0..1', 'Obligatorio en entradas, ajustes y devoluciones.'],
  ['detalle_pedidos', 'movimientos_inventario', ['pedido_id', 'variante_id'], ['pedido_id', 'variante_id'], '0..1', 'Clave compuesta: relaciona el movimiento con la línea exacta del pedido. Requerida para reserva, liberación, venta y devolución.'],
  ['pedidos', 'historial_pedidos', ['pedido_id'], ['id'], '1', 'Cada evento pertenece a un pedido. Un trigger registra la creación y los cambios de estado.'],
  ['administradores', 'historial_pedidos', ['administrador_id'], ['id'], '0..1', 'Se copia del administrador indicado en el pedido, si existe.'],
].map(([parent, child, columns, target, cardinality, description]) => ({ parent, child, columns, target, cardinality, description }));

const meta = {
  marcas: { group: 'Catálogo', x: 40, y: 150, w: 290, h: 160, summary: ['Agrupa los perfumes', 'por fabricante o marca.'], fields: ['PK  id', 'nombre'], example: 'Marca ficticia: Brisa.', rules: ['El nombre no se repite aunque cambien las mayúsculas.'] },
  productos: { group: 'Catálogo', x: 40, y: 390, w: 290, h: 190, summary: ['Describe el perfume', 'que ve el cliente.'], fields: ['PK  id', 'FK  marca_id', 'nombre · slug · activo'], example: 'Brisa Nocturna: nombre, descripción y familia olfativa.', rules: ['Se crea oculto (activo = false).', 'Se desactiva para retirarlo del catálogo; el historial de ventas se conserva.'] },
  variantes_producto: { group: 'Catálogo', x: 470, y: 390, w: 340, h: 220, summary: ['Presentación vendible:', 'precio, volumen y existencias.'], fields: ['PK  id', 'FK  producto_id', 'sku · precio_ref_usd', 'stock_fisico · stock_reservado'], example: 'Brisa Nocturna, frasco de 50 ml EDP, referencia $50.', rules: ['Un perfume puede tener frascos, decants o muestras.', 'Disponible = stock_fisico − stock_reservado.', 'Los movimientos actualizan el stock mediante un trigger. La API debe evitar modificar los saldos directamente.'] },
  imagenes_producto: { group: 'Catálogo', x: 40, y: 775, w: 290, h: 190, summary: ['Guarda la ubicación y', 'el orden de las fotografías.'], fields: ['PK  id', 'FK  producto_id', 'clave_archivo · orden'], example: 'Foto frontal y foto de la caja del mismo perfume.', rules: ['La imagen se almacena como archivo; aquí se guarda su clave.', 'El texto alternativo describe la foto para accesibilidad.'] },
  tasas_cambio: { group: 'Venta', x: 1090, y: 150, w: 330, h: 175, summary: ['Historial del euro en Bs,', 'fuente y fecha de vigencia.'], fields: ['PK  id', 'tasa_eur_ves · fecha_vigencia'], example: 'Ejemplo ficticio: 400 Bs por euro. No es una cotización real.', rules: ['Cada nueva tasa o corrección crea otra fila; no se edita la anterior.', 'No hay una API de tasas conectada todavía.', 'Una tasa manual debe identificar al administrador que la registró.'] },
  pedidos: { group: 'Venta', x: 1090, y: 425, w: 330, h: 230, summary: ['Cabecera de la compra:', 'cliente, entrega y totales.'], fields: ['PK  id', 'FK  tasa_cambio_id + tasa_eur_ves', 'nombre_cliente · estado', 'total_ref_usd · total_ves'], example: 'Cliente invitado, pickup, una referencia de $50 y total de Bs 20.000 con la tasa ficticia de 400.', rules: ['Los datos del comprador se guardan aquí; no hay cuentas de clientes.', 'Total Bs = (subtotal de referencia + entrega) × tasa EUR/VES, redondeado a 2 decimales.', 'Entrega NULL significa por cotizar; el total definitivo queda pendiente.', 'Abrir WhatsApp no confirma la orden ni el pago.'] },
  detalle_pedidos: { group: 'Venta', x: 470, y: 775, w: 340, h: 220, summary: ['Una fila por presentación', 'incluida en el pedido.'], fields: ['PK  id', 'FK  pedido_id · variante_id', 'cantidad · precio_unitario_ref_usd', 'UQ  pedido_id + variante_id'], example: '2 unidades del frasco de 50 ml a referencia $50: línea de $100.', rules: ['Conserva nombre, SKU, presentación y precio del momento de compra.', 'La suma de las líneas debe coincidir con el subtotal al COMMIT.', 'pedido_id + variante_id identifica una sola línea; la cantidad va en esa fila.'] },
  pagos: { group: 'Venta', x: 1090, y: 815, w: 330, h: 210, summary: ['Registra dinero reportado', 'y su revisión administrativa.'], fields: ['PK  id', 'FK  pedido_id', 'metodo · moneda · monto', 'estado · referencia_operacion'], example: 'Pago Móvil reportado, pendiente de revisión.', rules: ['Métodos: Pago Móvil, Binance Pay y efectivo.', 'El estado del pago es independiente del estado de la orden.', 'Guarda la moneda recibida; USD y USDT no se suman automáticamente.', 'Los comprobantes deben permanecer en almacenamiento privado.'] },
  movimientos_inventario: { group: 'Inventario', x: 470, y: 1160, w: 370, h: 225, summary: ['Libro de entradas, reservas,', 'ventas y devoluciones.'], fields: ['PK  id', 'FK  variante_id', 'FK  pedido_id + variante_id', 'cambio_fisico · cambio_reservado'], example: 'Reservar 1 unidad: cambio_fisico = 0 y cambio_reservado = +1.', rules: ['Cada inserción actualiza atómicamente los saldos de la variante.', 'Una venta consume la reserva de su propio pedido.', 'No permite devolver más unidades de las vendidas.', 'Los movimientos no se editan ni se borran.'] },
  historial_pedidos: { group: 'Auditoría', x: 1090, y: 1160, w: 330, h: 195, summary: ['Conserva la creación y', 'los cambios de estado.'], fields: ['PK  id', 'FK  pedido_id', 'estado_anterior · estado_nuevo'], example: 'pendiente_confirmacion → confirmado.', rules: ['Se genera mediante un trigger al insertar un pedido o cambiar su estado.', 'Este historial no se modifica ni se elimina.', 'No registra cada edición de cada campo ni sustituye un historial de pagos.'] },
  administradores: { group: 'Administración', x: 40, y: 1630, w: 350, h: 205, summary: ['Personal que administra', 'y revisa las operaciones.'], fields: ['PK  id', 'email · hash_password', 'activo'], example: 'Tu acceso al panel de administración.', rules: ['La tabla exige un prefijo Argon2id; la aplicación debe generar un hash real.', 'Cada flecha inferior corresponde a un campo distinto de auditoría.', 'No es una cuenta de cliente ni el usuario postgres del servidor.'] },
};

const tables = {};
let expectedColumns = 0;
for (const match of sql.matchAll(/CREATE TABLE (\w+) \(\r?\n([\s\S]*?)\r?\n\);/g)) {
  const [whole, name, body] = match;
  expectedColumns += (body.match(/^    [a-z_]+ (?:uuid|bigint|integer|varchar|numeric|boolean|text|date|timestamptz)\b/gm) || []).length;
  const starts = [...body.matchAll(/^    ([a-z_]+) (uuid|bigint|integer|varchar(?:\(\d+\))?|numeric\(\d+,\d+\)|boolean|text|date|timestamptz)(?=[\s,])[^\r\n]*/gm)];
  const columns = starts.map((m, i) => {
    const definition = body.slice(m.index, starts[i + 1]?.index ?? body.length);
    const type = m[0].trim().slice(m[1].length).trim().match(/^\w+(?:\(\d+(?:,\d+)?\))?/)[0];
    const firstLine = m[0];
    const keys = [];
    if (/PRIMARY KEY/.test(firstLine)) keys.push('PK');
    if (relations.some(r => r.child === name && r.columns.includes(m[1]))) keys.push('FK');
    if (/\bUNIQUE\b/.test(firstLine)) keys.push('UQ');
    return { name: m[1], type, keys, required: /NOT NULL|PRIMARY KEY/.test(firstLine), generated: /GENERATED ALWAYS AS\s*\(/.test(definition) };
  });
  assert(meta[name], `Falta descripción de ${name}`);
  tables[name] = { name, ...meta[name], columns };
}
assert.equal(Object.keys(tables).length, 11);
assert.equal((sql.match(/\bREFERENCES\s+\w+\s*\(/g) || []).length, relations.length);
for (const r of relations) {
  for (const c of r.columns) assert(tables[r.child].columns.some(x => x.name === c), `${r.child}.${c}`);
  for (const c of r.target) assert(tables[r.parent].columns.some(x => x.name === c), `${r.parent}.${c}`);
}
assert.equal(Object.values(tables).reduce((n, t) => n + t.columns.length, 0), expectedColumns);

const colors = { 'Catálogo': '#14766f', 'Venta': '#245bb0', 'Inventario': '#995600', 'Auditoría': '#66518d', 'Administración': '#66518d' };
function card(t) {
  const color = colors[t.group];
  return `<a href="diagrama-base-datos.html#${t.name}" data-table="${t.name}" aria-label="Ver ${t.name}">
  <g class="node" id="n-${t.name}"><title>${esc(t.name + ': ' + t.summary.join(' '))}</title>
  <rect class="card-bg" x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="12" fill="#ffffff" stroke="#cbd8e5"/>
  <rect x="${t.x}" y="${t.y}" width="5" height="${t.h}" rx="2" fill="${color}"/>
  <text class="node-title" x="${t.x + 20}" y="${t.y + 32}" fill="${color}">${t.name}</text>
  ${t.summary.map((s, i) => `<text class="summary" x="${t.x + 20}" y="${t.y + 59 + i * 21}">${esc(s)}</text>`).join('')}
  <line x1="${t.x + 20}" y1="${t.y + 94}" x2="${t.x + t.w - 20}" y2="${t.y + 94}" stroke="#e1e8f0"/>
  ${t.fields.map((f, i) => `<text class="field" x="${t.x + 20}" y="${t.y + 120 + i * 25}">${esc(f)}</text>`).join('')}
  </g></a>`;
}
function label(x, y, lines, color = '#38536e') {
  const width = Math.max(...lines.map(s => s.length)) * 8.1 + 22;
  return `<g class="edge-label"><rect x="${x - width / 2}" y="${y - 17}" width="${width}" height="${lines.length * 23 + 8}" rx="4" fill="#f4f7fb"/>${lines.map((l, i) => `<text x="${x}" y="${y + i * 23}" text-anchor="middle" fill="${color}">${esc(l)}</text>`).join('')}</g>`;
}
function edge(parent, child, d, x, y, lines, cardinal = '1 → 0..N') {
  return `<g class="edge" data-parent="${parent}" data-child="${child}"><path d="${d}"/>${label(x, y, [...lines, cardinal])}</g>`;
}
const coreEdges = [
  edge('marcas', 'productos', 'M185 310 V390', 185, 337, ['marca_id']),
  edge('productos', 'variantes_producto', 'M330 455 H470', 400, 414, ['producto_id']),
  edge('productos', 'imagenes_producto', 'M185 580 V775', 185, 659, ['producto_id']),
  edge('variantes_producto', 'detalle_pedidos', 'M640 610 V775', 640, 668, ['variante_id']),
  edge('tasas_cambio', 'pedidos', 'M1255 325 V425', 1255, 353, ['tasa_cambio_id', '+ tasa_eur_ves']),
  edge('pedidos', 'detalle_pedidos', 'M1090 540 H940 V885 H810', 940, 708, ['pedido_id'], '1 → 1..N*'),
  edge('pedidos', 'pagos', 'M1255 655 V815', 1255, 719, ['pedido_id']),
  edge('pedidos', 'historial_pedidos', 'M1420 540 H1480 V1120 H1340 V1160', 1320, 1082, ['pedido_id'], '1 → 1..N*'),
  edge('variantes_producto', 'movimientos_inventario', 'M470 530 H385 V1270 H470', 385, 1080, ['variante_id']),
  edge('detalle_pedidos', 'movimientos_inventario', 'M650 995 V1160', 650, 1058, ['pedido_id + variante_id'], '0..1 → 0..N'),
].join('');
const adminRows = [
  ['tasas_cambio', 'registrada_por', 'Obligatorio si la tasa es manual.'],
  ['pedidos', 'actualizado_por', 'Puede estar vacío en pedidos de invitados.'],
  ['pagos', 'registrado_por', 'Quién ingresó el pago, si corresponde.'],
  ['pagos', 'revisado_por', 'Obligatorio al verificar o rechazar.'],
  ['movimientos_inventario', 'administrador_id', 'Obligatorio en entrada, ajuste o devolución.'],
  ['historial_pedidos', 'administrador_id', 'Se copia del pedido cuando existe.'],
];
const adminEdges = adminRows.map(([name, col], i) => `<g class="edge admin-edge" data-parent="administradores" data-child="${name}"><path d="M390 1720 H460 V${1565 + i * 78} H555"/></g>`).join('');
const adminBoxes = adminRows.map(([name, col, note], i) => {
  const y = 1535 + i * 78;
  return `<a href="diagrama-base-datos.html#${name}" data-table="${name}"><g class="reference" data-ref="${name}"><rect x="555" y="${y}" width="865" height="66" rx="8" fill="#ffffff" stroke="#ddd7e8"/>
  <text x="575" y="${y + 25}" class="field" fill="#66518d">${name}.${col}</text><text x="575" y="${y + 49}" class="summary">${esc(note)}</text></g></a>`;
}).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1520" height="2080" viewBox="0 0 1520 2080" role="img" aria-labelledby="diagram-title diagram-desc">
<title id="diagram-title">Blue Fragancias: las 11 tablas y sus 16 claves foráneas</title>
<desc id="diagram-desc">Diagrama de catálogo, pedidos, pagos e inventario. Un panel inferior muestra las seis referencias a administradores. Las flechas van de la tabla referenciada a la que guarda la clave foránea. Las etiquetas indican cardinalidad y campos.</desc>
<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="none" stroke="#69839f" stroke-width="1.3"/></marker></defs>
<style>text{font-family:Segoe UI,Arial,sans-serif;fill:#183149}.node-title{font-family:Consolas,monospace;font-size:19px;font-weight:700}.summary{font-size:17px}.field{font-family:Consolas,monospace;font-size:14px}.edge path{fill:none;stroke:#69839f;stroke-width:2;marker-end:url(#arrow)}.edge-label text{font-family:Consolas,monospace;font-size:14px}.admin-edge path{stroke:#9584ae}.node,.edge,.reference{transition:opacity .15s}.node:hover .card-bg{stroke:#245bb0;stroke-width:2}.dim{opacity:.16}.selected .card-bg{stroke:#245bb0;stroke-width:3}.related .card-bg{stroke:#69839f;stroke-width:2}</style>
<rect width="1520" height="2080" fill="#f4f7fb"/>
<text x="40" y="51" font-size="30" font-weight="700">Blue Fragancias · mapa de la base de datos</text>
<text x="40" y="83" font-size="18">11 tablas · 16 claves foráneas · Esquema inicial de PostgreSQL</text>
<text x="40" y="124" font-size="16" fill="#14766f">CATÁLOGO</text>
<text x="1090" y="124" font-size="16" fill="#245bb0">VENTA Y SEGUIMIENTO</text>
${coreEdges}
${Object.values(tables).filter(t => t.name !== 'administradores').map(card).join('')}
<text x="40" y="1442" font-size="16">Flecha: tabla referenciada → tabla que guarda la FK.  1 = uno · 0..1 = opcional · 0..N = ninguno o muchos.</text>
<text x="40" y="1469" font-size="16">* Un pedido tiene al menos una línea al COMMIT; el trigger también crea su primer evento de historial.</text>
<line x1="40" y1="1500" x2="1480" y2="1500" stroke="#cbd8e5"/>
<text x="40" y="1540" font-size="22" font-weight="700">Administración y trazabilidad</text>
<text x="40" y="1570" font-size="16">Un administrador → 0..N registros.</text>
<text x="40" y="1597" font-size="16">Cada referencia admite 0..1 administrador,</text>
<text x="40" y="1620" font-size="16">con condiciones según la operación.</text>
${adminEdges}${card(tables.administradores)}${adminBoxes}
<text x="40" y="1910" font-size="17" font-weight="600">PK: identifica una fila.</text>
<text x="40" y="1940" font-size="17" font-weight="600">FK: enlaza con otra tabla.</text>
<text x="40" y="1970" font-size="17" font-weight="600">UQ: impide duplicados.</text>
<text x="555" y="2041" font-size="16">Las filas de este panel son referencias a las tablas de arriba, no tablas adicionales.</text>
</svg>`;

const data = JSON.stringify({ tables, relations }).replace(/</g, '\\u003c');
const tableOptions = Object.keys(tables).map(name => `<option value="${name}">${name}</option>`).join('');
const fullRelationRows = relations.map(r => `<tr><td><a href="#${r.parent}" data-select="${r.parent}">${r.parent}</a></td><td><a href="#${r.child}" data-select="${r.child}">${r.child}</a><br><code>${r.columns.join(' + ')}</code></td><td>${r.cardinality}</td><td>${esc(r.description)}</td></tr>`).join('');
const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Base de datos · Blue Fragancias</title>
<style>
:root{color-scheme:light;--ink:#183149;--muted:#456078;--line:#cfdae6;--blue:#245bb0;--paper:#fff;--bg:#f4f7fb}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 'Segoe UI',Arial,sans-serif}header,main,footer{max-width:1800px;margin:auto;padding:24px 32px}header{border-bottom:1px solid var(--line)}h1{font-size:30px;line-height:1.2;margin:4px 0 12px}h2{font-size:22px;margin:0 0 10px}h3{font-size:17px;margin:22px 0 8px}p{margin:0 0 12px}a{color:var(--blue)}code{font:13px/1.5 Consolas,monospace;overflow-wrap:anywhere}button,select{font:inherit;color:var(--ink);background:var(--paper);border:1px solid #96adc4;border-radius:7px;padding:8px 12px;min-height:42px}button{cursor:pointer}button:hover{border-color:var(--blue);background:#edf3fc}:focus-visible{outline:3px solid #4c91dd;outline-offset:3px}.eyebrow{color:var(--blue);letter-spacing:.1em;font-size:12px;font-weight:700;text-transform:uppercase}.intro{max-width:950px;color:var(--muted)}.toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px}.toolbar label{display:flex;align-items:center;gap:8px;flex-wrap:wrap}select{max-width:100%}.layout{display:grid;grid-template-columns:minmax(0,1fr) 355px;gap:24px;align-items:start}.diagram-scroll{overflow:auto;max-height:82vh;border:1px solid var(--line);border-radius:10px;background:var(--bg)}.diagram-scroll svg{display:block;max-width:none;width:100%;height:auto}.diagram-scroll a:focus{outline:3px solid var(--blue)}aside{min-width:0;background:white;padding:20px;border:1px solid var(--line);border-radius:10px}.muted{color:var(--muted)}.caption{font-size:14px;color:var(--muted);margin-top:8px}.table-name{font:700 20px/1.4 Consolas,monospace;overflow-wrap:anywhere}.tag{font-size:11px;font-weight:700;border:1px solid #d4deea;padding:1px 4px;border-radius:4px;margin-right:3px}.generated{color:#6d4d00}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:14px}th,td{padding:9px 7px;border-bottom:1px solid #e0e7ef;vertical-align:top}th{font-size:12px;text-transform:uppercase;letter-spacing:.03em}aside th,aside td{padding:8px 3px}aside td:first-child{max-width:180px;overflow-wrap:anywhere}ul,ol{padding-left:22px}li{margin-bottom:8px}.relation{padding:10px 0;border-bottom:1px solid #e0e7ef}.relation code{display:block}section.explanation{margin-top:30px;padding-top:24px;border-top:1px solid var(--line)}.steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.step{border-top:3px solid #245bb0;padding-top:12px}.step strong{display:block;margin-bottom:8px}.note{padding:12px 14px;background:#e8eff8;border-left:3px solid var(--blue);margin:14px 0}.links{display:flex;gap:18px;flex-wrap:wrap}footer{color:var(--muted);font-size:13px}#selection-status{min-height:22px}.screen-reader{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
@media(max-width:1050px){.layout{grid-template-columns:1fr}.diagram-scroll{max-height:75vh}aside{max-height:none}.steps{grid-template-columns:1fr}header,main,footer{padding:20px}}@media print{body{background:white}header,main,footer{padding:12px}.toolbar,aside,.caption,.links{display:none}.layout{display:block}.diagram-scroll{max-height:none;overflow:visible;border:0}.diagram-scroll svg{width:100%!important}.explanation{break-before:page}a{color:inherit}.steps{display:block}.step{margin:15px 0}}
</style></head><body>
<header><div class="eyebrow">Documentación / Modelo relacional</div><h1>Cómo se organiza tu tienda</h1><p class="intro">Sigue las relaciones desde una marca hasta sus ventas. Pulsa una tabla para consultar todos sus campos, sus conexiones y un ejemplo. Los ejemplos son ficticios; esta página no se conecta a tu base de datos.</p><nav class="links" aria-label="Documentos"><a href="diagrama-base-datos.svg">Abrir imagen vectorial</a><a href="README.md">Guía escrita</a><a href="../backend/database/001_esquema_inicial.sql">Esquema SQL</a></nav></header>
<main><div class="toolbar"><label for="table-select">Consultar tabla <select id="table-select"><option value="">Ver todas las relaciones</option>${tableOptions}</select></label><button id="zoom-out" type="button" aria-label="Reducir diagrama">−</button><span id="zoom-label">Ajustado</span><button id="zoom-in" type="button" aria-label="Ampliar diagrama">+</button><button id="fit" type="button">Ajustar</button><button id="clear" type="button">Ver todas</button><button id="print" type="button">Imprimir</button></div>
<div class="layout"><div><div id="diagram" class="diagram-scroll" aria-label="Diagrama completo; usa ampliar para leer los campos">${svg}</div><p class="caption">La flecha apunta a la tabla que guarda la clave foránea. El panel inferior completa las relaciones con administradores.</p><p id="selection-status" class="caption" aria-live="polite">11 tablas y 16 relaciones visibles.</p></div><aside id="details" aria-label="Ficha de la tabla"><h2>Cómo leer el esquema</h2><p><strong>PK</strong> identifica una fila. <strong>FK</strong> enlaza con una fila de otra tabla. <strong>UQ</strong> impide valores repetidos.</p><p><strong>1 → 0..N</strong>: una fila puede estar relacionada con ninguna o muchas filas de la otra tabla.</p><p><strong>0..1</strong>: la relación puede estar vacía. Algunas operaciones la vuelven obligatoria.</p><p>Comienza con <button type="button" data-select="marcas">marcas</button> y sigue hacia <code>productos</code> y <code>variantes_producto</code>.</p></aside></div>
<section class="explanation"><h2>Una compra, paso a paso</h2><div class="steps"><div class="step"><strong>01 / Elegir una presentación</strong><p><code>marcas → productos → variantes_producto</code>. Un perfume reúne su descripción y fotos; cada presentación tiene precio, SKU y existencias propios.</p></div><div class="step"><strong>02 / Guardar el pedido</strong><p><code>pedidos + detalle_pedidos + tasas_cambio</code>. Se guardan los datos del invitado, las cantidades y los precios aplicados. El detalle y su cabecera deben crearse en una misma transacción.</p></div><div class="step"><strong>03 / Gestionar la venta</strong><p><code>movimientos_inventario + pagos + historial_pedidos</code>. Se controla la reserva, se revisa el dinero recibido y se conserva cada cambio de estado del pedido.</p></div></div><p class="note">El esquema prepara estos datos. El flujo completo de compra, la apertura de WhatsApp, el acceso administrativo y la liberación automática de reservas todavía deben implementarse en el backend.</p></section>
<section class="explanation"><h2>Precios e inventario</h2><p><strong>Regla comercial:</strong> total en Bs = (subtotal de referencia USD + entrega de referencia USD) × tasa EUR/VES. Por ejemplo, referencia $50 × tasa ficticia 400 = Bs 20.000. Se redondea el total a dos decimales.</p><p>Un costo de entrega <code>NULL</code> significa «por cotizar»; cero significa «sin costo». El esquema conserva los precios del detalle y un historial inmutable de tasas para que cambiar el catálogo no recalcule pedidos anteriores.</p><p><strong>Disponible = stock físico − stock reservado.</strong> Un movimiento de reserva aumenta lo reservado. La venta reduce tanto el stock físico como la reserva del propio pedido.</p></section>
<section class="explanation"><h2>Las 16 relaciones del esquema</h2><p>La columna «Por registro» indica cuántas filas de la tabla referenciada admite cada fila de la tabla que guarda la FK. Una FK compuesta enlaza varios campos conjuntamente.</p><div class="table-wrap"><table><thead><tr><th>Tabla referenciada</th><th>Tabla y campos que guardan la FK</th><th>Por registro</th><th>Función y condiciones</th></tr></thead><tbody>${fullRelationRows}</tbody></table></div></section>
</main><footer>Fuente: backend/database/001_esquema_inicial.sql · Documentación generada desde el archivo del esquema, sin consultar datos privados.</footer>
<script type="application/json" id="schema-data">${data}</script>
<script>
const schema = JSON.parse(document.getElementById('schema-data').textContent);
const details = document.getElementById('details');
const initialDetails = details.innerHTML;
const select = document.getElementById('table-select');
const svg = document.querySelector('#diagram svg');
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let zoom = 1;
function choose(name) {
  if (!schema.tables[name]) name = '';
  select.value = name;
  const connected = schema.relations.filter(r => r.parent === name || r.child === name);
  const neighbors = new Set(connected.flatMap(r => [r.parent, r.child]));
  document.querySelectorAll('.node').forEach(n => {
    const id = n.id.slice(2);
    n.classList.toggle('dim', !!name && !neighbors.has(id));
    n.classList.toggle('selected', id === name);
    n.classList.toggle('related', !!name && id !== name && neighbors.has(id));
  });
  document.querySelectorAll('.edge').forEach(e => e.classList.toggle('dim', !!name && e.dataset.parent !== name && e.dataset.child !== name));
  document.querySelectorAll('.reference').forEach(e => e.classList.toggle('dim', !!name && name !== 'administradores' && name !== e.dataset.ref));
  document.getElementById('selection-status').textContent = name ? name + ': ' + connected.length + ' relaciones directas.' : '11 tablas y 16 relaciones visibles.';
  if (!name) { details.innerHTML = initialDetails; return; }
  const t = schema.tables[name];
  details.innerHTML = '<div class="eyebrow">' + escapeHtml(t.group) + '</div><h2 class="table-name">' + escapeHtml(t.name) + '</h2><p>' + escapeHtml(t.summary.join(' ')) + '</p><h3>Ejemplo ficticio</h3><p>' + escapeHtml(t.example) + '</p><h3>Reglas importantes</h3><ul>' + t.rules.map(r => '<li>' + escapeHtml(r) + '</li>').join('') + '</ul><h3>Relaciones directas</h3>' + connected.map(r => '<div class="relation"><a href="#' + (r.parent === name ? r.child : r.parent) + '" data-select="' + (r.parent === name ? r.child : r.parent) + '">' + escapeHtml(r.parent) + ' → ' + escapeHtml(r.child) + '</a><code>FK: ' + escapeHtml(r.columns.join(' + ')) + '</code><p>' + escapeHtml(r.description) + '</p></div>').join('') + '<h3>Todos los campos (' + t.columns.length + ')</h3><p class="muted">«Sí» indica NOT NULL o clave primaria; otras condiciones se explican en las reglas y en el SQL.</p><table><thead><tr><th>Campo / tipo</th><th>Obligatorio</th></tr></thead><tbody>' + t.columns.map(c => '<tr><td><code>' + escapeHtml(c.name) + '</code><br><span class="muted">' + escapeHtml(c.type) + '</span><br>' + c.keys.map(k => '<span class="tag">' + k + '</span>').join('') + (c.generated ? '<span class="tag generated">Calculado</span>' : '') + '</td><td>' + (c.required ? 'Sí' : 'No') + '</td></tr>').join('') + '</tbody></table>';
}
function zoomTo(next) { zoom = Math.max(1, Math.min(3, next)); svg.style.width = (zoom * 100) + '%'; document.getElementById('zoom-label').textContent = zoom === 1 ? 'Ajustado' : Math.round(zoom * 100) + '%'; }
document.addEventListener('click', event => {
  const link = event.target.closest('[data-table], [data-select]');
  if (link) { event.preventDefault(); const name = link.dataset.table || link.dataset.select; choose(name); location.hash = name; }
});
select.addEventListener('change', () => { choose(select.value); location.hash = select.value; });
document.getElementById('clear').addEventListener('click', () => { choose(''); location.hash = ''; });
document.getElementById('fit').addEventListener('click', () => zoomTo(1));
document.getElementById('zoom-in').addEventListener('click', () => zoomTo(zoom + .25));
document.getElementById('zoom-out').addEventListener('click', () => zoomTo(zoom - .25));
document.getElementById('print').addEventListener('click', () => window.print());
window.addEventListener('hashchange', () => choose(location.hash.slice(1)));
choose(location.hash.slice(1));
</script></body></html>`;

fs.writeFileSync(path.join(__dirname, 'diagrama-base-datos.svg'), svg);
fs.writeFileSync(path.join(__dirname, 'diagrama-base-datos.html'), html);
console.log(`Documentación generada: ${Object.keys(tables).length} tablas, ${relations.length} relaciones, ${expectedColumns} campos.`);
