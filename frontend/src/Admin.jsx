import { useCallback, useEffect, useState } from 'react';
import './admin.css';

async function api(path, options = {}, csrf) {
  const multipart = options.body instanceof FormData;
  const response = await fetch(`/api/admin${path}`, {
    ...options, credentials: 'same-origin', signal: AbortSignal.timeout(15000),
    headers: { ...(options.body && !multipart ? { 'Content-Type': 'application/json' } : {}),
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) { const error = new Error(body?.error || 'No se pudo completar la operación.'); error.status = response.status; throw error; }
  return body;
}
const message = error => error.name === 'TimeoutError' || error instanceof TypeError
  ? 'No se pudo conectar. Comprueba tu conexión y vuelve a intentarlo.' : error.message;
const newVariant = () => ({ presentacion: '', tipo_presentacion: 'frasco', concentracion: '', volumen_ml: '', precio_ref_usd: '', activo: true });
const newProduct = () => ({ nombre: '', marca: '', descripcion: '', genero: '', familia_olfativa: '', activo: false, variantes: [newVariant()], imagenes: [] });

function PhotoUpload({ request, productId, logo = false, onSaved }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [alt, setAlt] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function upload(event) {
    event.preventDefault();
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setNotice('Selecciona una imagen de hasta 5 MB.'); return; }
    setBusy(true); setNotice('');
    try {
      const data = new FormData(); data.append('imagen', file);
      if (!logo) data.append('texto_alternativo', alt);
      const saved = await request(logo ? '/logo' : `/productos/${productId}/imagen`, { method: 'POST', body: data });
      await onSaved(saved);
      setNotice(logo ? 'Logo actualizado. Ya puedes verlo en la tienda.' : 'Foto de portada guardada.');
    } catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  return <form className="admin-box upload-form" onSubmit={upload}>
    <h3>{logo ? 'Logo de tu tienda' : 'Foto de portada'}</h3>
    <p>Selecciona un archivo JPG, PNG o WebP de hasta 5 MB. Puedes reemplazarlo cuando quieras.</p>
    <label>Elegir imagen<input type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy}
      onChange={e => { setFile(e.target.files[0] || null); setNotice(''); }} /></label>
    {preview && <img className="upload-preview" src={preview} alt="Vista previa de la imagen seleccionada" />}
    {!logo && <label>Describe la foto<input value={alt} onChange={e => setAlt(e.target.value)} required maxLength={250} placeholder="Ejemplo: frasco y caja, vista frontal" /></label>}
    <button className="button primary" disabled={busy || !file}>{busy ? 'Subiendo…' : logo ? 'Guardar logo' : 'Guardar foto'}</button>
    {notice && <p role="status" className="admin-notice">{notice}</p>}
  </form>;
}

function StockEntry({ variant, request, onSaved }) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      await request(`/variantes/${variant.id}/entradas`, { method: 'POST', body: JSON.stringify({ cantidad: Number(quantity), motivo: reason, clave: key }) });
      setQuantity(''); setReason(''); setKey(crypto.randomUUID());
      setNotice('Entrada registrada.');
      try { await onSaved(); }
      catch { setNotice('Entrada registrada. Recarga el producto para ver las existencias actualizadas.'); }
    } catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  return <form className="stock-entry" onSubmit={submit}>
    <div><strong>{variant.presentacion}</strong><p>{variant.stock_fisico} unidades · {variant.stock_reservado} reservadas</p></div>
    <label>Unidades que ingresan<input type="number" min="1" max="100000" step="1" required value={quantity} disabled={busy}
      onChange={e => { setQuantity(e.target.value); setKey(crypto.randomUUID()); }} /></label>
    <label>Motivo<input required maxLength={500} value={reason} disabled={busy} placeholder="Ejemplo: recepción de mercancía"
      onChange={e => { setReason(e.target.value); setKey(crypto.randomUUID()); }} /></label>
    <button className="button secondary" disabled={busy}>{busy ? 'Registrando…' : 'Registrar entrada'}</button>
    {notice && <p role="status" className="admin-notice">{notice}</p>}
  </form>;
}

