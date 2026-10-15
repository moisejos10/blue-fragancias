import { useEffect, useState } from 'react';

const emptyFilters = { q: '', marca: '', genero: '', tipo: '' };
const money = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const referenceImage = '/referencias/perfume-cielo.png';

function ProductCard({ product, selectedType }) {
  const variants = product.variantes;
  const pricedVariants = selectedType ? variants.filter(v => v.tipo_presentacion === selectedType) : variants;
  const prices = pricedVariants.map(v => Number(v.precio_ref_usd));
  const photo = product.imagenes.find(i => i.url);
  return <article className="product-card">
    <div className="product-image"><img src={photo?.url || referenceImage}
      alt={photo?.texto_alternativo || 'Frasco ilustrativo; fotografía del producto pendiente'} loading="lazy" />
      {!photo && <span>Imagen de referencia</span>}</div>
    <p className="eyebrow">{product.marca.nombre}</p>
    <h3>{product.nombre}</h3>
    <p className="product-notes">{[product.genero, product.familia_olfativa].filter(Boolean).join(' · ')}</p>
    {prices.length > 0 && <p className="price">Desde $ {money.format(Math.min(...prices))} <small>Referencia USD{selectedType ? ` · ${selectedType}` : ''}</small></p>}
    {product.descripcion && <p className="product-description">{product.descripcion}</p>}
    {variants.length ? <details>
      <summary>Ver presentaciones <span>({variants.length})</span></summary>
      <ul className="variants">{variants.map(v => <li key={v.id}>
        <strong>{v.presentacion}</strong>
        <span>{v.tipo_presentacion} · {v.volumen_ml} ml{v.concentracion ? ` · ${v.concentracion}` : ''}</span>
        <span>$ {money.format(Number(v.precio_ref_usd))} · {v.disponible ? 'Disponible' : 'Agotado'}</span>
      </li>)}</ul>
    </details> : <p className="product-notes">Presentaciones próximamente</p>}
  </article>;
}

