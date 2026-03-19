import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { X, CreditCard, Banknote, Smartphone, Gift } from 'lucide-react';

const METHODS = [
  { id:'cash',       label:'Cash',         Icon: Banknote    },
  { id:'card',       label:'Card',         Icon: CreditCard  },
  { id:'mobile',     label:'Mobile Pay',   Icon: Smartphone  },
  { id:'gift_card',  label:'Gift Card',    Icon: Gift        },
];

const QUICK_CASH = [5, 10, 20, 50, 100];

export default function PaymentModal({ onClose, onComplete }) {
  const { cart, clearCart } = useCart();
  const [method,    setMethod]    = useState('cash');
  const [tendered,  setTendered]  = useState('');
  const [tip,       setTip]       = useState('');
  const [loading,   setLoading]   = useState(false);

  const totalWithTip = cart.total + parseFloat(tip || 0);
  const tenderedNum  = parseFloat(tendered || totalWithTip.toFixed(2));
  const changeDue    = Math.max(0, tenderedNum - totalWithTip);

  async function handleCharge() {
    setLoading(true);
    try {
      // 1. Create order
      const order = await api.post('/orders', {
        items:          cart.items.map(i => ({ product_id: i.product_id, name: i.name, sku: i.sku,
                          quantity: i.quantity, unit_price: i.unit_price, discount_pct: i.discount_pct,
                          modifiers: i.modifiers, notes: i.notes })),
        customer_id:    cart.customer_id || undefined,
        discount_amount: cart.discount_amount,
        tip_amount:     parseFloat(tip || 0),
        notes:          cart.note || undefined,
      });

      // 2. Process payment
      const payment = await api.post('/payments', {
        order_id: order.id,
        method,
        amount:   tenderedNum,
      });

      // 3. Get receipt
      const receipt = await api.get(`/orders/${order.id}/receipt`);

      clearCart();
      onComplete({ order, payment, receipt });
      toast.success('Payment successful!');
    } catch (err) {
      toast.error(err?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, width:500, maxHeight:'90vh', overflow:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <h2 style={{ fontSize:17, fontWeight:700 }}>Checkout — ${cart.total.toFixed(2)}</h2>
          <button onClick={onClose} style={{ background:'transparent', color:'var(--muted)' }}><X size={18}/></button>
        </div>

        <div style={{ padding:20 }}>
          {/* Payment method */}
          <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:8, fontWeight:500 }}>PAYMENT METHOD</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:20 }}>
            {METHODS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setMethod(id)} style={{
                display:'flex', alignItems:'center', gap:8, padding:'10px 14px',
                borderRadius:10, border:`2px solid ${method === id ? 'var(--accent)' : 'var(--border)'}`,
                background: method === id ? 'rgba(99,102,241,0.1)' : 'var(--surface2)',
                color: method === id ? 'var(--accent)' : 'var(--muted)', fontSize:14, fontWeight:500,
              }}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {/* Order summary */}
          <div style={{ background:'var(--surface2)', borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
            {[
              { label:'Subtotal',   value: cart.subtotal },
              cart.discount_amount > 0 ? { label:`Discount (${cart.discount_code||''})`, value: -cart.discount_amount } : null,
              { label:'Tax',        value: cart.tax_amount },
            ].filter(Boolean).map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--muted)', marginBottom:4 }}>
                <span>{r.label}</span><span>{r.value < 0 ? '-' : ''}${Math.abs(r.value).toFixed(2)}</span>
              </div>
            ))}

            {/* Tip */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)' }}>
              <span style={{ fontSize:13, color:'var(--muted)' }}>Tip</span>
              <div style={{ display:'flex', gap:4 }}>
                {[0, 10, 15, 20].map(pct => (
                  <button key={pct} onClick={() => setTip(pct ? (cart.subtotal * pct / 100).toFixed(2) : '')} style={{
                    padding:'3px 8px', borderRadius:5, fontSize:12,
                    background: (!tip && pct === 0) || parseFloat(tip || 0).toFixed(2) === (cart.subtotal * pct / 100).toFixed(2) ? 'var(--accent)' : 'var(--surface)',
                    color:'var(--text)', border:'1px solid var(--border)',
                  }}>
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
                <input
                  type="number" min="0" step="0.01" placeholder="Custom"
                  style={{ width:60, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:5, padding:'3px 6px', color:'var(--text)', fontSize:12, outline:'none' }}
                  value={tip} onChange={e => setTip(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:700, marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)' }}>
              <span>Total Due</span><span>${totalWithTip.toFixed(2)}</span>
            </div>
          </div>

          {/* Cash tendered */}
          {method === 'cash' && (
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:8, fontWeight:500 }}>AMOUNT TENDERED</label>
              <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                {QUICK_CASH.map(amt => (
                  <button key={amt} onClick={() => setTendered(String(amt))} style={{
                    padding:'6px 12px', borderRadius:6, border:'1px solid var(--border)',
                    background:'var(--surface2)', color:'var(--text)', fontSize:13,
                  }}>${amt}</button>
                ))}
                <button onClick={() => setTendered(totalWithTip.toFixed(2))} style={{
                  padding:'6px 12px', borderRadius:6, border:'1px solid var(--accent)',
                  background:'rgba(99,102,241,0.1)', color:'var(--accent)', fontSize:13,
                }}>Exact</button>
              </div>
              <input
                type="number" min="0" step="0.01"
                style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', color:'var(--text)', fontSize:16, outline:'none', fontWeight:700 }}
                value={tendered} onChange={e => setTendered(e.target.value)}
                placeholder={totalWithTip.toFixed(2)}
              />
              {changeDue > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:16, fontWeight:700, color:'var(--green)' }}>
                  <span>Change Due</span><span>${changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <button onClick={handleCharge} disabled={loading || (method === 'cash' && tenderedNum < totalWithTip)} style={{
            width:'100%', padding:'14px 0', borderRadius:10, fontSize:16, fontWeight:700,
            background:'var(--green)', color:'#fff',
            opacity: (loading || (method === 'cash' && tenderedNum < totalWithTip)) ? 0.6 : 1,
          }}>
            {loading ? 'Processing…' : `Charge $${totalWithTip.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
