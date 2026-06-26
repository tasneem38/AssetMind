import { useLocation } from 'react-router-dom';

const Topbar = () => {
  const location = useLocation();
  
  const getPageName = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname.startsWith('/assets')) return 'Asset Explorer';
    if (location.pathname.startsWith('/equipment')) return 'Equipment Profile';
    if (location.pathname.startsWith('/copilot')) return 'Copilot';
    if (location.pathname.startsWith('/insights')) return 'Insights';
    return 'Platform';
  };

  return (
    <div className="h-[60px] bg-white border-b border-[var(--color-border-main)] flex items-center px-7 gap-4 sticky top-0 z-50">
      <div className="flex items-center gap-1.5 text-[13px] text-[var(--color-text2)]">
        <span>AssetMind</span>
        <span className="text-[var(--color-text3)]">›</span>
        <span className="text-[var(--color-text-main)] font-semibold">{getPageName()}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[var(--color-bg)] border border-[var(--color-border-main)] rounded-lg py-[7px] px-3 w-[220px] text-[13px] text-[var(--color-text2)] cursor-text">
          <span>🔍</span> Quick search...
        </div>
        <div className="bg-[#0F766E]/10 border border-[#0F766E]/25 rounded-full py-1 px-3 text-[11.5px] font-semibold text-[var(--color-primary)] tracking-[0.3px]">
          🛡 AI Risk Active
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-[11px] font-bold text-white cursor-pointer">
          TAS
        </div>
      </div>
    </div>
  );
};

export default Topbar;