export default function App() {
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ status: 'loading', products: [], hasMore: false });
  const [logo, setLogo] = useState(null);
  const hasFilters = Object.values(filters).some(Boolean);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/tienda', { signal: controller.signal }).then(response => response.ok ? response.json() : null)
      .then(data => { if (data?.logo_url) setLogo(data.logo_url); }).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    const timeout = setTimeout(() => controller.abort(), 10000);
    const params = new URLSearchParams({ pagina: String(page), limite: '12' });
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    setResult({ status: 'loading', products: [], hasMore: false });
    async function load() {
      try {
        const response = await fetch(`/api/productos?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Catalogo no disponible');
        const data = await response.json();
        if (!Array.isArray(data.productos) || typeof data.paginacion?.hay_mas !== 'boolean') {
          throw new Error('Respuesta inesperada');
        }
        if (current) setResult({ status: 'ready', products: data.productos, hasMore: data.paginacion.hay_mas });
      } catch {
        if (current) setResult({ status: 'error', products: [], hasMore: false });
      } finally {
        clearTimeout(timeout);
      }
    }
    void load();
    return () => { current = false; clearTimeout(timeout); controller.abort(); };
  }, [filters, page, attempt]);

  function applyFilters(event) {
    event.preventDefault();
    setPage(1);
    setFilters(Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()])));
  }
  function resetFilters() { setDraft(emptyFilters); setFilters(emptyFilters); setPage(1); }
  function edit(event) { setDraft({ ...draft, [event.target.name]: event.target.value }); }
  function explore(q) {
    const selection = { ...emptyFilters, q };
    setDraft(selection); setFilters(selection); setPage(1);
    document.getElementById('catalogo')?.scrollIntoView();
  }

  return <>
    <a className="skip-link" href="#catalogo">Ir al catálogo</a>
    <div className="announcement">UN AROMA. TU ESENCIA.</div>
    <header className="site-header wrapper">
      <a className="wordmark" href="#inicio" aria-label="Blue Fragancias, inicio">{logo ? <img className="brand-logo" src={logo} alt="Blue Fragancias" onError={() => setLogo(null)} /> : <>blue<span>FRAGANCIAS</span></>}</a>
      <nav aria-label="Navegación principal"><a href="#catalogo">Explorar catálogo <span aria-hidden="true">↗</span></a></nav>
    </header>
    <main id="inicio">
      <section className="hero wrapper" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">EL ARTE DE DEJAR HUELLA</p>
          <h1 id="hero-title">Una fragancia.<br /><em>Mil formas</em><br />de ser tú.</h1>
          <p>Notas frescas, aromas intensos y nuevas sensaciones. Encuentra la esencia que va contigo.</p>
          <a className="button primary" href="#catalogo">Descubrir fragancias <span aria-hidden="true">↗</span></a>
        </div>
        <div className="hero-art">
          <img className="hero-photo" src={referenceImage} alt="Inspiración Blue: frasco de vidrio sobre piedra clara y fondo azul cielo" fetchPriority="high" />
          <span className="reference-label">Imagen de referencia</span>
        </div>
      </section>
      <section className="inspiration wrapper" aria-labelledby="inspiration-title">
        <div className="section-heading"><div><p className="eyebrow">SIGUE TUS SENTIDOS</p><h2 id="inspiration-title">Un universo de sensaciones.</h2></div><p>Encuentra las notas que hablan de ti.</p></div>
        <div className="inspiration-grid">
          {[['Frescura que acompaña','Cítricas y luminosas','cítrica','cielo'],['Delicadeza que perdura','Florales y envolventes','floral','floral'],['Carácter que deja huella','Amaderadas y profundas','amaderada','amaderado']].map(([title,subtitle,q,file]) =>
            <button className="inspiration-card" key={file} onClick={() => explore(q)}>
              <img src={`/referencias/perfume-${file}.png`} alt="" loading="lazy" />
              <span><strong>{title}</strong><small>{subtitle} <span aria-hidden="true">↗</span></small></span>
            </button>)}
        </div>
        <p className="reference-caption">Imágenes de inspiración provisionales. Las fotografías del catálogo se incorporarán próximamente.</p>
      </section>
      <section id="catalogo" className="catalog wrapper" aria-labelledby="catalog-title">
        <div className="section-heading"><div><p className="eyebrow">EXPLORA BLUE</p><h2 id="catalog-title">Encuentra tu próxima esencia.</h2></div><p>Cada nota cuenta una historia.</p></div>
        <form className="filters" onSubmit={applyFilters} aria-label="Filtros del catálogo">
          <label className="search-field">Buscar fragancia<input type="search" name="q" value={draft.q} onChange={edit} maxLength={100} placeholder="Nombre, notas o marca…" /></label>
          <label>Marca<input name="marca" value={draft.marca} onChange={edit} maxLength={100} placeholder="Nombre exacto" /></label>
          <label>Género<select name="genero" value={draft.genero} onChange={edit}><option value="">Todos</option><option value="femenino">Femenino</option><option value="masculino">Masculino</option><option value="unisex">Unisex</option></select></label>
          <label>Presentación<select name="tipo" value={draft.tipo} onChange={edit}><option value="">Todas</option><option value="frasco">Frasco</option><option value="decant">Decant</option><option value="muestra">Muestra</option></select></label>
          <button className="button primary" type="submit">Buscar</button>
        </form>
        <div className="result-bar"><p>{hasFilters ? 'Selección filtrada' : 'Todas las fragancias'}</p>{hasFilters && <button className="text-button" onClick={resetFilters}>Limpiar filtros</button>}</div>
        <div aria-live="polite" aria-busy={result.status === 'loading'}>
          {result.status === 'loading' && <div className="empty-state"><span className="loader" aria-hidden="true" /><h3>Buscando tu próxima esencia…</h3><p>Cargando las fragancias del catálogo.</p></div>}
          {result.status === 'error' && <div className="empty-state"><p className="eyebrow">UN MOMENTO</p><h3>No pudimos cargar el catálogo.</h3><p>Inténtalo de nuevo en unos instantes.</p><button className="button primary" onClick={() => setAttempt(attempt + 1)}>Reintentar</button></div>}
          {result.status === 'ready' && result.products.length === 0 && <div className="empty-state"><span className="empty-symbol" aria-hidden="true">✧</span><h3>{hasFilters ? 'No encontramos esa combinación.' : page > 1 ? 'Llegaste al final del catálogo.' : 'Estamos preparando nuestra colección.'}</h3><p>{hasFilters ? 'Prueba con otro nombre o cambia los filtros.' : page > 1 ? 'Regresa a la página anterior para seguir explorando.' : 'Pronto podrás descubrir aquí nuestras fragancias.'}</p>{hasFilters && <button className="text-button" onClick={resetFilters}>Ver todo el catálogo →</button>}</div>}
          {result.status === 'ready' && result.products.length > 0 && <div className="product-grid">{result.products.map(p => <ProductCard key={p.id} product={p} selectedType={filters.tipo} />)}</div>}
        </div>
        {(page > 1 || result.hasMore) && <nav className="pagination" aria-label="Páginas del catálogo">
          <button className="button secondary" disabled={page === 1 || result.status === 'loading'} onClick={() => setPage(page - 1)}>← Anterior</button>
          <span>Página {page}</span>
          <button className="button secondary" disabled={!result.hasMore || result.status !== 'ready' || page >= 10000} onClick={() => setPage(page + 1)}>Siguiente →</button>
        </nav>}
      </section>
    </main>
    <footer className="site-footer wrapper"><a className="wordmark" href="#inicio">{logo ? <img className="brand-logo" src={logo} alt="Blue Fragancias" /> : <>blue<span>FRAGANCIAS</span></>}</a><p>Un aroma que habla de ti.</p><a className="admin-link" href="/admin">Administrar tienda</a></footer>
  </>;
}
