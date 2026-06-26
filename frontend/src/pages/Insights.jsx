import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import RiskBadge from '../components/RiskBadge';
import { getExecutiveInsights, getKnowledgeGapsSummary, getHighRiskAssets, getKnowledgeGaps } from '../services/api';

const Skeleton = ({ w = 'w-24', h = 'h-3' }) => (
  <div className={`${h} ${w} bg-[var(--color-surface2)] rounded animate-pulse`} />
);

// Map risk_score to failure mode colour
const failureModeColors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#94A3B8'];

const Insights = () => {
  const navigate = useNavigate();

  const [exec, setExec] = useState(null);
  const [gapSummary, setGapSummary] = useState(null);
  const [highRisk, setHighRisk] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [execData, gapSummData, highRiskData, gapsData] = await Promise.all([
          getExecutiveInsights(),
          getKnowledgeGapsSummary(),
          getHighRiskAssets(),
          getKnowledgeGaps(),
        ]);
        setExec(execData);
        setGapSummary(gapSummData);
        setHighRisk(highRiskData);
        setGaps(gapsData?.gaps ?? []);
      } catch (err) {
        console.error('Insights fetch error:', err);
        setError('Could not load insights. Make sure the API server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Build failure mode frequency data from knowledge gaps
  const failureModes = gaps.reduce((acc, g) => {
    const mode = g.common_failure_mode ?? 'Unknown';
    acc[mode] = (acc[mode] ?? 0) + 1;
    return acc;
  }, {});
  const sortedModes = Object.entries(failureModes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalModeCount = sortedModes.reduce((s, [, c]) => s + c, 0) || 1;

  // Build MTBF-style trend data from exec insights (risk trend proxy)
  const trendData = exec?.risk_trend ?? [
    { name: 'Q4 \'24', value: 35 },
    { name: 'Q1 \'25', value: 48 },
    { name: 'Q2 \'25', value: 60 },
    { name: 'Q3 \'25', value: exec?.avg_risk_score ?? 72 },
  ];

  // Top predicted failures: first 3 high-risk assets
  const predicted = highRisk.filter(
    (a) => (a.risk_level === 'Critical' || a.risk_level === 'High') 
  ).slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[var(--color-text-main)] tracking-[-0.4px]">Insights &amp; Analytics</h1>
        <p className="text-[13.5px] text-[var(--color-text2)] mt-1">Fleet-level AI intelligence and maintenance pattern analysis</p>
      </div>

      {error && (
        <div className="mb-5 py-3 px-4 rounded-lg bg-[#EF4444]/8 border border-[#EF4444]/25 text-sm text-[#EF4444] font-medium flex items-center gap-2">
          ⚠ {error}
        </div>
      )}

      {/* Executive Summary strip */}
      {!loading && exec && (
        <div className="card mb-6">
          <div className="card-header">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-main)]">📊 Executive Summary</h2>
              <div className="text-xs text-[var(--color-text3)] mt-px">AI-derived from live database</div>
            </div>
            <span className="tag tag-teal">Live</span>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Highest Risk Asset', value: exec.highest_risk_asset ?? '—', mono: true },
                { label: 'Top Failure Mode', value: exec.most_common_failure_mode ?? '—' },
                { label: 'Avg Risk Score', value: exec.avg_risk_score != null ? `${Math.round(exec.avg_risk_score)}` : '—' },
                { label: 'Preventable Failures', value: exec.preventable_failures != null ? `${exec.preventable_failures}` : '—' },
              ].map(({ label, value, mono }) => (
                <div key={label} className="text-center">
                  <div className="text-[10.5px] font-bold tracking-[0.5px] uppercase text-[var(--color-text3)] mb-1">{label}</div>
                  <div
                    className={`text-[16px] font-extrabold text-[var(--color-text-main)] ${mono ? 'font-mono text-[var(--color-primary)]' : ''}`}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
            {exec.recommended_action && (
              <div className="mt-4 py-2.5 px-3.5 bg-[#0F766E]/5 rounded-lg border border-[#0F766E]/15 text-[12.5px] text-[var(--color-text2)]">
                <span className="font-semibold text-[var(--color-primary)]">Recommended Action: </span>
                {exec.recommended_action}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Predicted Failures */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-[var(--color-text-main)]">🎯 High Risk Assets</h2>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="flex flex-col gap-2.5">
                {[...Array(3)].map((_, i) => <Skeleton key={i} w="w-full" h="h-8" />)}
              </div>
            ) : predicted.length === 0 ? (
              <div className="text-sm text-[var(--color-text3)] py-4 text-center">No critical/high assets found.</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {predicted.map((a) => (
                  <div
                    key={a.equipment_id}
                    className="flex justify-between items-center py-2 px-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: a.risk_level === 'Critical' ? 'rgba(185,28,28,0.05)' : 'rgba(239,68,68,0.05)',
                      borderColor: a.risk_level === 'Critical' ? 'rgba(185,28,28,0.15)' : 'rgba(239,68,68,0.15)',
                    }}
                    onClick={() => navigate(`/app/equipment/${a.equipment_id}`)}
                  >
                    <span className="text-[12.5px] font-mono font-bold text-[var(--color-primary)]">{a.equipment_id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--color-text3)]">{Math.round(a.risk_score)}</span>
                      <RiskBadge risk={a.risk_level} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Risk Score Trend */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-[var(--color-text-main)]">📈 Risk Score Trend</h2>
          </div>
          <div className="card-body">
            <div className="h-[120px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-sm text-[var(--color-text3)] animate-pulse">Loading…</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mtbfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.25}/>
                        <stop offset="100%" stopColor="#14B8A6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94A3B8' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#14B8A6" strokeWidth={2.5} fillOpacity={1} fill="url(#mtbfGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="text-xs text-[var(--color-text2)] text-center mt-2">
              {loading ? '…' : `Avg risk score: ${exec?.avg_risk_score != null ? Math.round(exec.avg_risk_score) : '—'}`}
            </div>
          </div>
        </div>

        {/* Top Failure Modes */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-[var(--color-text-main)]">🔩 Top Failure Modes</h2>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} w="w-full" h="h-4" />)}
              </div>
            ) : sortedModes.length === 0 ? (
              <div className="text-sm text-[var(--color-text3)] py-4 text-center">No failure mode data.</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {sortedModes.map(([mode, count], idx) => {
                  const pct = Math.round((count / totalModeCount) * 100);
                  return (
                    <div key={mode}>
                      <div className="flex justify-between text-[12.5px] text-[var(--color-text2)] mb-1">
                        <span>{mode}</span>
                        <span className="font-bold text-[var(--color-text-main)]">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[var(--color-border-main)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: failureModeColors[idx] ?? '#94A3B8' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Knowledge Gap Detail */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-main)]">⚠ Knowledge Gap Detail</h2>
            <div className="text-xs text-[var(--color-text3)] mt-px">
              {loading ? '…' : `${gapSummary?.total_gaps ?? 0} gaps · ${gapSummary?.preventable_failure_rate ?? 0}% preventable failure rate`}
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 py-[5px] px-3 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[var(--color-primary)] text-xs font-semibold">
            🧠 AI Detected
          </span>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border-main)]">
                {['Asset', 'Finding', 'Recommendation', 'Risk Score', 'Risk', ''].map((h) => (
                  <th key={h} className="py-2.5 px-3.5 text-[11px] font-bold tracking-[0.6px] uppercase text-[var(--color-text3)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b border-[var(--color-border-main)]">
                      {[...Array(6)].map((__, j) => (
                        <td key={j} className="py-3 px-3.5"><div className="h-3 bg-[var(--color-surface2)] rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : gaps.slice(0, 10).map((gap, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--color-border-main)] hover:bg-[var(--color-surface2)] cursor-pointer"
                      onClick={() => navigate(`/app/equipment/${gap.equipment_id}`)}
                    >
                      <td className="py-3 px-3.5 font-mono text-xs font-semibold text-[var(--color-primary)]">{gap.equipment_id}</td>
                      <td className="py-3 px-3.5 text-[var(--color-text-main)] max-w-[180px] truncate">{gap.finding}</td>
                      <td className="py-3 px-3.5 text-[var(--color-text2)] max-w-[180px] truncate">{gap.recommendation}</td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(gap.risk_score, 100)}%`,
                                backgroundColor: gap.risk_score >= 85 ? '#B91C1C' : '#EF4444',
                              }}
                            />
                          </div>
                          <span className="text-[12px] font-semibold text-[var(--color-text-main)]">{gap.risk_score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5"><RiskBadge risk={gap.risk} /></td>
                      <td className="py-3 px-3.5">
                        <span className="tag text-[#2563EB] bg-[#3B82F6]/10 border-[#3B82F6]/20 font-semibold cursor-pointer">View →</span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!loading && gaps.length === 0 && (
            <div className="text-sm text-[var(--color-text3)] py-6 text-center">No knowledge gaps detected in the current dataset.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Insights;
