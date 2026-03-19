import React, { useState } from 'react';
import ProductGrid from '../ProductGrid/ProductGrid';
import Cart from '../Cart/Cart';
import PaymentModal from '../Payment/PaymentModal';
import ReceiptModal from '../Receipt/ReceiptModal';
import { useCart } from '../../context/CartContext';

export default function POSTerminal() {
  const { cart, clearCart } = useCart();
  const [showPayment, setShowPayment] = useState(false);
  const [receipt,     setReceipt]     = useState(null);

  function handleCheckoutComplete(data) {
    setShowPayment(false);
    setReceipt(data.receipt);
  }

  function handleNewSale() {
    setReceipt(null);
    clearCart();
  }

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Left — product grid */}
      <div style={{ flex:1, minWidth:0, borderRight:'1px solid var(--border)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <ProductGrid />
      </div>

      {/* Right — cart (fixed 360px) */}
      <div style={{ width:360, flexShrink:0, display:'flex', flexDirection:'column', background:'var(--surface)' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <h2 style={{ fontSize:15, fontWeight:700 }}>
            Current Order
            {cart.items.length > 0 && (
              <span style={{ marginLeft:8, fontSize:12, background:'var(--accent)', color:'#fff', borderRadius:10, padding:'2px 7px' }}>
                {cart.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </h2>
        </div>
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <Cart onCheckout={() => setShowPayment(true)} />
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onComplete={handleCheckoutComplete}
        />
      )}

      {receipt && (
        <ReceiptModal
          data={receipt}
          onClose={handleNewSale}
          onNewSale={handleNewSale}
        />
      )}
    </div>
  );
}
