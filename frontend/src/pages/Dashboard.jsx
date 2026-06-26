import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../components/StatsCard';
import RiskBadge from '../components/RiskBadge';
import KnowledgeGapCard from '../components/KnowledgeGapCard';
import { getDashboardStats, getHighRiskAssets, getKnowledgeGapsSummary } from '../services/api';

// Skeleton loader for table rows
const SkeletonRow = () => (
  <tr className="border-b border-[var(--color-border-main)]">
    {[...Array(7)].map((_, i) => (
      <td key={i} className="py-3 px-3.5">
        <div className="h-3 bg-[var(--color-surface2)] rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
      </td>
    ))}
  </tr>
);

const SkeletonCard = () => (
  <div className="h-3 bg-[var(--color-surface2)] rounded animate-pulse mb-3" />
);

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [gapSummary, setGapSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsData, assetsData, gapData] = await Promise.all([
          getDashboardStats(),
          getHighRiskAssets(),
          getKnowledgeGapsSummary(),
        ]);
        setStats(statsData);
        setAssets(assetsData);
        setGapSummary(gapData);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Could not reach the backend. Make sure the API server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Derive incident trend from asset data for the chart (placeholder shape)
  const incidentTrendData = stats
    ? [
        { name: 'Assets', value: stats.total_assets ?? 0 },
        { name: 'W/O', value: stats.total_work_orders ?? 0 },
        { name: 'Incidents', value: stats.total_incidents ?? 0 },
        { name: 'Inspections', value: stats.total_inspections ?? 0 },
      ]
    : [];

  // Risk distribution derived from the high-risk-assets list
  const riskCounts = assets.reduce(
    (acc, a) => {
      const lvl = (a.risk_level || '').toLowerCase();
      if (lvl === 'critical') acc.critical += 1;
      else if (lvl === 'high') acc.high += 1;
      else if (lvl === 'medium') acc.medium += 1;
      else acc.low += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );
  const total = assets.length || 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[var(--color-text-main)] tracking-[-0.4px]">Operations Dashboard</h1>
        <p className="text-[13.5px] text-[var(--color-text2)] mt-1">Real-time industrial asset monitoring &amp; predictive maintenance intelligence</p>
      </div>

      {error && (
        <div className="mb-5 py-3 px-4 rounded-lg bg-[#EF4444]/8 border border-[#EF4444]/25 text-sm text-[#EF4444] font-medium flex items-center gap-2">
          ⚠ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Assets"
          value={loading ? '—' : String(stats?.total_assets ?? '—')}
          trend={loading ? 'Loading…' : 'From equipment database'}
          icon="⬡"
          colorClass="teal"
        />
        <StatsCard
          title="Open Work Orders"
          value={loading ? '—' : String(stats?.total_work_orders ?? '—')}
          trend={loading ? 'Loading…' : 'Total logged work orders'}
          icon="📋"
          colorClass="amber"
        />
        <StatsCard
          title="High Risk Assets"
          value={loading ? '—' : String(stats?.high_risk_assets ?? '—')}
          trend={loading ? 'Loading…' : 'Risk score ≥ 70'}
          icon="⚠"
          colorClass="red"
        />
        <StatsCard
          title="Incidents This Month"
          value={loading ? '—' : String(stats?.total_incidents ?? '—')}
          trend={loading ? 'Loading…' : `${stats?.knowledge_gaps ?? 0} knowledge gaps detected`}
          icon="📊"
          colorClass="green"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Fleet Summary Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-main)]">Fleet Summary</h2>
              <div className="text-xs text-[var(--color-text3)] mt-px">Live counts from the database</div>
            </div>
            <span className="tag tag-teal">Live</span>
          </div>
          <div className="card-body h-[200px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-sm text-[var(--color-text3)] animate-pulse">Loading chart…</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incidentTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#14B8A6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-main)]">Risk Distribution</h2>
              <div className="text-xs text-[var(--color-text3)] mt-px">Current fleet risk profile</div>
            </div>
            <span className="tag tag-teal">{loading ? '…' : `${assets.length} assets`}</span>
          </div>
          <div className="card-body flex items-center justify-around h-[200px]">
            {loading ? (
              <div className="text-sm text-[var(--color-text3)] animate-pulse">Loading…</div>
            ) : (
              <>
                <div className="relative w-[140px] h-[140px] flex items-center justify-center">
                  <svg viewBox="0 0 160 160" width="140" height="140">
                    <defs>
                      <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/></filter>
                    </defs>
                    <path d="M80,80 L80,20 A60,60 0 0,1 137,110 Z" fill="#22C55E" filter="url(#shadow)"/>
                    <path d="M80,80 L137,110 A60,60 0 0,1 60,138 Z" fill="#F59E0B" filter="url(#shadow)"/>
                    <path d="M80,80 L60,138 A60,60 0 0,1 23,50 Z" fill="#EF4444" filter="url(#shadow)"/>
                    <path d="M80,80 L23,50 A60,60 0 0,1 80,20 Z" fill="#B91C1C" filter="url(#shadow)"/>
                    <circle cx="80" cy="80" r="34" fill="white"/>
                    <text x="80" y="76" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0F172A">{assets.length}</text>
                    <text x="80" y="90" textAnchor="middle" fontSize="9" fill="#94A3B8">ASSETS</text>
                  </svg>
                </div>
                <div className="flex flex-col gap-2.5 w-full max-w-[200px]">
                  {[
                    { label: 'Low', count: riskCounts.low, color: '#22C55E' },
                    { label: 'Medium', count: riskCounts.medium, color: '#F59E0B' },
                    { label: 'High', count: riskCounts.high, color: '#EF4444' },
                    { label: 'Critical', count: riskCounts.critical, color: '#B91C1C' },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                        <span className="text-[13px] text-[var(--color-text2)]">{label}</span>
                      </div>
                      <div className="text-[13px] font-bold text-[var(--color-text-main)]">
                        {count} <span className="text-[var(--color-text3)] font-normal">{Math.round((count / total) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* High Risk Assets Table */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-main)]">High Risk Assets</h2>
            <div className="text-xs text-[var(--color-text3)] mt-px">Assets requiring immediate attention — ranked by risk score</div>
          </div>
          <button className="btn btn-outline text-xs" onClick={() => navigate('/app/assets')}>View All Assets →</button>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border-main)]">
                {['Equipment ID', 'Risk Level', 'Risk Score', ''].map((h) => (
                  <th key={h} className="py-2.5 px-3.5 text-[11px] font-bold tracking-[0.6px] uppercase text-[var(--color-text3)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                : assets.slice(0, 8).map((asset) => (
                    <tr
                      key={asset.equipment_id}
                      className="border-b border-[var(--color-border-main)] hover:bg-[var(--color-surface2)] cursor-pointer"
                      onClick={() => navigate(`/app/equipment/${asset.equipment_id}`)}
                    >
                      <td className="py-3 px-3.5 font-mono text-xs font-semibold text-[var(--color-primary)]">{asset.equipment_id}</td>
                      <td className="py-3 px-3.5"><RiskBadge risk={asset.risk_level} /></td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(asset.risk_score, 100)}%`,
                                backgroundColor: asset.risk_score >= 90 ? '#B91C1C' : asset.risk_score >= 70 ? '#EF4444' : '#F59E0B',
                              }}
                            />
                          </div>
                          <span
                            className="text-[12.5px] font-semibold"
                            style={{ color: asset.risk_score >= 90 ? '#B91C1C' : asset.risk_score >= 70 ? '#EF4444' : '#F59E0B' }}
                          >
                            {Math.round(asset.risk_score)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5"><span className="tag text-[#2563EB] bg-[#3B82F6]/10 border-[#3B82F6]/20 font-semibold cursor-pointer">View →</span></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Knowledge Gap Alerts */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-main)]">⚠ Knowledge Gap Alerts</h2>
            <div className="text-xs text-[var(--color-text3)] mt-px">Potentially preventable failures detected</div>
          </div>
          <span className="inline-flex items-center gap-1.5 py-[5px] px-3 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[var(--color-primary)] text-xs font-semibold">
            🧠 AI Detected · {loading ? '…' : `${gapSummary?.total_gaps ?? 0} gaps`}
          </span>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : gapSummary?.top_assets?.length ? (
            gapSummary.top_assets.map((assetId) => (
              <KnowledgeGapCard
                key={assetId}
                asset={assetId}
                risk={
                  assets.find((a) => a.equipment_id === assetId)?.risk_level ?? 'High'
                }
                finding="Inspection follow-up required — potential failure risk"
                recommendation="Review latest inspection report and assign work order"
              />
            ))
          ) : (
            <div className="text-sm text-[var(--color-text3)] py-4 text-center">No critical knowledge gaps detected.</div>
          )}
          {!loading && gapSummary && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border-main)] flex items-center justify-between text-xs text-[var(--color-text3)]">
              <span>Preventable failure rate: <span className="font-bold text-[var(--color-text-main)]">{gapSummary.preventable_failure_rate ?? 0}%</span></span>
              <span>{gapSummary.total_gaps ?? 0} total gaps across fleet</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
