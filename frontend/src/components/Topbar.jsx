import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageName = () => {
    const path = location.pathname;
    if (path === '/app' || path === '/app/') return 'Dashboard';
    if (path.startsWith('/app/assets')) return 'Asset Explorer';
    if (path.startsWith('/app/equipment')) return 'Equipment Profile';
    if (path.startsWith('/app/copilot')) return 'Copilot';
    if (path.startsWith('/app/insights')) return 'Insights';
    if (path.startsWith('/app/timeline')) return 'Timeline';
    return 'Platform';
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/app/assets?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/login');
  };

  return (
    <div className="h-[60px] bg-white border-b border-[var(--color-border-main)] flex items-center px-7 gap-4 sticky top-0 z-50">
      <div className="flex items-center gap-1.5 text-[13px] text-[var(--color-text2)]">
        <span>AssetMind</span>
        <span className="text-[var(--color-text3)]">›</span>
        <span className="text-[var(--color-text-main)] font-semibold">{getPageName()}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="🔍  Quick search..."
          className="bg-[var(--color-bg)] border border-[var(--color-border-main)] rounded-lg py-[7px] px-3 w-[220px] text-[13px] text-[var(--color-text2)] outline-none focus:border-[var(--color-primary)] transition-colors"
        />
        <div className="bg-[#0F766E]/10 border border-[#0F766E]/25 rounded-full py-1 px-3 text-[11.5px] font-semibold text-[var(--color-primary)] tracking-[0.3px]">
          🛡 AI Risk Active
        </div>
        <div className="relative">
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-[11px] font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowUserMenu((v) => !v)}
            title="Account"
          >
            TAS
          </div>
          {showUserMenu && (
            <div className="absolute right-0 top-10 w-[160px] bg-white border border-[var(--color-border-main)] rounded-xl shadow-lg py-1 z-50">
              <div className="px-4 py-2 text-[12px] text-[var(--color-text2)] border-b border-[var(--color-border-main)]">
                demo@assetmind.com
              </div>
              <button
                className="w-full text-left px-4 py-2 text-[13px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
