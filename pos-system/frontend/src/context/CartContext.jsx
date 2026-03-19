import React, { createContext, useContext, useReducer, useCallback } from 'react';

const CartContext = createContext(null);

const TAX_RATE = 0.08;

function calcTotals(items, discountAmount = 0, tipAmount = 0) {
  const subtotal = items.reduce((sum, item) => {
    const base = item.unit_price * item.quantity;
    const disc = base * ((item.discount_pct || 0) / 100);
    return sum + (base - disc);
  }, 0);
  const discounted = Math.max(0, subtotal - discountAmount);
  const tax   = discounted * TAX_RATE;
  const total = discounted + tax + tipAmount;
  return {
    subtotal:        parseFloat(subtotal.toFixed(2)),
    discount_amount: parseFloat(discountAmount.toFixed(2)),
    tax_amount:      parseFloat(tax.toFixed(2)),
    tip_amount:      parseFloat(tipAmount.toFixed(2)),
    total:           parseFloat(total.toFixed(2)),
  };
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.findIndex(i =>
        i.product_id === action.item.product_id && !action.item.modifiers?.length
      );
      let items;
      if (existing >= 0 && action.item.product_id) {
        items = state.items.map((item, idx) =>
          idx === existing ? { ...item, quantity: item.quantity + (action.item.quantity || 1) } : item
        );
      } else {
        items = [...state.items, {
          id:          `item-${Date.now()}-${Math.random()}`,
          product_id:  action.item.product_id || null,
          name:        action.item.name,
          sku:         action.item.sku || null,
          unit_price:  action.item.price || action.item.unit_price,
          quantity:    action.item.quantity || 1,
          discount_pct: 0,
          modifiers:   action.item.modifiers || [],
          notes:       action.item.notes || null,
        }];
      }
      return { ...state, items, ...calcTotals(items, state.discount_amount, state.tip_amount) };
    }

    case 'UPDATE_QTY': {
      const items = action.quantity <= 0
        ? state.items.filter(i => i.id !== action.id)
        : state.items.map(i => i.id === action.id ? { ...i, quantity: action.quantity } : i);
      return { ...state, items, ...calcTotals(items, state.discount_amount, state.tip_amount) };
    }

    case 'REMOVE_ITEM': {
      const items = state.items.filter(i => i.id !== action.id);
      return { ...state, items, ...calcTotals(items, state.discount_amount, state.tip_amount) };
    }

    case 'SET_DISCOUNT': {
      return { ...state, discount_amount: action.amount, discount_code: action.code,
               ...calcTotals(state.items, action.amount, state.tip_amount) };
    }

    case 'SET_TIP':
      return { ...state, tip_amount: action.amount, ...calcTotals(state.items, state.discount_amount, action.amount) };

    case 'SET_CUSTOMER':
      return { ...state, customer: action.customer, customer_id: action.customer?.id || null };

    case 'SET_NOTE':
      return { ...state, note: action.note };

    case 'CLEAR':
      return { ...initialState };

    default:
      return state;
  }
}

const initialState = {
  items:           [],
  customer:        null,
  customer_id:     null,
  subtotal:        0,
  discount_amount: 0,
  discount_code:   null,
  tax_amount:      0,
  tip_amount:      0,
  total:           0,
  note:            '',
};

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  const addItem     = useCallback(item    => dispatch({ type: 'ADD_ITEM',    item }),    []);
  const updateQty   = useCallback((id, q) => dispatch({ type: 'UPDATE_QTY', id, quantity: q }), []);
  const removeItem  = useCallback(id      => dispatch({ type: 'REMOVE_ITEM', id }),      []);
  const setDiscount = useCallback((amount, code) => dispatch({ type: 'SET_DISCOUNT', amount, code }), []);
  const setTip      = useCallback(amount  => dispatch({ type: 'SET_TIP',     amount }), []);
  const setCustomer = useCallback(customer => dispatch({ type: 'SET_CUSTOMER', customer }), []);
  const setNote     = useCallback(note    => dispatch({ type: 'SET_NOTE',    note }),    []);
  const clearCart   = useCallback(()      => dispatch({ type: 'CLEAR' }),                []);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQty, removeItem, setDiscount, setTip, setCustomer, setNote, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
