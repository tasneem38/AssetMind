const StatsCard = ({ title, value, icon, trend, colorClass }) => {
  const colorMap = {
    teal: 'before:bg-gradient-to-r before:from-[#0F766E] before:to-[#14B8A6]',
    amber: 'before:bg-gradient-to-r before:from-[#F59E0B] before:to-[#FCD34D]',
    red: 'before:bg-gradient-to-r before:from-[#EF4444] before:to-[#F87171]',
    green: 'before:bg-gradient-to-r before:from-[#22C55E] before:to-[#4ADE80]'
  };

  const iconBgMap = {
    teal: 'bg-[#0F766E]/10',
    amber: 'bg-[#F59E0B]/10',
    red: 'bg-[#EF4444]/10',
    green: 'bg-[#22C55E]/10'
  };

  const isUp = trend.startsWith('↑');
  const trendColor = isUp ? (colorClass === 'green' || colorClass === 'teal' ? 'text-[#22C55E]' : 'text-[#EF4444]') : 'text-[#22C55E]';

  return (
    <div className={`stat-card ${colorMap[colorClass]}`}>
      <div className={`absolute top-4 right-4 w-9 h-9 rounded-[9px] flex items-center justify-center text-base ${iconBgMap[colorClass]}`}>
        {icon}
      </div>
      <div className="text-[11.5px] font-semibold text-[var(--color-text3)] tracking-[0.5px] uppercase mb-2.5">{title}</div>
      <div className="text-[28px] font-extrabold text-[var(--color-text-main)] tracking-[-1px] leading-none">{value}</div>
      <div className="text-xs text-[var(--color-text3)] mt-1.5 flex items-center gap-1">
        <span className={trendColor}>{trend.charAt(0)}</span> {trend.slice(1)}
      </div>
    </div>
  );
};

export default StatsCard;
