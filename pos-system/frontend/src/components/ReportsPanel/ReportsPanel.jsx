import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { BarChart2, TrendingUp, Package, Users, Tag, RefreshCw } from 'lucide-react';

const today = new Date().toISOString().slice(0, 10);

export default function ReportsPanel() {
  const [from, setFrom] = useState(today);
  const [to,   setTo]   = useState(today);

  const params = { date_from: from, date_to: to };

  const { data: summary,      isLoading: l1, refetch: r1 } = useQuery({ queryKey: ['report-summary', from, to],      queryFn: () => api.get('/reports/summary', { params }) });
  const { data: topProducts,  isLoading: l2 } = useQuery({ queryKey: ['report-top-products', from, to], queryFn: () => api.get('/reports/top-products', { params }) });
  const { data: invValue,     isLoading: l3 } = useQuery({ queryKey: ['report-inv-value'],                queryFn: () => api.get('/reports/inventory-value') });
  const { data: empReport,    isLoading: l4 } = useQuery({ queryKey: ['report-employees', from, to],      queryFn: () => api.get('/reports/employees', { params }) });

  function refresh() { r1(); }

  if (l1 || l2 || l3 || l4) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--muted)' }}>Loading reports…</div>;
  }

  const s = summary || {};
  const sales = s.sales || {};

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:24 }}>
      {/* Date range */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:700, flex:1 }}>Reports & Analytics</h1>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontSize:13 }} />
        <span style={{ color:'var(--muted)' }}>to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)', fontSize:13 }} />
        <button onClick={refresh} style={{ padding:'6px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--muted)', display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16, marginBottom:24 }}>
        <KpiCard label="Orders"         value={sales.order_count || 0}                            icon={<BarChart2 size={18}/>} color="#6366f1" />
        <KpiCard label="Net Sales"      value={`$${(sales.net_sales || 0).toFixed(2)}`}           icon={<TrendingUp size={18}/>} color="#10b981" />
        <KpiCard label="Avg Order"      value={`$${(sales.avg_order_value || 0).toFixed(2)}`}     icon={<Tag size={18}/>} color="#f59e0b" />
        <KpiCard label="Tax Collected"  value={`$${(sales.total_tax || 0).toFixed(2)}`}           icon={<Package size={18}/>} color="#8b5cf6" />
        <KpiCard label="Discounts"      value={`$${(sales.total_discounts || 0).toFixed(2)}`}     icon={<Tag size={18}/>} color="#ef4444" />
        <KpiCard label="Refunds"        value={`$${((s.refunds || {}).total || 0).toFixed(2)}`}   icon={<RefreshCw size={18}/>} color="#64748b" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* Top Products */}
        <SectionCard title="Top Products" icon={<Package size={15}/>}>
          {(topProducts?.products || []).slice(0, 8).map((p, i) => (
            <div key={p.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:20, height:20, borderRadius:5, background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--muted)' }}>{i+1}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{p.total_qty} sold</div>
                </div>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>${(p.total_revenue || 0).toFixed(2)}</span>
            </div>
          ))}
          {(!topProducts?.products?.length) && <Empty />}
        </SectionCard>

        {/* Payment methods breakdown */}
        <SectionCard title="Payment Methods" icon={<Tag size={15}/>}>
          {(s.payment_methods || []).map(m => (
            <div key={m.method} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, textTransform:'capitalize' }}>{m.method.replace('_',' ')}</div>
                <div style={{ fontSize:11, color:'var(--muted)' }}>{m.count} transactions</div>
              </div>
              <span style={{ fontSize:13, fontWeight:700 }}>${(m.total || 0).toFixed(2)}</span>
            </div>
          ))}
          {!(s.payment_methods?.length) && <Empty />}
        </SectionCard>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Employee performance */}
        <SectionCard title="Employee Performance" icon={<Users size={15}/>}>
          {(empReport?.employees || []).map(e => (
            <div key={e.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>{e.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)', textTransform:'capitalize' }}>{e.role} • {e.orders_handled} orders</div>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--accent)' }}>${(e.total_sales || 0).toFixed(2)}</span>
            </div>
          ))}
          {!(empReport?.employees?.length) && <Empty />}
        </SectionCard>

        {/* Inventory value */}
        <SectionCard title="Inventory Value" icon={<Package size={15}/>}>
          {invValue && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'8px 0' }}>
              {[
                { label:'Products', value: invValue.product_count },
                { label:'Low Stock', value: invValue.low_stock_count, warn: invValue.low_stock_count > 0 },
                { label:'Cost Value', value: `$${invValue.cost_value.toFixed(2)}` },
                { label:'Retail Value', value: `$${invValue.retail_value.toFixed(2)}` },
                { label:'Potential Margin', value: `$${invValue.potential_margin.toFixed(2)}`, color:'var(--green)' },
              ].map(r => (
                <div key={r.label} style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:3 }}>{r.label}</div>
                  <div style={{ fontSize:16, fontWeight:700, color: r.warn ? 'var(--yellow)' : (r.color || 'var(--text)') }}>{r.value}</div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:12, color:'var(--muted)', fontWeight:500 }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ fontSize:22, fontWeight:700 }}>{value}</div>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' }}>
      <h3 style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:700, marginBottom:12, color:'var(--muted)' }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>No data for this period</p>;
}
