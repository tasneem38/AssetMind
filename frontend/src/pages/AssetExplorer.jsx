import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AssetSearch from '../components/AssetSearch';
import RiskBadge from '../components/RiskBadge';
import { getEquipment, getHighRiskAssets } from '../services/api';

const TYPE_ICONS = {
  'Centrifugal Pump': '⚙',
  'Air Compressor': '🌀',
  'Heat Exchanger': '🔥',
  'Electric Motor': '⚡',
  'Control Valve': '🔧',
  'Cooling Tower Fan': '💨',
  'Feed Water Pump': '💧',
  'Refrigeration Compressor': '❄',
  'Belt Conveyor Motor': '⚙',
};


const SkeletonCard = () => (
  <div className="bg-white border border-[var(--color-border-main)] rounded-[12px] p-5 animate-pulse">
    <div className="h-3 bg-[var(--color-surface2)] rounded w-1/2 mb-3" />
    <div className="h-4 bg-[var(--color-surface2)] rounded w-3/4 mb-4" />
    <div className="h-3 bg-[var(--color-surface2)] rounded w-1/3 mb-2" />
    <div className="h-3 bg-[var(--color-surface2)] rounded w-2/3 mb-2" />
    <div className="h-3 bg-[var(--color-surface2)] rounded w-1/2" />
  </div>
);

const AssetExplorer = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, riskData] = await Promise.all([getEquipment(), getHighRiskAssets()]);
        // Build a quick lookup map: equipment_id -> risk_level
        const riskMap = {};
        for (const r of riskData) {
          riskMap[r.equipment_id] = r.risk_level;
        }
        setAssets(data.map((a) => ({ ...a, _risk_level: riskMap[a.equipment_id] ?? 'Low' })));
      } catch (err) {
        console.error('AssetExplorer fetch error:', err);
        setError('Could not load equipment. Make sure the API server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  // Normalise backend field names to what the card expects
  const normalised = assets.map((a) => ({
    id: a.equipment_id,
    type: a.equipment_type,
    location: a.location,
    mfg: a.manufacturer,
    criticality: a.criticality,
    // Use real computed risk level from the analytics endpoint
    risk: a._risk_level,
  }));

  const filteredAssets = normalised.filter(
    (a) =>
      a.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[var(--color-text-main)] tracking-[-0.4px]">Asset Explorer</h1>
        <p className="text-[13.5px] text-[var(--color-text2)] mt-1">
          Browse and search the monitored equipment fleet
          {!loading && !error && (
            <span className="ml-2 text-[var(--color-primary)] font-semibold">· {assets.length} assets</span>
          )}
        </p>
      </div>

      {error && (
        <div className="mb-5 py-3 px-4 rounded-lg bg-[#EF4444]/8 border border-[#EF4444]/25 text-sm text-[#EF4444] font-medium flex items-center gap-2">
          ⚠ {error}
        </div>
      )}

      <AssetSearch onSearch={setSearchTerm} />

      <div className="grid grid-cols-3 gap-4">
        {loading
          ? [...Array(9)].map((_, i) => <SkeletonCard key={i} />)
          : filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white border border-[var(--color-border-main)] rounded-[12px] p-5 cursor-pointer transition-all duration-150 hover:-translate-y-[3px] hover:shadow-[0_10px_40px_rgba(0,0,0,0.12)] hover:border-[var(--color-primary-light)] relative overflow-hidden"
                onClick={() => navigate(`/app/equipment/${asset.id}`)}
              >
                <div className="absolute top-4 right-4 text-[22px] opacity-15">{TYPE_ICONS[asset.type] || '⚙'}</div>
                <div className="font-mono text-[13px] font-bold text-[var(--color-primary)] mb-1">{asset.id}</div>
                <div className="text-sm font-semibold text-[var(--color-text-main)] mb-2.5">{asset.type}</div>
                <div className="mt-2 mb-3 flex items-center gap-2">
                  <RiskBadge risk={asset.risk} />
                </div>
                <div className="text-xs text-[var(--color-text2)] leading-[1.8]">
                  <span className="text-[var(--color-text3)]">Location:</span> {asset.location}<br/>
                  <span className="text-[var(--color-text3)]">Manufacturer:</span> {asset.mfg}<br/>
                  <span className="text-[var(--color-text3)]">Criticality:</span> {asset.criticality}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default AssetExplorer;
