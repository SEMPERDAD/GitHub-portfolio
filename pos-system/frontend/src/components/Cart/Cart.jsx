import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { Trash2, Plus, Minus, User, Tag, MessageSquare, ChevronRight } from 'lucide-react';
import CustomerSearch from '../CustomerSearch/CustomerSearch';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Cart({ onCheckout }) {
  const { cart, updateQty, removeItem, setDiscount, setNote, setCustomer } = useCart();
  const [showCustomer,  setShowCustomer]  = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);

  async function applyDiscount() {
    if (!discountInput.trim()) return;
    setDiscountLoading(true);
    try {
      const res = await api.post('/discounts/validate', { code: discountInput.trim().toUpperCase(), subtotal: cart.subtotal });
      setDiscount(res.applied_amount, res.discount.code);
      toast.success(`Discount applied: -$${res.applied_amount.toFixed(2)}`);
      setDiscountInput('');
    } catch (err) {
      toast.error(err?.error || 'Invalid discount code');
    } finally {
      setDiscountLoading(false);
    }
  }

  const isEmpty = cart.items.length === 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Customer selector */}
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <button onClick={() => setShowCustomer(true)} style={{
          display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%',
          background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8,
          padding:'8px 12px', color: cart.customer ? 'var(--text)' : 'var(--muted)', fontSize:13,
        }}>
          <span style={{ display:'flex', alignItems:'center', gap:8 }}>
            <User size={14} />
            {cart.customer ? `${cart.customer.first_name} ${cart.customer.last_name}` : 'Select customer (optional)'}
          </span>
          {cart.customer && <span style={{ fontSize:11, color:'var(--green)' }}>★ {cart.customer.loyalty_pts} pts</span>}
        </button>
      </div>

      {/* Items */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 14px' }}>
        {isEmpty && (
          <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 0' }}>
            <div style={{ fontSize:40, marginBottom:8 }}>🛒</div>
            <p style={{ fontSize:14 }}>Cart is empty</p>
            <p style={{ fontSize:12, marginTop:4 }}>Select products to add</p>
          </div>
        )}
        {cart.items.map(item => (
          <CartItem key={item.id} item={item}
            onQtyChange={(q) => updateQty(item.id, q)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>

      {/* Discount input */}
      {!isEmpty && (
        <div style={{ padding:'8px 14px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', gap:6 }}>
            <input
              style={{ flex:1, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6,
                       padding:'7px 10px', color:'var(--text)', fontSize:13, outline:'none' }}
              placeholder="Discount code…"
              value={discountInput}
              onChange={e => setDiscountInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyDiscount()}
            />
            <button onClick={applyDiscount} disabled={discountLoading} style={{
              padding:'7px 12px', background:'var(--surface2)', border:'1px solid var(--border)',
              borderRadius:6, color:'var(--muted)', fontSize:13,
            }}>
              <Tag size={14} />
            </button>
          </div>

          {/* Note */}
          <textarea
            rows={2}
            style={{ width:'100%', marginTop:6, background:'var(--surface2)', border:'1px solid var(--border)',
                     borderRadius:6, padding:'7px 10px', color:'var(--text)', fontSize:12,
                     resize:'none', outline:'none' }}
            placeholder="Order note…"
            value={cart.note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
      )}

      {/* Totals */}
      <div style={{ padding:'12px 14px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <TotalRow label="Subtotal" value={cart.subtotal} />
        {cart.discount_amount > 0 && <TotalRow label={`Discount ${cart.discount_code ? `(${cart.discount_code})` : ''}`} value={-cart.discount_amount} color="var(--green)" />}
        <TotalRow label="Tax (8%)" value={cart.tax_amount} />
        {cart.tip_amount > 0 && <TotalRow label="Tip" value={cart.tip_amount} />}
        <TotalRow label="Total" value={cart.total} bold />

        <button
          onClick={() => !isEmpty && onCheckout()}
          disabled={isEmpty}
          style={{
            width:'100%', marginTop:12, padding:'14px 0', borderRadius:10,
            background: isEmpty ? 'var(--border)' : 'var(--accent)',
            color: isEmpty ? 'var(--muted)' : '#fff', fontSize:16, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}
        >
          Charge ${cart.total.toFixed(2)} <ChevronRight size={18} />
        </button>
      </div>

      {showCustomer && (
        <CustomerSearch
          onSelect={c => { setCustomer(c); setShowCustomer(false); }}
          onClose={() => setShowCustomer(false)}
        />
      )}
    </div>
  );
}

function CartItem({ item, onQtyChange, onRemove }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
        {item.modifiers?.length > 0 && (
          <div style={{ fontSize:11, color:'var(--muted)' }}>{item.modifiers.map(m => m.name).join(', ')}</div>
        )}
        <div style={{ fontSize:12, color:'var(--muted)' }}>${item.unit_price.toFixed(2)} ea</div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <button onClick={() => onQtyChange(item.quantity - 1)} style={{
          width:24, height:24, borderRadius:6, background:'var(--surface2)', color:'var(--text)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
        }}><Minus size={12} /></button>

        <span style={{ minWidth:24, textAlign:'center', fontSize:14, fontWeight:600 }}>{item.quantity}</span>

        <button onClick={() => onQtyChange(item.quantity + 1)} style={{
          width:24, height:24, borderRadius:6, background:'var(--surface2)', color:'var(--text)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}><Plus size={12} /></button>
      </div>

      <div style={{ minWidth:56, textAlign:'right', fontSize:14, fontWeight:700 }}>
        ${(item.unit_price * item.quantity).toFixed(2)}
      </div>

      <button onClick={onRemove} style={{ color:'var(--red)', background:'transparent', padding:4, borderRadius:4 }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function TotalRow({ label, value, bold, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize: bold ? 16 : 13,
                  fontWeight: bold ? 700 : 400, color: color || (bold ? 'var(--text)' : 'var(--muted)'),
                  marginBottom: bold ? 0 : 3 }}>
      <span>{label}</span>
      <span>{value < 0 ? '-' : ''}${Math.abs(value).toFixed(2)}</span>
    </div>
  );
}
