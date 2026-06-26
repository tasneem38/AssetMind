import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import {
  getEquipmentById,
  getEquipmentHealth,
  getBriefing,
  getEquipmentIncidents,
  getEquipmentInspections,
  predictFailure,
  predictRUL,
} from '../services/api';

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (val, fallback = '—') => (val != null ? val : fallback);

const healthColor = (score) =>
  score < 50 ? '#B91C1C' : score < 70 ? '#EF4444' : score < 80 ? '#F59E0B' : '#22C55E';

const Skeleton = ({ w = 'w-24', h = 'h-3' }) => (
  <div className={`${h} ${w} bg-[var(--color-surface2)] rounded animate-pulse`} />
);

const SectionSkeleton = () => (
  <div className="flex flex-col gap-3 py-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-start gap-3 py-2 border-b border-[var(--color-border-main)] last:border-b-0">
        <div className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[var(--color-surface2)] animate-pulse" />
        <div className="flex-1">
          <Skeleton w="w-2/3" h="h-3" />
          <div className="mt-1"><Skeleton w="w-1/2" h="h-2.5" /></div>
        </div>
      </div>
    ))}
  </div>
);

// ── Predict Panel ────────────────────────────────────────────────────────────

const DEFAULT_FAILURE_INPUT = {
  air_temperature: 298.1,
  process_temperature: 308.6,
  rotational_speed: 1551.0,
  torque: 42.8,
  tool_wear: 0.0,
};

const RUL_SENSOR_LABELS = [
  { key: 's2', label: 'Fan Speed (s2)', unit: 'RPM' },
  { key: 's3', label: 'HPC Outlet Pressure (s3)', unit: 'psia' },
  { key: 's4', label: 'LPT Outlet Temp (s4)', unit: '°R' },
  { key: 's7', label: 'HPC Outlet Static Pressure (s7)', unit: 'psia' },
  { key: 's8', label: 'Fuel/Air Ratio (s8)', unit: 'lbm/s' },
  { key: 's9', label: 'Bypass Ratio (s9)', unit: '' },
  { key: 's11', label: 'HPC Outlet Bleed Enthalpy (s11)', unit: '' },
  { key: 's12', label: 'Low-Pressure Turbine Coolant (s12)', unit: '' },
  { key: 's13', label: 'High-Pressure Turbine Coolant (s13)', unit: '' },
  { key: 's14', label: 'LPT Outlet Pressure (s14)', unit: 'psia' },
  { key: 's15', label: 'Bleed Enthalpy (s15)', unit: '' },
  { key: 's17', label: 'Total Pressure Ratio (s17)', unit: '' },
  { key: 's20', label: 'HP Turbine Exit Temp (s20)', unit: '°R' },
  { key: 's21', label: 'LPT Exit Temp (s21)', unit: '°R' },
];

const DEFAULT_RUL_SENSORS = {
  s2: 642.20, s3: 1591.82, s4: 1400.60, s7: 553.36, s8: 2388.02,
  s9: 9065.0, s11: 47.20, s12: 521.66, s13: 2388.02, s14: 8141.08,
  s15: 8.4195, s17: 0.03, s20: 392.0, s21: 38.96,
};