function ProductEditor({ initial, request, onBack, onSaved }) {
  const [product, setProduct] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const field = event => setProduct(p => ({ ...p, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  function variantField(index, field, value) {
    setProduct(p => ({ ...p, variantes: p.variantes.map((v,i) => i === index ? { ...v, [field]: value } : v) }));
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setNotice('');
    const data = { ...product, variantes: product.variantes.map(v => ({
      id: v.id || null, presentacion: v.presentacion, tipo_presentacion: v.tipo_presentacion,
      concentracion: v.concentracion, volumen_ml: v.volumen_ml, precio_ref_usd: v.precio_ref_usd, activo: v.activo,
    })) };
    try {
      const saved = await request(product.id ? `/productos/${product.id}` : '/productos', {
        method: product.id ? 'PUT' : 'POST', body: JSON.stringify(data),
      });
      setProduct(saved); onSaved();
      setNotice(saved.activo ? 'Cambios guardados y publicados en la tienda.' : 'Borrador guardado. Solo aparece en el panel.');
    } catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  async function refreshAssets() {
    const saved = await request(`/productos/${product.id}`);
    setProduct(p => ({ ...p, imagenes: saved.imagenes, variantes: p.variantes.map(v => {
      const current = saved.variantes.find(item => item.id === v.id);
      return current ? { ...v, stock_fisico: current.stock_fisico, stock_reservado: current.stock_reservado } : v;
    }) }));
  }
  return <>
    <div className="admin-title"><div><p className="eyebrow">TU CATÁLOGO</p><h1>{product.id ? 'Editar perfume' : 'Nuevo perfume'}</h1></div><button className="text-button" onClick={onBack} disabled={busy}>← Volver al listado</button></div>
    <form onSubmit={save} className="admin-box editor">
      <fieldset disabled={busy}>
        <legend>Información del perfume</legend>
        <div className="admin-fields">
          <label>Nombre del perfume<input name="nombre" value={product.nombre} onChange={field} maxLength={180} required /></label>
          <label>Marca<input name="marca" value={product.marca} onChange={field} maxLength={100} required /></label>
          <label>Género<select name="genero" value={product.genero || ''} onChange={field}><option value="">Sin especificar</option><option value="femenino">Femenino</option><option value="masculino">Masculino</option><option value="unisex">Unisex</option></select></label>
          <label>Familia olfativa<input name="familia_olfativa" value={product.familia_olfativa} onChange={field} maxLength={80} placeholder="Ejemplo: cítrica, floral, amaderada" /></label>
          <label className="full-width">Descripción<textarea name="descripcion" value={product.descripcion} onChange={field} maxLength={5000} rows={4} /></label>
        </div>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Presentaciones y precios</legend>
        <p>Una presentación es una opción de compra, como un frasco de 100 ml o un decant de 5 ml.</p>
        {product.variantes.map((v,index) => <div className="variant-editor" key={v.id || `nuevo-${index}`}>
          <div className="variant-heading"><h3>Presentación {index + 1}</h3>{!v.id && <button type="button" className="text-button" onClick={() => setProduct(p => ({ ...p, variantes: p.variantes.filter((_,i) => i !== index) }))}>Quitar</button>}</div>
          <div className="admin-fields">
            <label>Nombre de la presentación<input value={v.presentacion} onChange={e => variantField(index,'presentacion',e.target.value)} required maxLength={120} placeholder="Ejemplo: Frasco 100 ml" /></label>
            <label>Tipo<select value={v.tipo_presentacion} onChange={e => variantField(index,'tipo_presentacion',e.target.value)}><option value="frasco">Frasco</option><option value="decant">Decant</option><option value="muestra">Muestra</option></select></label>
            <label>Volumen (ml)<input type="number" min="0.01" max="999999.99" step="0.01" required value={v.volumen_ml} onChange={e => variantField(index,'volumen_ml',e.target.value)} /></label>
            <label>Precio de referencia (USD)<input type="number" min="0.01" max="9999999999.99" step="0.01" required value={v.precio_ref_usd} onChange={e => variantField(index,'precio_ref_usd',e.target.value)} /></label>
            <label>Concentración<input value={v.concentracion} maxLength={40} onChange={e => variantField(index,'concentracion',e.target.value)} placeholder="Ejemplo: Eau de Parfum" /></label>
            <label className="check-label"><input type="checkbox" checked={v.activo} onChange={e => variantField(index,'activo',e.target.checked)} />Presentación visible</label>
          </div>
        </div>)}
        <button type="button" className="button secondary" disabled={product.variantes.length >= 30} onClick={() => setProduct(p => ({ ...p, variantes: [...p.variantes,newVariant()] }))}>+ Añadir presentación</button>
      </fieldset>
      <div className="save-bar"><label className="check-label"><input type="checkbox" name="activo" checked={product.activo} onChange={field} disabled={busy} />Publicar en la tienda</label><button className="button primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar perfume'}</button></div>
      {notice && <p role="status" className="admin-notice">{notice}</p>}
    </form>
    {product.id ? <>
      {product.imagenes?.[0] && <div className="current-photo"><img src={product.imagenes[0].url} alt={product.imagenes[0].texto_alternativo} /><p>Foto actual</p></div>}
      <PhotoUpload request={request} productId={product.id} onSaved={refreshAssets} />
      <section className="admin-box"><h2>Inventario</h2><p>Registra aquí la mercancía que recibes. Cada entrada conserva su motivo y no modifica las reservas existentes.</p>
        {product.variantes.filter(v => v.id).map(v => <StockEntry key={v.id} variant={v} request={request} onSaved={refreshAssets} />)}
      </section>
    </> : <p className="admin-notice">Guarda primero el perfume para añadir su foto y registrar existencias.</p>}
  </>;
}

export default function Admin() {
  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [editor, setEditor] = useState(null);
  const [view, setView] = useState('catalogo');
  const [logo, setLogo] = useState('');

  useEffect(() => {
    let current = true;
    api('/sesion').then(data => { if (current) setSession(data); }).catch(error => {
      if (current) { setSession(null); if (error.status !== 401) setNotice(message(error)); }
    });
    return () => { current = false; };
  }, []);
  const request = useCallback(async (path, options) => {
    try { return await api(path, options, session?.csrf); }
    catch (error) { if (error.status === 401) { setSession(null); setPassword(''); } throw error; }
  }, [session]);
  useEffect(() => {
    if (!session || view !== 'catalogo' || editor) return;
    let current = true;
    setLoading(true); setNotice('');
    request(`/productos?${new URLSearchParams({ q: search, pagina: String(page) })}`).then(data => {
      if (current) { setProducts(data.productos); setHasMore(data.hay_mas); }
    }).catch(error => { if (current) { setProducts([]); setNotice(message(error)); } }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [session,request,search,page,refresh,view,editor]);
  async function login(event) {
    event.preventDefault(); setBusy(true); setNotice('');
    try { setSession(await api('/login', { method: 'POST', body: JSON.stringify({ email,password }) })); setPassword(''); }
    catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    try { await request('/logout', { method: 'POST' }); setSession(null); setEditor(null); setNotice('Sesión cerrada.'); }
    catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  async function editProduct(id) {
    setBusy(true); setNotice('');
    try { setEditor(await request(`/productos/${id}`)); }
    catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  return <div className="admin-page">
    <header className="admin-header"><a className="wordmark" href="/">blue<span>FRAGANCIAS</span></a><span>Administración</span><a href="/" target="_blank" rel="noreferrer">Ver tienda ↗</a></header>
    <main className="admin-main">
      {session === undefined ? <p role="status">Comprobando acceso…</p> : !session ? <form className="admin-box login-box" onSubmit={login}>
        <p className="eyebrow">TU TIENDA, EN TUS MANOS</p><h1>Bienvenido a Blue.</h1><p>Accede para actualizar tu catálogo, fotos y existencias.</p>
        <label>Correo<input type="email" autoComplete="username" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Contraseña<input type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="button primary" disabled={busy}>{busy ? 'Entrando…' : 'Iniciar sesión'}</button>
        {notice && <p role="alert" className="admin-notice">{notice}</p>}
      </form> : <>
        <div className="admin-toolbar"><div className="admin-tabs"><button className={view === 'catalogo' ? 'selected' : ''} onClick={() => { setView('catalogo'); setEditor(null); }}>Catálogo</button><button className={view === 'marca' ? 'selected' : ''} onClick={() => { setView('marca'); setEditor(null); }}>Logo de la tienda</button></div><button className="text-button" onClick={logout} disabled={busy}>Cerrar sesión</button></div>
        <p className="admin-greeting">Hola, {session.administrador.nombre}.</p>
        {view === 'marca' ? <><h1>Imagen de marca</h1><p>Cuando tengas el logo real, selecciónalo aquí para reemplazar el nombre provisional.</p>{logo && <img className="upload-preview" src={logo} alt="Logo guardado" />}<PhotoUpload logo request={request} onSaved={saved => setLogo(saved.url)} /></>
          : editor ? <ProductEditor key={editor.id || 'nuevo'} initial={editor} request={request} onBack={() => setEditor(null)} onSaved={() => setRefresh(r => r + 1)} />
            : <>
              <div className="admin-title"><div><p className="eyebrow">GESTIONA TU COLECCIÓN</p><h1>Catálogo de perfumes</h1></div><button className="button primary" onClick={() => setEditor(newProduct())}>+ Nuevo perfume</button></div>
              <form className="admin-search" onSubmit={e => { e.preventDefault(); setSearch(searchDraft.trim()); setPage(1); setRefresh(r => r + 1); }}><label>Buscar por nombre o marca<input type="search" maxLength={100} value={searchDraft} onChange={e => setSearchDraft(e.target.value)} placeholder="Encuentra un perfume…" /></label><button className="button secondary">Buscar</button></form>
              {loading ? <p role="status">Cargando catálogo…</p> : products.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Perfume</th><th>Estado</th><th>Presentaciones</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td><strong>{p.nombre}</strong><span>{p.marca}</span></td><td><span className={`status-pill ${p.activo ? 'published' : ''}`}>{p.activo ? 'Publicado' : 'Borrador'}</span></td><td>{p.presentaciones}</td><td><button className="button secondary" onClick={() => editProduct(p.id)} disabled={busy}>Editar</button></td></tr>)}</tbody></table></div> : !notice && <div className="empty-state"><h2>{search ? 'No hay coincidencias.' : 'Tu catálogo empieza aquí.'}</h2><p>{search ? 'Prueba con otro nombre o marca.' : 'Añade un perfume, sus presentaciones y una foto. Puedes guardarlo como borrador antes de publicarlo.'}</p></div>}
              {(page > 1 || hasMore) && <nav className="pagination" aria-label="Páginas de administración"><button className="button secondary" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Anterior</button><span>Página {page}</span><button className="button secondary" disabled={!hasMore || loading || page >= 10000} onClick={() => setPage(p => p + 1)}>Siguiente</button></nav>}
            </>}
        {notice && <p role="alert" className="admin-notice">{notice}</p>}
      </>}
    </main>
  </div>;
}
