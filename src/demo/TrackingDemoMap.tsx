import { House, Store } from "lucide-react";
import { trackingDemoMap, type TrackingMapIllustration } from "./demoMapIllustration";

export function TrackingDemoMap({ map = trackingDemoMap }: { map?: TrackingMapIllustration }) {
  const points = map.route.map(([x, y]) => `${x * 10},${y * 10}`).join(" ");
  return <div className="tracking-map-illustration" aria-hidden="true">
    <svg className="tracking-map-streets" viewBox="0 0 1000 1000" preserveAspectRatio="none">
      <rect width="1000" height="1000" fill="#EDECE6" />
      <path d="M0 730 Q140 680 180 790 T390 1000 H0Z M870 0H1000V330Q840 260 870 0Z" fill="#DAE4D6" />
      <path d="M0 70 Q180 130 240 0 M820 1000 Q760 830 1000 740" fill="none" stroke="#CFDEE0" strokeWidth="65" />
      <g fill="#E0DDD4" stroke="#D5D1C7" strokeWidth="1">
        <rect x="90" y="180" width="170" height="170" rx="12" /><rect x="325" y="185" width="80" height="165" rx="10" />
        <rect x="500" y="180" width="140" height="170" rx="12" /><rect x="740" y="190" width="150" height="160" rx="12" />
        <rect x="90" y="445" width="165" height="145" rx="12" /><rect x="335" y="445" width="65" height="145" rx="10" />
        <rect x="500" y="450" width="140" height="140" rx="12" /><rect x="740" y="450" width="150" height="140" rx="12" />
        <rect x="340" y="700" width="65" height="170" rx="10" /><rect x="500" y="700" width="140" height="170" rx="12" />
        <rect x="740" y="700" width="150" height="130" rx="12" />
      </g>
      <g fill="none" stroke="#FFFFFF" strokeWidth="15" vectorEffect="non-scaling-stroke">
        <path d="M-20 140H1020 M-20 400H1020 M-20 640H1020 M280 920H1020" vectorEffect="non-scaling-stroke" />
        <path d="M300 0V1000 M450 0V1000 M690 0V1000 M940 0V1000 M45 150V700" vectorEffect="non-scaling-stroke" />
      </g>
      <polyline className="tracking-map-route" points={points} fill="none" stroke="#79513B" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
    <span className="tracking-map-marker tracking-map-restaurant" style={{ left: `${map.restaurant.x}%`, top: `${map.restaurant.y}%` }}>
      <span className="tracking-marker-symbol"><Store size={26} /></span><span className="tracking-marker-label">Restaurang (demo)</span>
    </span>
    <span className="tracking-map-marker tracking-map-customer" style={{ left: `${map.customer.x}%`, top: `${map.customer.y}%` }}>
      <span className="tracking-marker-symbol"><House size={18} /></span><span className="tracking-marker-label">Kund (demo)</span>
    </span>
  </div>;
}
