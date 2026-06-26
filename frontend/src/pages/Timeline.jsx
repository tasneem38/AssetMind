import { useNavigate, useParams } from 'react-router-dom';
import TimelineView from '../components/TimelineView';

const Timeline = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id || 'PMP-CW-101';

  const timelineEvents = [
    {
      type: 'Inspection',
      date: 'JAN 2025',
      title: 'Inspection Report — IR-014',
      description: 'Routine quarterly check. All parameters within normal range. Bearing temperature: 52°C (nominal). Vibration: 6mm/s.',
      badge: '✓ Cleared',
      badgeClass: 'bg-[#22C55E]/10 text-[#16A34A]',
    },
    {
      type: 'Inspection',
      date: 'MAR 2025',
      title: 'Vibration Inspection — IR-018',
      description: 'Elevated vibration detected: 14mm/s RMS. Threshold is 10mm/s. Possible early-stage bearing fatigue. Immediate action recommended.',
    },
    {
      type: 'Recommendation',
      date: 'MAR 2025',
      title: '⚡ Recommendation Raised',
      description: 'Bearing assembly replacement recommended. Estimated cost: ₹42,000. Suggested window: within 30 days to prevent failure.',
      badge: '✗ Not Actioned',
      badgeClass: 'bg-[#EF4444]/10 text-[#DC2626]',
      style: { borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.02)' }
    },
    {
      type: 'NoAction',
      date: 'APR — JUN 2025',
      title: '⛔ No Action Taken',
      description: '3-month window elapsed. Recommendation was not escalated. Bearing degradation continued unmonitored.',
      badge: 'Knowledge Gap',
      badgeClass: 'bg-[#EF4444]/10 text-[#DC2626]',
      style: { borderStyle: 'dashed', borderColor: 'rgba(239,68,68,0.3)' }
    },
    {
      type: 'Inspection',
      date: 'JUN 2025',
      title: 'Full Mechanical Inspection — IR-021',
      description: 'Bearing wear confirmed. Inner race spalling visible. Vibration at 22mm/s. Immediate shutdown risk if not addressed.',
      badge: '⚠ Critical Warning Issued',
      badgeClass: 'bg-[#EF4444]/10 text-[#DC2626]'
    },
    {
      type: 'Incident',
      date: 'JUL 24, 2025',
      title: '🚨 Bearing Failure — INC-2025-041',
      description: 'Catastrophic bearing seizure. Shaft locked at 02:14 hrs. 3-hour production outage. Cooling tower offline. Estimated loss: ₹3.8 lakh.',
      badge: '✗ Preventable',
      badgeClass: 'bg-[#EF4444]/10 text-[#DC2626]',
      customClass: 'border-[#EF4444]/30 bg-[#EF4444]/5 hover:border-[#EF4444]/50'
    },
    {
      type: 'WorkOrder',
      date: 'JUL 25, 2025',
      title: 'Emergency Work Order — WO-2025-0089',
      description: 'Full bearing assembly replacement. Shaft realignment. Total cost: ₹1.24 lakh (3× original estimate). Downtime: 18 hours.',
      badge: '✓ Completed',
      badgeClass: 'bg-[#22C55E]/10 text-[#16A34A]'
    },
    {
      type: 'Repair',
      date: 'AUG 2025',
      title: 'Post-Repair Inspection',
      description: 'Vibration normalized to 5.8mm/s. Bearing temp: 49°C. Unit returned to service. New 3-month inspection schedule set.',
      badge: '✓ Unit Operational',
      badgeClass: 'bg-[#22C55E]/10 text-[#16A34A]'
    }
  ];

  return (
    <div>
      <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-text2)] cursor-pointer mb-4 py-1.5 px-3 rounded-lg border border-[var(--color-border-main)] bg-white transition-all hover:text-[var(--color-primary)] hover:border-[var(--color-primary-light)]" onClick={() => navigate(`/app/equipment/${id}`)}>
        ← Back to Equipment
      </div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[var(--color-text-main)] tracking-[-0.4px]">Failure Timeline</h1>
        <p className="text-[13.5px] text-[var(--color-text2)] mt-1">{id} — Cooling Water Pump Unit 1</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-main)]">Event Sequence</h2>
              <div className="text-xs text-[var(--color-text3)] mt-px">Chronological maintenance & incident history</div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[11px] text-[#3B82F6] font-semibold">● Inspection</span>
              <span className="text-[11px] text-[#F59E0B] font-semibold">● Rec</span>
              <span className="text-[11px] text-[#EF4444] font-semibold">● Incident</span>
              <span className="text-[11px] text-[#8B5CF6] font-semibold">● WO</span>
            </div>
          </div>
          <div className="card-body">
            <TimelineView events={timelineEvents} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-[var(--color-text-main)]">💰 Failure Cost Analysis</h2>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <div className="text-[11px] font-bold text-[var(--color-text3)] uppercase tracking-[0.5px] mb-2">Cost Breakdown</div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-center py-2 px-3 bg-[#EF4444]/5 rounded-lg border border-[#EF4444]/10">
                    <span className="text-[12.5px] text-[var(--color-text2)]">Reactive Repair Cost</span>
                    <span className="text-sm font-extrabold text-[#EF4444]">₹1,24,000</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-[#EF4444]/5 rounded-lg border border-[#EF4444]/10">
                    <span className="text-[12.5px] text-[var(--color-text2)]">Production Loss</span>
                    <span className="text-sm font-extrabold text-[#EF4444]">₹3,80,000</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-[#22C55E]/5 rounded-lg border border-[#22C55E]/10">
                    <span className="text-[12.5px] text-[var(--color-text2)]">If actioned in March</span>
                    <span className="text-sm font-extrabold text-[#22C55E]">₹42,000</span>
                  </div>
                </div>
              </div>
              <div className="py-2.5 px-3 bg-[#B91C1C]/5 rounded-lg border border-[#B91C1C]/15">
                <div className="text-[11px] font-bold text-[#B91C1C] uppercase mb-1">Preventable Loss</div>
                <div className="text-[22px] font-black text-[#B91C1C]">₹4,62,000</div>
                <div className="text-[11.5px] text-[#DC2626] mt-0.5">11× cost of preventive action</div>
              </div>
            </div>
          </div>

          <div className="card border-[#14B8A6]/30 shadow-[0_4px_16px_rgba(20,184,166,0.1)]">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-[var(--color-text-main)]">🧠 AI Pattern Analysis</h2>
            </div>
            <div className="card-body flex flex-col gap-3">
              <div className="py-2.5 px-3 bg-[var(--color-surface2)] rounded-lg border border-[var(--color-border-main)]">
                <div className="text-[11px] font-bold text-[var(--color-text3)] uppercase mb-1">Root Cause</div>
                <div className="text-[13px] font-semibold text-[var(--color-text-main)]">Inspection-Action Gap</div>
                <div className="text-xs text-[var(--color-text2)] mt-1">Warning issued 4 months before failure. No action taken within recommendation window.</div>
              </div>
              <div className="py-2.5 px-3 bg-[var(--color-surface2)] rounded-lg border border-[var(--color-border-main)]">
                <div className="text-[11px] font-bold text-[var(--color-text3)] uppercase mb-1">Similar Pattern Found In</div>
                <div className="text-[13px] font-semibold font-mono text-[var(--color-text-main)]">HEX-ST-301, CMP-AIR-201</div>
              </div>
              <div className="py-2.5 px-3 bg-[#0F766E]/5 rounded-lg border border-[#0F766E]/20">
                <div className="text-[11px] font-bold text-[var(--color-primary)] uppercase mb-1">Recommendation</div>
                <div className="text-[12.5px] text-[var(--color-text2)]">Implement escalation trigger: if recommendation not actioned in 14 days, auto-create P1 work order.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
