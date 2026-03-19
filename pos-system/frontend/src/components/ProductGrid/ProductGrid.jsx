import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { Search, ScanLine, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductGrid() {
  const { addItem } = useCart();
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('all');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories'),
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search, category],
    queryFn: () => api.get('/products', { params: {
      search: search || undefined,
      category: category === 'all' ? undefined : category,
    }}),
  });

  async function handleBarcode(e) {
    if (e.key !== 'Enter' || !e.target.value) return;
    try {
      const product = await api.get(`/products/barcode/${e.target.value}`);
      addItem(product);
      toast.success(`Added: ${product.name}`);
      e.target.value = '';
      setSearch('');
    } catch {
      toast.error('Product not found');
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Search bar */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:8 }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }} />
          <input
            style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8,
                     padding:'8px 12px 8px 32px', color:'var(--text)', fontSize:14, outline:'none' }}
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleBarcode}
          />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--muted)', fontSize:12 }}>
          <ScanLine size={14} /> Scan or search
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display:'flex', gap:6, padding:'10px 16px', overflowX:'auto', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <CategoryPill id="all" label="All" active={category === 'all'} onClick={() => setCategory('all')} />
        {categories.map(c => (
          <CategoryPill key={c.id} id={c.id} label={c.name} color={c.color}
            active={category === c.id} onClick={() => setCategory(c.id)} />
        ))}
      </div>

      {/* Product grid */}
      <div style={{ flex:1, overflowY:'auto', padding:12, display:'grid',
                    gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10, alignContent:'start' }}>
        {isLoading && <p style={{ color:'var(--muted)', gridColumn:'1/-1', textAlign:'center', padding:40 }}>Loading…</p>}
        {!isLoading && products.length === 0 && (
          <p style={{ color:'var(--muted)', gridColumn:'1/-1', textAlign:'center', padding:40 }}>No products found</p>
        )}
        {products.map(product => (
          <ProductCard key={product.id} product={product} onAdd={() => {
            addItem(product);
            toast.success(`Added: ${product.name}`, { duration: 1500 });
          }} />
        ))}
      </div>
    </div>
  );
}

function CategoryPill({ id, label, color, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:'5px 12px', borderRadius:20, fontSize:13, fontWeight:500, whiteSpace:'nowrap',
      background: active ? (color || 'var(--accent)') : 'var(--surface2)',
      color: active ? '#fff' : 'var(--muted)',
      border: `1px solid ${active ? (color || 'var(--accent)') : 'var(--border)'}`,
      transition:'all 0.15s',
    }}>
      {label}
    </button>
  );
}

function ProductCard({ product, onAdd }) {
  const isLowStock = product.track_inventory && product.stock_qty <= product.low_stock_alert;
  const isOutOfStock = product.track_inventory && product.stock_qty <= 0;

  return (
    <button onClick={!isOutOfStock ? onAdd : undefined} style={{
      background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)',
      padding:12, textAlign:'left', transition:'all 0.15s', cursor: isOutOfStock ? 'not-allowed' : 'pointer',
      opacity: isOutOfStock ? 0.5 : 1,
      ':hover': { borderColor:'var(--accent)' },
    }}>
      <div style={{ fontSize:28, marginBottom:6, textAlign:'center' }}>
        {getCategoryEmoji(product.category_name)}
      </div>
      <div style={{ fontSize:13, fontWeight:600, lineHeight:1.3, marginBottom:4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
        {product.name}
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:'var(--accent)' }}>
        ${product.price.toFixed(2)}
      </div>
      {product.track_inventory && (
        <div style={{ fontSize:11, marginTop:3, color: isLowStock ? 'var(--yellow)' : 'var(--muted)' }}>
          {isOutOfStock ? '✗ Out of stock' : isLowStock ? `⚠ Low: ${product.stock_qty}` : `${product.stock_qty} in stock`}
        </div>
      )}
    </button>
  );
}

function getCategoryEmoji(name = '') {
  const n = name.toLowerCase();
  if (n.includes('food') || n.includes('bev')) return '☕';
  if (n.includes('elec'))   return '⚡';
  if (n.includes('cloth'))  return '👕';
  if (n.includes('home'))   return '🏠';
  if (n.includes('serv'))   return '🔧';
  return '📦';
}
