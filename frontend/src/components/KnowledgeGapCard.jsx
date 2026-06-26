import { useNavigate } from 'react-router-dom';
import RiskBadge from './RiskBadge';

const KnowledgeGapCard = ({ asset, finding, recommendation, risk }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="border border-[#EF4444]/20 rounded-lg py-3.5 px-4 bg-[#EF4444]/5 mb-2.5 transition-all duration-150 cursor-pointer hover:border-[#EF4444]/40 hover:bg-[#EF4444]/10 last:mb-0"
      onClick={() => navigate(`/app/equipment/${asset}`)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[12.5px] font-bold text-[var(--color-primary)]">{asset}</span>
        <RiskBadge risk={risk} />
      </div>
      <div className="text-[11.5px] text-[var(--color-text2)]">{finding}</div>
      <div><span className="tag mt-1.5">Rec: {recommendation}</span></div>
      <div className="text-xs text-[#DC2626] italic mt-1.5">⚑ Preventable failure pattern detected.</div>
    </div>
  );
};

export default KnowledgeGapCard;
