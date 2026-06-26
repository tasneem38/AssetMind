import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <nav className="w-[240px] min-h-screen bg-[#0D1B2A] flex flex-col fixed left-0 top-0 bottom-0 z-[100] border-r border-white/5">
      <div className="flex items-center gap-2.5 p-5 pb-4 border-b border-white/5">
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center shadow-[0_0_16px_rgba(20,184,166,0.4)]">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeLinecap="round"/>
            <circle cx="10" cy="10" r="4.5" stroke="white" strokeWidth="1.5"/>
            <circle cx="10" cy="10" r="1.5" fill="white"/>
            <circle cx="10" cy="6.5" r="0.8" fill="rgba(255,255,255,0.7)"/>
            <circle cx="13.5" cy="10" r="0.8" fill="rgba(255,255,255,0.7)"/>
            <circle cx="10" cy="13.5" r="0.8" fill="rgba(255,255,255,0.7)"/>
            <circle cx="6.5" cy="10" r="0.8" fill="rgba(255,255,255,0.7)"/>
          </svg>
        </div>
        <div className="leading-none">
          <div className="text-base font-extrabold text-white tracking-tight">AssetMind</div>
          <div className="text-[9px] font-medium text-[#64748B] tracking-[0.8px] uppercase mt-px">Industrial Intelligence</div>
        </div>
      </div>

      <div className="text-[9px] font-bold tracking-[1.2px] uppercase text-[#334155] px-5 pt-5 pb-1.5">Platform</div>
      <NavLink to="/app" end className={({ isActive }) => `flex items-center gap-2.5 py-[9px] px-4 ml-5 mr-2 my-[1px] rounded-lg text-[13.5px] font-medium cursor-pointer transition-colors relative ${isActive ? 'bg-[#0F766E]/20 text-[#14B8A6] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-[#14B8A6] before:-ml-2' : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#CBD5E1]'}`}>
        <span className="text-[15px] w-[18px] text-center">⬡</span> Dashboard
      </NavLink>
      <NavLink to="/app/assets" className={({ isActive }) => `flex items-center gap-2.5 py-[9px] px-4 ml-5 mr-2 my-[1px] rounded-lg text-[13.5px] font-medium cursor-pointer transition-colors relative ${isActive ? 'bg-[#0F766E]/20 text-[#14B8A6] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-[#14B8A6] before:-ml-2' : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#CBD5E1]'}`}>
        <span className="text-[15px] w-[18px] text-center">◈</span> Asset Explorer
      </NavLink>
      <NavLink to="/app/timeline" className={({ isActive }) => `flex items-center gap-2.5 py-[9px] px-4 ml-5 mr-2 my-[1px] rounded-lg text-[13.5px] font-medium cursor-pointer transition-colors relative ${isActive ? 'bg-[#0F766E]/20 text-[#14B8A6] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-[#14B8A6] before:-ml-2' : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#CBD5E1]'}`}>
        <span className="text-[15px] w-[18px] text-center">◎</span> Timeline
      </NavLink>
      <NavLink to="/app/copilot" className={({ isActive }) => `flex items-center gap-2.5 py-[9px] px-4 ml-5 mr-2 my-[1px] rounded-lg text-[13.5px] font-medium cursor-pointer transition-colors relative ${isActive ? 'bg-[#0F766E]/20 text-[#14B8A6] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-[#14B8A6] before:-ml-2' : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#CBD5E1]'}`}>
        <span className="text-[15px] w-[18px] text-center">◇</span> Copilot
      </NavLink>

      <div className="text-[9px] font-bold tracking-[1.2px] uppercase text-[#334155] px-5 pt-5 pb-1.5">Intelligence</div>
      <NavLink to="/app/insights" className={({ isActive }) => `flex items-center gap-2.5 py-[9px] px-4 ml-5 mr-2 my-[1px] rounded-lg text-[13.5px] font-medium cursor-pointer transition-colors relative ${isActive ? 'bg-[#0F766E]/20 text-[#14B8A6] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-[#14B8A6] before:-ml-2' : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#CBD5E1]'}`}>
        <span className="text-[15px] w-[18px] text-center">△</span> Insights
      </NavLink>

      <div className="mt-auto px-5 py-4 border-t border-white/5">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg py-2.5 px-3">
          <div className="w-[7px] h-[7px] rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]"></div>
          <div className="text-[11.5px] text-[#64748B]">
            <strong className="text-[#94A3B8] font-semibold">AI Engine</strong> · Active<br/>
            <span className="text-[10px]">25 assets monitored</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
