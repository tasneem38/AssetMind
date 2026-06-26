const TimelineView = ({ events }) => {
  const iconMap = {
    Inspection: { icon: '🔍', color: 'bg-[#EFF6FF] text-[#3B82F6] shadow-[0_0_0_1px_#BFDBFE]' },
    Recommendation: { icon: '💡', color: 'bg-[#FFFBEB] text-[#F59E0B] shadow-[0_0_0_1px_#FDE68A]' },
    WorkOrder: { icon: '📋', color: 'bg-[#F5F3FF] text-[#8B5CF6] shadow-[0_0_0_1px_#DDD6FE]' },
    Repair: { icon: '🔧', color: 'bg-[#F0FDF4] text-[#22C55E] shadow-[0_0_0_1px_#BBF7D0]' },
    Incident: { icon: '💥', color: 'bg-[#FEF2F2] text-[#EF4444] shadow-[0_0_0_1px_#FECACA]' },
    NoAction: { icon: '⏸', color: 'bg-[#F8FAFC] text-[#94A3B8] shadow-[0_0_0_1px_#E2E8F0]' }
  };

  return (
    <div className="relative py-2.5">
      <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-[var(--color-border-main)]"></div>
      
      {events.map((event, index) => (
        <div key={index} className="flex gap-5 mb-6 relative items-start">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 z-10 border-2 border-white ${iconMap[event.type].color}`}>
            {iconMap[event.type].icon}
          </div>
          <div 
            className={`bg-white border rounded-lg py-3.5 px-4 flex-1 shadow-sm transition-all duration-150 hover:shadow-md ${event.customClass || ''}`}
            style={event.style || {}}
          >
            <div className="text-[11px] font-bold text-[var(--color-text3)] tracking-[0.5px] uppercase mb-1">{event.date}</div>
            <div className="text-[13px] font-bold text-[var(--color-text-main)] mb-1">{event.title}</div>
            <div className="text-[12.5px] text-[var(--color-text2)] leading-relaxed">{event.description}</div>
            {event.badge && (
              <span className={`inline-block mt-2 py-0.5 px-2 rounded text-[11px] font-semibold ${event.badgeClass || ''}`}>
                {event.badge}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineView;
