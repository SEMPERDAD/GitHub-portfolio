import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { Search, X, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerSearch({ onSelect, onClose }) {
  const [search, setSearch]       = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [newForm, setNewForm]     = useState({ first_name:'', last_name:'', email:'', phone:'' });
  const [creating, setCreating]   = useState(false);

  const { data: customers = [], isFetching } = useQuery({
    queryKey: ['customers-search', search],
    queryFn:  () => search.length >= 2 ? api.get('/customers', { params: { search } }) : Promise.resolve([]),
    enabled:  search.length >= 2,
  });

  async function createCustomer(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const customer = await api.post('/customers', newForm);
      toast.success('Customer created');
      onSelect(customer);
    } catch (err) {
      toast.error(err?.error || 'Failed to create customer');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:50,
    }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, width:480, maxHeight:'80vh', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <h2 style={{ fontSize:16, fontWeight:700 }}>Select Customer</h2>
          <button onClick={onClose} style={{ background:'transparent', color:'var(--muted)', padding:4 }}><X size={18} /></button>
        </div>

        <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }} />
            <input
              autoFocus
              style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 34px', color:'var(--text)', fontSize:14, outline:'none' }}
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'8px 20px' }}>
          {isFetching && <p style={{ color:'var(--muted)', textAlign:'center', padding:20 }}>Searching…</p>}
          {!isFetching && search.length >= 2 && customers.length === 0 && (
            <p style={{ color:'var(--muted)', textAlign:'center', padding:20 }}>No customers found</p>
          )}
          {customers.map(c => (
            <button key={c.id} onClick={() => onSelect(c)} style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 12px', borderRadius:8, background:'var(--surface2)',
              border:'1px solid var(--border)', marginBottom:6, textAlign:'left',
            }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600 }}>{c.first_name} {c.last_name}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>{c.email} {c.phone && `• ${c.phone}`}</div>
              </div>
              <div style={{ fontSize:12, color:'var(--green)' }}>★ {c.loyalty_pts} pts</div>
            </button>
          ))}
        </div>

        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)' }}>
          {!showNew ? (
            <button onClick={() => setShowNew(true)} style={{
              width:'100%', padding:'9px 0', borderRadius:8, background:'transparent',
              border:'1px dashed var(--border)', color:'var(--muted)', fontSize:13,
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              <UserPlus size={14} /> New Customer
            </button>
          ) : (
            <form onSubmit={createCustomer} style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {['first_name','last_name'].map(f => (
                  <input key={f} required
                    style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'7px 10px', color:'var(--text)', fontSize:13, outline:'none' }}
                    placeholder={f === 'first_name' ? 'First name' : 'Last name'}
                    value={newForm[f]} onChange={e => setNewForm(p => ({ ...p, [f]: e.target.value }))}
                  />
                ))}
              </div>
              {['email','phone'].map(f => (
                <input key={f} type={f === 'email' ? 'email' : 'tel'}
                  style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'7px 10px', color:'var(--text)', fontSize:13, outline:'none' }}
                  placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                  value={newForm[f]} onChange={e => setNewForm(p => ({ ...p, [f]: e.target.value }))}
                />
              ))}
              <div style={{ display:'flex', gap:6 }}>
                <button type="submit" disabled={creating} style={{ flex:1, padding:'8px 0', background:'var(--accent)', color:'#fff', borderRadius:6, fontSize:13, fontWeight:600 }}>
                  {creating ? 'Creating…' : 'Create & Select'}
                </button>
                <button type="button" onClick={() => setShowNew(false)} style={{ padding:'8px 12px', background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)', borderRadius:6, fontSize:13 }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
