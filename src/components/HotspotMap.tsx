import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = { lat: number; lng: number; label: string; count: number };

export default function HotspotMap({ points }: { points: MapPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const center: [number, number] = points.length ? [points[0]!.lat, points[0]!.lng] : [10.0, 76.3];
    const map = L.map(ref.current).setView(center, 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "┬⌐ OpenStreetMap" }).addTo(map);
    const max = Math.max(1, ...points.map((p) => p.count));
    points.forEach((p) => {
      L.circleMarker([p.lat, p.lng], {
        radius: 6 + (p.count / max) * 24,
        color: "#c0392b",
        fillColor: "#e74c3c",
        fillOpacity: 0.35 + (p.count / max) * 0.4,
        weight: 1,
      })
        .bindPopup(`<b>${p.label}</b><br/>${p.count} challan(s)`)
        .addTo(map);
    });
    if (points.length > 1) map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [30, 30] });
    return () => { map.remove(); };
  }, [points]);
  return <div ref={ref} className="h-[520px] w-full rounded-lg border" />;
}
