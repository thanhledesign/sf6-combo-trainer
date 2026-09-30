// Range/reach indicator pill for MoveCards. Maps the annotation
// `yourPerspective.range` string into a 5-tier color gradient from
// red (close) to teal (full-screen). Indicates SPACING DISTANCE,
// not move quality — players interpret based on their use case.

const TIERS = {
  close:        { label: 'Close',       color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)' },
  short:        { label: 'Close',       color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)' },
  mid:          { label: 'Mid',         color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  medium:       { label: 'Mid',         color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  long:         { label: 'Long',        color: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)' },
  'very-long':  { label: 'Very long',   color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  'full-screen':{ label: 'Full screen', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  fullscreen:   { label: 'Full screen', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
};

const RangeBadge = ({ range, compact = false }) => {
  if (!range) return null;
  const tier = TIERS[range.toLowerCase()];
  if (!tier) return null;
  const sizeCls = compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeCls}`}
      style={{ color: tier.color, backgroundColor: tier.bg, border: `1px solid ${tier.color}40` }}
      title={`Range: ${tier.label}`}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tier.color }} />
      {tier.label}
    </span>
  );
};

export default RangeBadge;
