import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, Mail } from 'lucide-react';

const s = {
  wrap:  { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' },
  card:  { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:40, width:360 },
  logo:  { textAlign:'center', marginBottom:32 },
  label: { display:'block', fontSize:13, color:'var(--muted)', marginBottom:6, fontWeight:500 },
  input: { width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:15, outline:'none' },
  btn:   { width:'100%', padding:'12px 0', background:'var(--accent)', color:'#fff', borderRadius:8, fontSize:15, fontWeight:600, marginTop:8, transition:'background 0.15s' },
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [form, setForm]     = useState({ email: '', pin: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.pin);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={{ fontSize:40, marginBottom:8 }}>⬡</div>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>POS System</h1>
          <p style={{ color:'var(--muted)', fontSize:14, marginTop:4 }}>Sign in to your register</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={s.label}><Mail size={12} style={{marginRight:4,verticalAlign:'middle'}}/>Email</label>
            <input style={s.input} type="email" required autoFocus
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@store.com" />
          </div>
          <div>
            <label style={s.label}><Lock size={12} style={{marginRight:4,verticalAlign:'middle'}}/>PIN</label>
            <input style={s.input} type="password" required maxLength={8}
              value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))}
              placeholder="••••" />
          </div>
          <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop:20, fontSize:12, color:'var(--muted)', textAlign:'center' }}>
          Demo: admin@store.com / 1234
        </p>
      </div>
    </div>
  );
}