const PredictPanel = () => {
  const [failureInput, setFailureInput] = useState(DEFAULT_FAILURE_INPUT);
  const [rulSensors, setRulSensors] = useState(DEFAULT_RUL_SENSORS);
  const [engineId, setEngineId] = useState(1);

  const [failureResult, setFailureResult] = useState(null);
  const [rulResult, setRulResult] = useState(null);
  const [failureLoading, setFailureLoading] = useState(false);
  const [rulLoading, setRulLoading] = useState(false);
  const [failureError, setFailureError] = useState(null);
  const [rulError, setRulError] = useState(null);

  const handlePredictFailure = async () => {
    setFailureLoading(true);
    setFailureError(null);
    try {
      const result = await predictFailure(failureInput);
      setFailureResult(result);
    } catch (err) {
      setFailureError(err?.response?.data?.detail ?? 'Prediction failed. Model may not be trained yet.');
    } finally {
      setFailureLoading(false);
    }
  };

  const handlePredictRUL = async () => {
    setRulLoading(true);
    setRulError(null);
    try {
      const sensorValues = RUL_SENSOR_LABELS.map(({ key }) => rulSensors[key]);
      const result = await predictRUL({ engine_id: engineId, sensor_values: sensorValues });
      setRulResult(result);
    } catch (err) {
      setRulError(err?.response?.data?.detail ?? 'RUL prediction failed. Model may not be trained yet.');
    } finally {
      setRulLoading(false);
    }
  };

  const riskColor = (level) => {
    if (!level) return '#94A3B8';
    const l = level.toLowerCase();
    if (l === 'high') return '#EF4444';
    if (l === 'medium') return '#F59E0B';
    return '#22C55E';
  };

  const trendColor = (trend) => {
    if (!trend) return '#94A3B8';
    const t = trend.toLowerCase();
    if (t === 'critical') return '#B91C1C';
    if (t === 'declining') return '#EF4444';
    if (t === 'stable') return '#F59E0B';
    return '#22C55E';
  };

  return (
    <div className="card mt-4">
      <div className="card-header">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-main)]">🧠 AI Predictions</h2>
          <div className="text-xs text-[var(--color-text3)] mt-px">Live ML inference — Failure Probability (AI4I) &amp; Remaining Useful Life (NASA CMAPSS)</div>
        </div>
        <span className="tag tag-teal">ML Models</span>
      </div>

      <div className="grid grid-cols-2 gap-5 p-5">
        {/* ── Failure Probability ────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="text-[12px] font-bold tracking-[0.5px] uppercase text-[var(--color-text3)]">Failure Probability (AI4I RF Model)</div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { key: 'air_temperature', label: 'Air Temp', unit: 'K' },
              { key: 'process_temperature', label: 'Process Temp', unit: 'K' },
              { key: 'rotational_speed', label: 'Rotational Speed', unit: 'RPM' },
              { key: 'torque', label: 'Torque', unit: 'Nm' },
              { key: 'tool_wear', label: 'Tool Wear', unit: 'min' },
            ].map(({ key, label, unit }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[10.5px] text-[var(--color-text3)] font-semibold">{label} <span className="font-normal">({unit})</span></label>
                <input
                  type="number"
                  step="any"
                  value={failureInput[key]}
                  onChange={(e) => setFailureInput((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                  className="py-[7px] px-2.5 bg-[var(--color-bg)] border border-[var(--color-border-main)] rounded-lg text-[12.5px] outline-none focus:border-[var(--color-primary-light)] transition-all"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handlePredictFailure}
            disabled={failureLoading}
            className="btn btn-primary text-xs mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {failureLoading ? '⏳ Running model…' : '▶ Run Failure Prediction'}
          </button>

          {failureError && (
            <div className="py-2 px-3 text-xs text-[#EF4444] bg-[#EF4444]/8 rounded-lg border border-[#EF4444]/20">{failureError}</div>
          )}

          {failureResult && (
            <div className="py-3 px-3.5 bg-[var(--color-surface2)] rounded-[10px] border border-[var(--color-border-main)] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text3)]">Failure Probability</span>
                <span className="text-[20px] font-extrabold" style={{ color: riskColor(failureResult.risk_level) }}>
                  {Math.round(failureResult.failure_probability * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--color-border-main)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${failureResult.failure_probability * 100}%`, backgroundColor: riskColor(failureResult.risk_level) }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--color-text3)]">Risk Level:</span>
                <span className="text-[12px] font-bold" style={{ color: riskColor(failureResult.risk_level) }}>{failureResult.risk_level}</span>
              </div>
              {failureResult.top_features?.length > 0 && (
                <div>
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.5px] text-[var(--color-text3)] mb-1">Top Contributing Factors</div>
                  {failureResult.top_features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[12px] text-[var(--color-text2)]">
                      <span className="text-[var(--color-primary-light)] text-[10px]">▸</span> {f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RUL Prediction ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="text-[12px] font-bold tracking-[0.5px] uppercase text-[var(--color-text3)]">Remaining Useful Life (NASA CMAPSS XGBoost)</div>

          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] text-[var(--color-text3)] font-semibold">Engine ID</label>
            <input
              type="number"
              value={engineId}
              onChange={(e) => setEngineId(parseInt(e.target.value) || 1)}
              className="py-[7px] px-2.5 bg-[var(--color-bg)] border border-[var(--color-border-main)] rounded-lg text-[12.5px] outline-none focus:border-[var(--color-primary-light)] transition-all w-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
            {RUL_SENSOR_LABELS.map(({ key, label, unit }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[10px] text-[var(--color-text3)] font-semibold leading-tight">
                  {label}{unit ? ` (${unit})` : ''}
                </label>
                <input
                  type="number"
                  step="any"
                  value={rulSensors[key]}
                  onChange={(e) => setRulSensors((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                  className="py-[7px] px-2.5 bg-[var(--color-bg)] border border-[var(--color-border-main)] rounded-lg text-[12px] outline-none focus:border-[var(--color-primary-light)] transition-all"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handlePredictRUL}
            disabled={rulLoading}
            className="btn btn-primary text-xs mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {rulLoading ? '⏳ Running model…' : '▶ Run RUL Prediction'}
          </button>

          {rulError && (
            <div className="py-2 px-3 text-xs text-[#EF4444] bg-[#EF4444]/8 rounded-lg border border-[#EF4444]/20">{rulError}</div>
          )}

          {rulResult && (
            <div className="py-3 px-3.5 bg-[var(--color-surface2)] rounded-[10px] border border-[var(--color-border-main)] flex flex-col gap-2.5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.5px] text-[var(--color-text3)] mb-1">Health Score</div>
                  <div className="text-[22px] font-extrabold" style={{ color: healthColor(rulResult.health_score) }}>
                    {rulResult.health_score}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.5px] text-[var(--color-text3)] mb-1">Cycles RUL</div>
                  <div className="text-[22px] font-extrabold text-[var(--color-primary)]">{rulResult.remaining_useful_life}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.5px] text-[var(--color-text3)] mb-1">Trend</div>
                  <div className="text-[13px] font-bold mt-1.5" style={{ color: trendColor(rulResult.degradation_trend) }}>
                    {rulResult.degradation_trend}
                  </div>
                </div>
              </div>
              <div className="h-1.5 bg-[var(--color-border-main)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${rulResult.health_score}%`, backgroundColor: healthColor(rulResult.health_score) }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────

const EquipmentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState(null);
  const [health, setHealth] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPredictions, setShowPredictions] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [equipData, healthData, briefData, incData, inspData] = await Promise.all([
          getEquipmentById(id),
          getEquipmentHealth(id),
          getBriefing(id),
          getEquipmentIncidents(id),
          getEquipmentInspections(id),
        ]);
        setEquipment(equipData);
        setHealth(healthData);
        setBriefing(briefData);
        setIncidents(incData);
        setInspections(inspData);
      } catch (err) {
        console.error('EquipmentProfile fetch error:', err);
        setError('Could not load equipment data. Make sure the API server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const healthScore = health?.health_score ?? null;
  const healthStatus = health?.status ?? null;
  const healthCol = healthScore != null ? healthColor(healthScore) : '#94A3B8';

  if (error) {
    return (
      <div>
        <div
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-text2)] cursor-pointer mb-4 py-1.5 px-3 rounded-lg border border-[var(--color-border-main)] bg-white transition-all hover:text-[var(--color-primary)] hover:border-[var(--color-primary-light)]"
          onClick={() => navigate('/app/assets')}
        >
          ← Back to Assets
        </div>
        <div className="py-3 px-4 rounded-lg bg-[#EF4444]/8 border border-[#EF4444]/25 text-sm text-[#EF4444] font-medium">⚠ {error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <div
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-text2)] cursor-pointer mb-4 py-1.5 px-3 rounded-lg border border-[var(--color-border-main)] bg-white transition-all hover:text-[var(--color-primary)] hover:border-[var(--color-primary-light)]"
        onClick={() => navigate('/app/assets')}
      >
        ← Back to Assets
      </div>

      {/* Header banner */}
      <div className="bg-gradient-to-br from-[#0D1B2A] via-[#0F2840] to-[#0F3A3A] rounded-[12px] p-7 mb-5 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.12)]">
        <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.2),transparent_70%)]" />
        <div className="absolute bottom-[-30px] left-[40%] w-[160px] h-[160px] rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.15),transparent_70%)]" />

        <div className="font-mono text-[12px] font-semibold text-[#14B8A6] tracking-[1px] mb-1.5 opacity-90">
          {id}
        </div>
        {loading ? (
          <>
            <div className="h-6 w-64 bg-white/10 rounded animate-pulse mb-1" />
            <div className="h-3.5 w-48 bg-white/10 rounded animate-pulse" />
          </>
        ) : (
          <>
            <div className="text-2xl font-extrabold text-white tracking-[-0.5px] mb-1">
              {fmt(equipment?.equipment_name, equipment?.equipment_id ?? id)}
            </div>
            <div className="text-[13px] text-white/50">
              {fmt(equipment?.manufacturer)} · {fmt(equipment?.location)} · Criticality: {fmt(equipment?.criticality)}
            </div>
          </>
        )}
        <div className="flex gap-2 mt-3.5 flex-wrap">
          <span className="py-1 px-3 rounded-full text-[11.5px] font-semibold bg-white/10 text-white/75 border border-white/10">
            ⚙ {loading ? '…' : fmt(equipment?.equipment_type)}
          </span>
          <span className="py-1 px-3 rounded-full text-[11.5px] font-semibold bg-white/10 text-white/75 border border-white/10">
            📍 {loading ? '…' : fmt(equipment?.location)}
          </span>
          <span className="py-1 px-3 rounded-full text-[11.5px] font-semibold bg-white/10 text-white/75 border border-white/10">
            🏭 {loading ? '…' : fmt(equipment?.manufacturer)}
          </span>
          <span className="py-1 px-3 rounded-full text-[11.5px] font-semibold bg-white/10 text-white/75 border border-white/10">
            ⚡ Criticality: {loading ? '…' : fmt(equipment?.criticality)}
          </span>
        </div>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        {/* Health Score */}
        <div className="bg-white border border-[var(--color-border-main)] rounded-[12px] p-5 text-center shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="text-[11px] font-bold tracking-[0.8px] uppercase text-[var(--color-text3)] mb-2">Health Score</div>
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Skeleton w="w-20" h="h-8" />
              <Skeleton w="w-32" h="h-2.5" />
            </div>
          ) : (
            <>
              <div className="text-[32px] font-extrabold tracking-[-1.5px] leading-none" style={{ color: healthCol }}>
                {healthScore != null ? `${healthScore}%` : '—'}
              </div>
              <div className="text-[11.5px] text-[var(--color-text3)] mt-1">{healthStatus ?? 'Unknown status'}</div>
              <div className="mt-3 h-1.5 bg-[var(--color-border-main)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${healthScore ?? 0}%`, backgroundColor: healthCol }}
                />
              </div>
            </>
          )}
        </div>

        {/* Risk */}
        <div className="bg-white border border-[var(--color-border-main)] rounded-[12px] p-5 text-center shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="text-[11px] font-bold tracking-[0.8px] uppercase text-[var(--color-text3)] mb-2">Risk Level</div>
          {loading ? (
            <div className="flex flex-col items-center gap-2"><Skeleton w="w-16" h="h-8" /><Skeleton w="w-28" h="h-2.5" /></div>
          ) : (
            <>
              <div className="text-[20px] font-extrabold tracking-[-0.5px] leading-none text-[var(--color-text-main)] mt-2">
                {fmt(equipment?.criticality)}
              </div>
              <div className="text-[11.5px] text-[var(--color-text3)] mt-1">Use AI panel below for probability</div>
              <div className="mt-2.5"><RiskBadge risk={equipment?.criticality} /></div>
            </>
          )}
        </div>

        {/* RUL */}
        <div className="bg-white border border-[var(--color-border-main)] rounded-[12px] p-5 text-center shadow-sm flex flex-col items-center hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="text-[11px] font-bold tracking-[0.8px] uppercase text-[var(--color-text3)] mb-2">Remaining Useful Life</div>
          <div className="w-20 h-20 rounded-full flex items-center justify-center relative mt-1.5"
            style={{ background: 'conic-gradient(#14B8A6 0% 60%, #E2E8F0 60% 100%)' }}>
            <div className="absolute inset-2 rounded-full bg-white flex flex-col items-center justify-center">
              <div className="text-[10px] text-[var(--color-text3)]">RUN AI</div>
              <div className="text-[8px] text-[var(--color-text3)]">PANEL</div>
            </div>
          </div>
          <div className="text-[11.5px] text-[var(--color-text3)] mt-2">Use AI Predictions panel below</div>
        </div>
      </div>

      {/* Mini stat strip */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          {
            label: 'Last Inspection',
            value: loading ? null : (briefing?.last_inspection ? new Date(briefing.last_inspection).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'),
          },
          { label: 'Open Follow-ups', value: loading ? null : fmt(briefing?.open_followups), danger: briefing?.open_followups > 0 },
          { label: 'Total Incidents', value: loading ? null : fmt(briefing?.total_incidents) },
          { label: 'Work Orders', value: loading ? null : fmt(briefing?.total_work_orders) },
          { label: 'Common Failure', value: loading ? null : fmt(briefing?.common_failure), small: true },
        ].map(({ label, value, danger, small }) => (
          <div key={label} className="bg-white border border-[var(--color-border-main)] rounded-lg py-3.5 px-4 shadow-sm">
            <div className="text-[10.5px] font-bold tracking-[0.5px] uppercase text-[var(--color-text3)] mb-1.5">{label}</div>
            {loading ? (
              <Skeleton w="w-16" h="h-3.5" />
            ) : (
              <div className={`${small ? 'text-[12px]' : 'text-sm'} font-bold ${danger ? 'text-[#EF4444]' : 'text-[var(--color-text-main)]'}`}>
                {value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Incidents / Inspections / Work Orders */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Recent Incidents */}
        <div className="card">
          <div className="card-header"><h2 className="text-sm font-semibold">🚨 Recent Incidents</h2></div>
          <div className="card-body p-3.5 px-4">
            {loading ? <SectionSkeleton /> : incidents.length === 0 ? (
              <div className="text-sm text-[var(--color-text3)] py-4 text-center">No incidents recorded.</div>
            ) : incidents.slice(0, 4).map((inc, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[var(--color-border-main)] last:border-b-0">
                <div className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#EF4444]" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--color-text-main)] truncate">{inc.failure_mode ?? inc.incident_id}</div>
                  <div className="text-xs text-[var(--color-text2)] mt-px truncate">{inc.description ?? inc.root_cause ?? '—'}</div>
                </div>
                <div className="ml-auto text-[11px] text-[var(--color-text3)] shrink-0">
                  {inc.incident_date ? new Date(inc.incident_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inspections */}
        <div className="card">
          <div className="card-header"><h2 className="text-sm font-semibold">📋 Recent Inspections</h2></div>
          <div className="card-body p-3.5 px-4">
            {loading ? <SectionSkeleton /> : inspections.length === 0 ? (
              <div className="text-sm text-[var(--color-text3)] py-4 text-center">No inspections recorded.</div>
            ) : inspections.slice(0, 4).map((ins, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[var(--color-border-main)] last:border-b-0">
                <div className="w-2 h-2 rounded-full mt-1 shrink-0 bg-[#3B82F6]" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--color-text-main)] truncate">
                    {ins.inspection_id ?? `Inspection`} — {ins.finding ?? '—'}
                  </div>
                  <div className="text-xs text-[var(--color-text2)] mt-px truncate">{ins.recommendation ?? '—'}</div>
                </div>
                <div className="ml-auto text-[11px] text-[var(--color-text3)] shrink-0">
                  {ins.inspection_date ? new Date(ins.inspection_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2.5 mt-2">
        <button className="btn btn-primary" onClick={() => navigate(`/app/equipment/${id}/timeline`)}>
          📅 View Failure Timeline
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/app/copilot')}>
          🤖 Ask Copilot
        </button>
        <button
          className={`btn ${showPredictions ? 'btn-primary' : 'btn-outline'} ml-auto`}
          onClick={() => setShowPredictions((v) => !v)}
        >
          🧠 {showPredictions ? 'Hide' : 'Show'} AI Predictions
        </button>
      </div>

      {/* AI Predict Panel (toggle) */}
      {showPredictions && <PredictPanel />}
    </div>
  );
};

export default EquipmentProfile;
