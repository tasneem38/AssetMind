const RiskBadge = ({ risk }) => {
  const styles = {
    Low: 'bg-[#22C55E]/10 text-[#16A34A] before:bg-[#22C55E]',
    Medium: 'bg-[#F59E0B]/10 text-[#B45309] before:bg-[#F59E0B]',
    High: 'bg-[#EF4444]/10 text-[#DC2626] before:bg-[#EF4444]',
    Critical: 'bg-[#B91C1C]/10 text-[#B91C1C] before:bg-[#B91C1C] before:shadow-[0_0_6px_#B91C1C88] animate-pulse-ring'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 py-[3px] px-2.5 rounded-full text-[11.5px] font-bold tracking-[0.3px] before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full ${styles[risk]}`}>
      {risk}
    </span>
  );
};

export default RiskBadge;
