import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';

export default function ReceiptModal({ data, onClose, onNewSale }) {
  const { store, order, items, payments, currency } = data;
  const sym = currency?.symbol || '$';

  function printReceipt() {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Receipt - ${order.order_number}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; max-width: 300px; margin: 0 auto; padding: 10px; }
        .center { text-align: center; } .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; }
      </style></head><body>
      <div class="center bold" style="font-size:14px">${store.name}</div>
      <div class="center">${store.address || ''}</div>
      <div class="center">${store.phone || ''}</div>
      <div class="line"></div>
      <div class="row"><span>Order:</span><span>${order.order_number}</span></div>
      <div class="row"><span>Date:</span><span>${new Date(order.created_at).toLocaleString()}</span></div>
      <div class="line"></div>
      ${items.map(i => `<div class="row"><span>${i.name} x${i.quantity}</span><span>${sym}${i.line_total.toFixed(2)}</span></div>`).join('')}
      <div class="line"></div>
      <div class="row"><span>Subtotal</span><span>${sym}${order.subtotal.toFixed(2)}</span></div>
      ${order.discount_amount > 0 ? `<div class="row"><span>Discount</span><span>-${sym}${order.discount_amount.toFixed(2)}</span></div>` : ''}
      <div class="row"><span>Tax</span><span>${sym}${order.tax_amount.toFixed(2)}</span></div>
      ${order.tip_amount > 0 ? `<div class="row"><span>Tip</span><span>${sym}${order.tip_amount.toFixed(2)}</span></div>` : ''}
      <div class="row bold"><span>TOTAL</span><span>${sym}${order.total.toFixed(2)}</span></div>
      <div class="line"></div>
      ${payments.filter(p => p.amount > 0).map(p => `<div class="row"><span>${p.method.toUpperCase()}</span><span>${sym}${p.amount.toFixed(2)}</span></div>`).join('')}
      ${order.change_due > 0 ? `<div class="row"><span>Change</span><span>${sym}${order.change_due.toFixed(2)}</span></div>` : ''}
      <div class="line"></div>
      <div class="center">${store.receiptFooter || 'Thank you!'}</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, width:380, maxHeight:'90vh', overflow:'auto' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:'var(--green)' }}>✓ Payment Complete</h2>
          <button onClick={onClose} style={{ background:'transparent', color:'var(--muted)' }}><X size={18}/></button>
        </div>

        {/* Receipt body */}
        <div style={{ padding:20, fontFamily:"'Courier New', monospace", fontSize:13 }}>
          <div style={{ textAlign:'center', marginBottom:12 }}>
            <div style={{ fontSize:16, fontWeight:700 }}>{store.name}</div>
            {store.address && <div style={{ color:'var(--muted)', fontSize:12 }}>{store.address}</div>}
            {store.phone   && <div style={{ color:'var(--muted)', fontSize:12 }}>{store.phone}</div>}
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--muted)', marginBottom:4 }}>
            <span>Order: {order.order_number}</span>
            <span>{new Date(order.created_at).toLocaleTimeString()}</span>
          </div>

          <div style={{ borderTop:'1px dashed var(--border)', margin:'10px 0' }} />

          {items.map(item => (
            <div key={item.id} style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <span>{item.name} <span style={{ color:'var(--muted)' }}>x{item.quantity}</span></span>
              <span>{sym}{item.line_total.toFixed(2)}</span>
            </div>
          ))}

          <div style={{ borderTop:'1px dashed var(--border)', margin:'10px 0' }} />

          {[
            { label:'Subtotal', value: order.subtotal },
            order.discount_amount > 0 ? { label:'Discount', value: -order.discount_amount } : null,
            { label:'Tax', value: order.tax_amount },
            order.tip_amount > 0 ? { label:'Tip', value: order.tip_amount } : null,
          ].filter(Boolean).map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', color:'var(--muted)', fontSize:12, marginBottom:2 }}>
              <span>{r.label}</span>
              <span>{r.value < 0 ? '-' : ''}{sym}{Math.abs(r.value).toFixed(2)}</span>
            </div>
          ))}

          <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:15, marginTop:6, marginBottom:6 }}>
            <span>TOTAL</span><span>{sym}{order.total.toFixed(2)}</span>
          </div>

          <div style={{ borderTop:'1px dashed var(--border)', margin:'10px 0' }} />

          {payments.filter(p => p.amount > 0).map(p => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
              <span style={{ textTransform:'uppercase' }}>{p.method.replace('_',' ')}</span>
              <span>{sym}{p.amount.toFixed(2)}</span>
            </div>
          ))}
          {order.change_due > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--green)' }}>
              <span>Change</span><span>{sym}{order.change_due.toFixed(2)}</span>
            </div>
          )}

          {store.receiptFooter && (
            <p style={{ textAlign:'center', marginTop:12, color:'var(--muted)', fontSize:12 }}>{store.receiptFooter}</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:8, padding:'0 20px 20px' }}>
          <button onClick={printReceipt} style={{
            flex:1, padding:'10px 0', borderRadius:8, background:'var(--surface2)',
            border:'1px solid var(--border)', color:'var(--muted)', fontSize:13,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            <Printer size={14} /> Print
          </button>
          <button onClick={onNewSale} style={{
            flex:2, padding:'10px 0', borderRadius:8, background:'var(--accent)',
            color:'#fff', fontSize:13, fontWeight:600,
          }}>
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
