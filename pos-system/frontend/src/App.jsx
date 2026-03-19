import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import LoginScreen from './components/POSTerminal/LoginScreen';
import POSTerminal from './components/POSTerminal/POSTerminal';
import ReportsPanel from './components/ReportsPanel/ReportsPanel';
import { LayoutGrid, BarChart2, LogOut, Users } from 'lucide-react';

const NAV_TABS = [
  { id: 'pos',     label: 'POS',     Icon: LayoutGrid, perm: null },
  { id: 'reports', label: 'Reports', Icon: BarChart2,  perm: 'reports' },
];

function Shell() {
  const { employee, logout, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('pos');

  if (!employee) return <LoginScreen />;

  const tabs = NAV_TABS.filter(t => !t.perm || hasPermission(t.perm));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 20px', height: 52, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)', letterSpacing: -0.5 }}>
            ⬡ POS System
          </span>
          <nav style={{ display: 'flex', gap: 4 }}>
            {tabs.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                background: activeTab === id ? 'var(--accent)' : 'transparent',
                color: activeTab === id ? '#fff' : 'var(--muted)',
                fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
              }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
            }}>
              {employee.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{employee.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{employee.role}</div>
            </div>
          </div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--muted)',
            fontSize: 13, border: '1px solid var(--border)',
          }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'pos'     && <POSTerminal />}
        {activeTab === 'reports' && <ReportsPanel />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Shell />
      </CartProvider>
    </AuthProvider>
  );
}
