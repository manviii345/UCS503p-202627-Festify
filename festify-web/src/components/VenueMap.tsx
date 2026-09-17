import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VenueZoneData {
  id: number;
  name: string;
  type: 'zone' | 'landmark';
  category: string;
  coordinates: number[][] | [number, number];
  color: string;
  description?: string;
  icon?: string;
}

interface VenueMapProps {
  festId: number;
  readOnly?: boolean;
}

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'all', label: 'All', emoji: '🗺️' },
  { key: 'stage', label: 'Stages', emoji: '🎭' },
  { key: 'food', label: 'Food', emoji: '🍕' },
  { key: 'gate', label: 'Gates', emoji: '🚪' },
  { key: 'parking', label: 'Parking', emoji: '🅿️' },
  { key: 'restroom', label: 'Restrooms', emoji: '🚻' },
  { key: 'registration', label: 'Registration', emoji: '📋' },
  { key: 'firstaid', label: 'First Aid', emoji: '🏥' },
  { key: 'other', label: 'Info', emoji: 'ℹ️' },
];

// SVG canvas dimensions (must match seed coordinate space)
const MAP_W = 1000;
const MAP_H = 700;

// ─── Component ───────────────────────────────────────────────────────────────

export default function VenueMap({ festId, readOnly = false }: VenueMapProps) {
  const [zones, setZones] = useState<VenueZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedZone, setSelectedZone] = useState<VenueZoneData | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [locateResult, setLocateResult] = useState<VenueZoneData | null | 'none'>('none');
  const [locating, setLocating] = useState(false);

  // Pan & zoom state
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; tx: number; ty: number }>({
    active: false, startX: 0, startY: 0, tx: 0, ty: 0,
  });

  // ── Fetch zones ────────────────────────────────────────────────────────────
  // FIX SITE COMMENT (PART 1):
  // Root cause of blank map: Initially the VenueZone table had 0 seeded rows for festId=1,
  // returning { festId: 1, zones: [] }. Additionally, coordinates are stored as a stringified
  // JSON array in SQLite and must be parsed back to numeric arrays for rendering in SVG 1000x700 viewBox.
  useEffect(() => {
    const targetFestId = festId || 1;
    setLoading(true);
    fetch(`/api/fests/${targetFestId}/venue`)
      .then((r) => r.json())
      .then((data) => {
        console.log('Venue map fetch response:', data);
        setZones(data.zones || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load venue map. Please refresh.');
        setLoading(false);
      });
  }, [festId]);

  // ── Pan handlers ───────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('[data-zone]')) return;
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.active) return;
    setTransform((t) => ({
      ...t,
      x: dragRef.current.tx + (e.clientX - dragRef.current.startX),
      y: dragRef.current.ty + (e.clientY - dragRef.current.startY),
    }));
  }, []);

  const handleMouseUp = useCallback(() => { dragRef.current.active = false; }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform((t) => {
      const newScale = Math.min(4, Math.max(0.4, t.scale * factor));
      return { ...t, scale: newScale };
    });
  }, []);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  // ── Locate demo ────────────────────────────────────────────────────────────
  const handleLocate = async () => {
    setLocating(true);
    const targetFestId = festId || 1;
    const demoPoint = { x: 200, y: 420 };
    try {
      const res = await fetch(`/api/fests/${targetFestId}/venue/locate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoPoint),
      });
      const data = await res.json();
      if (data.zone) {
        setLocateResult(data.zone);
        setSelectedZone(data.zone);
      } else {
        setLocateResult(null);
      }
    } catch {
      setLocateResult(null);
    } finally {
      setLocating(false);
    }
  };

  // ── Filtered zones ─────────────────────────────────────────────────────────
  const visible = zones.filter((z) => activeCategory === 'all' || z.category === activeCategory);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const polygonPoints = (coords: number[][]) => coords.map(([x, y]) => `${x},${y}`).join(' ');

  const centroid = (coords: number[][]): [number, number] => {
    const cx = coords.reduce((s, [x]) => s + x, 0) / coords.length;
    const cy = coords.reduce((s, [, y]) => s + y, 0) / coords.length;
    return [cx, cy];
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono text-[#F06E38] font-bold uppercase tracking-wider">
            Interactive Campus Map
          </span>
          <h2 className="text-xl font-black text-[#1A1A1A]">Aurora Fest 2026 — Venue Map</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLocate}
            disabled={locating}
            className="px-4 py-2 bg-[#6366F1] text-white font-bold text-xs rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#4F46E5] transition-colors disabled:opacity-60"
            id="venue-locate-btn"
          >
            {locating ? '🔍 Locating...' : '📍 Locate Demo'}
          </button>
          <button
            onClick={resetView}
            className="px-4 py-2 bg-[#EFE8D8] text-[#1A1A1A] font-bold text-xs rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#F4C430] transition-colors"
            id="venue-reset-view-btn"
          >
            ↺ Reset View
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Category filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            id={`venue-filter-${cat.key}`}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-[#1A1A1A] transition-all ${
              activeCategory === cat.key
                ? 'bg-[#1E1E1E] text-white shadow-[2px_2px_0px_#EC6484]'
                : 'bg-[#EFE8D8] text-[#1A1A1A] hover:bg-[#F4C430]'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Main content: Map + Detail Panel */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">

        {/* SVG Map container */}
        <div
          className="flex-1 dashboard-card overflow-hidden relative cursor-grab active:cursor-grabbing select-none h-[520px] min-h-[480px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-[#F06E38] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-[#1A1A1A]/60">Loading venue map…</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xs font-bold text-red-500">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              preserveAspectRatio="none"
              className="w-full h-full absolute inset-0"
              style={{ display: 'block' }}
              id="venue-svg-map"
            >
              <defs>
                {/* Subtle grid pattern */}
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1A1A1A" strokeWidth="0.3" opacity="0.15" />
                </pattern>
                {/* Drop shadow filter */}
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="3" dy="3" stdDeviation="3" floodColor="#1A1A1A" floodOpacity="0.25" />
                </filter>
                <filter id="shadowHover" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="5" dy="5" stdDeviation="5" floodColor="#1A1A1A" floodOpacity="0.4" />
                </filter>
              </defs>

              <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
                {/* Campus background */}
                <rect x="0" y="0" width={MAP_W} height={MAP_H} rx="12" fill="#EFE8D8" />
                <rect x="0" y="0" width={MAP_W} height={MAP_H} rx="12" fill="url(#grid)" />
                {/* Campus boundary */}
                <rect x="2" y="2" width={MAP_W - 4} height={MAP_H - 4} rx="10"
                  fill="none" stroke="#1A1A1A" strokeWidth="3" opacity="0.5" />

                {/* Perimeter walkway */}
                <rect x="30" y="30" width={MAP_W - 60} height={MAP_H - 60} rx="8"
                  fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="8 6" opacity="0.2" />

                {/* Internal path / road */}
                <path d="M 500 10 L 500 690" stroke="#1A1A1A" strokeWidth="2" strokeDasharray="12 8" opacity="0.12" />
                <path d="M 10 340 L 990 340" stroke="#1A1A1A" strokeWidth="2" strokeDasharray="12 8" opacity="0.12" />

                {/* ── Render polygon zones ── */}
                {visible
                  .filter((z) => z.type === 'zone')
                  .map((z) => {
                    const pts = polygonPoints(z.coordinates as number[][]);
                    const isSelected = selectedZone?.id === z.id;
                    const isHovered = hoveredId === z.id;
                    const [cx, cy] = centroid(z.coordinates as number[][]);

                    return (
                      <g key={z.id} data-zone={z.id}>
                        <polygon
                          points={pts}
                          fill={z.color}
                          fillOpacity={isSelected ? 0.85 : isHovered ? 0.75 : 0.6}
                          stroke="#1A1A1A"
                          strokeWidth={isSelected ? 3 : 2}
                          filter={isSelected || isHovered ? 'url(#shadowHover)' : 'url(#shadow)'}
                          style={{ cursor: 'pointer', transition: 'fill-opacity 0.2s, stroke-width 0.15s' }}
                          onClick={() => setSelectedZone(isSelected ? null : z)}
                          onMouseEnter={() => setHoveredId(z.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          id={`venue-zone-${z.id}`}
                        />
                        {/* Zone label */}
                        <text
                          x={cx}
                          y={cy - 8}
                          textAnchor="middle"
                          fontSize={isSelected ? 13 : 11}
                          fontWeight="bold"
                          fontFamily="Fredoka, sans-serif"
                          fill="#1A1A1A"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {z.icon} {z.name.length > 18 ? z.name.slice(0, 17) + '…' : z.name}
                        </text>
                        {isSelected && (
                          <text
                            x={cx}
                            y={cy + 10}
                            textAnchor="middle"
                            fontSize={9}
                            fill="#1A1A1A"
                            opacity={0.7}
                            fontFamily="Fredoka, sans-serif"
                            style={{ pointerEvents: 'none' }}
                          >
                            {z.category.toUpperCase()}
                          </text>
                        )}
                      </g>
                    );
                  })}

                {/* ── Render landmark points ── */}
                {visible
                  .filter((z) => z.type === 'landmark')
                  .map((z) => {
                    const [lx, ly] = z.coordinates as [number, number];
                    const isSelected = selectedZone?.id === z.id;
                    const isHovered = hoveredId === z.id;
                    const r = isSelected ? 22 : isHovered ? 20 : 17;

                    return (
                      <g
                        key={z.id}
                        data-zone={z.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedZone(isSelected ? null : z)}
                        onMouseEnter={() => setHoveredId(z.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        id={`venue-landmark-${z.id}`}
                      >
                        <circle
                          cx={lx}
                          cy={ly}
                          r={r + 4}
                          fill="#1A1A1A"
                          opacity={0.3}
                          filter="url(#shadow)"
                          style={{ transition: 'r 0.15s' }}
                        />
                        <circle
                          cx={lx}
                          cy={ly}
                          r={r}
                          fill={z.color}
                          stroke="#1A1A1A"
                          strokeWidth={isSelected ? 3 : 2}
                          style={{ transition: 'r 0.15s' }}
                        />
                        <text
                          x={lx}
                          y={ly + 5}
                          textAnchor="middle"
                          fontSize={r * 0.9}
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {z.icon}
                        </text>
                        {(isHovered || isSelected) && (
                          <text
                            x={lx}
                            y={ly + r + 14}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight="bold"
                            fontFamily="Fredoka, sans-serif"
                            fill="#1A1A1A"
                            style={{ pointerEvents: 'none' }}
                          >
                            {z.name.length > 16 ? z.name.slice(0, 15) + '…' : z.name}
                          </text>
                        )}
                      </g>
                    );
                  })}

                {/* North compass */}
                <g transform="translate(950, 650)">
                  <circle cx={0} cy={0} r={20} fill="#EFE8D8" stroke="#1A1A1A" strokeWidth={1.5} />
                  <text x={0} y={5} textAnchor="middle" fontSize={12} fontWeight="bold" fontFamily="Fredoka, sans-serif" fill="#1A1A1A">N</text>
                  <path d="M0,-16 L4,-4 L0,4 L-4,-4 Z" fill="#F06E38" />
                </g>

                {/* Scale bar */}
                <g transform="translate(30, 665)">
                  <line x1={0} y1={0} x2={80} y2={0} stroke="#1A1A1A" strokeWidth={2} />
                  <line x1={0} y1={-5} x2={0} y2={5} stroke="#1A1A1A" strokeWidth={2} />
                  <line x1={80} y1={-5} x2={80} y2={5} stroke="#1A1A1A" strokeWidth={2} />
                  <text x={40} y={-8} textAnchor="middle" fontSize={9} fontFamily="Fredoka, sans-serif" fill="#1A1A1A" opacity={0.6}>100m</text>
                </g>
              </g>
            </svg>
          )}

          {/* Zoom controls overlay */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            <button
              onClick={() => setTransform((t) => ({ ...t, scale: Math.min(4, t.scale * 1.2) }))}
              className="w-8 h-8 bg-[#F7F2E7] border-2 border-[#1A1A1A] rounded-lg text-sm font-black hover:bg-[#F4C430] transition-colors flex items-center justify-center shadow"
              id="venue-zoom-in"
            >+</button>
            <button
              onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.4, t.scale * 0.83) }))}
              className="w-8 h-8 bg-[#F7F2E7] border-2 border-[#1A1A1A] rounded-lg text-sm font-black hover:bg-[#F4C430] transition-colors flex items-center justify-center shadow"
              id="venue-zoom-out"
            >−</button>
          </div>

          {/* Pan hint */}
          {!loading && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-[#1A1A1A]/60 rounded-lg text-[10px] text-white font-semibold backdrop-blur-sm">
              Drag to pan · Scroll to zoom · Click zone for details
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div
          className={`lg:w-72 dashboard-card p-5 flex flex-col gap-4 transition-all duration-300 ${
            selectedZone ? 'opacity-100' : 'opacity-50'
          }`}
          id="venue-detail-panel"
        >
          {selectedZone ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] shrink-0"
                  style={{ backgroundColor: selectedZone.color }}
                >
                  {selectedZone.icon ?? '📍'}
                </div>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="w-7 h-7 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center text-xs font-bold hover:bg-[#EC6484] hover:text-white transition-colors"
                  id="venue-close-detail"
                >
                  ✕
                </button>
              </div>

              <div>
                <span
                  className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#1A1A1A] mb-2"
                  style={{ backgroundColor: selectedZone.color + '40' }}
                >
                  {selectedZone.category} · {selectedZone.type}
                </span>
                <h3 className="text-lg font-black text-[#1A1A1A] leading-tight">{selectedZone.name}</h3>
              </div>

              {selectedZone.description && (
                <p className="text-xs text-[#1A1A1A]/70 font-medium leading-relaxed">
                  {selectedZone.description}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-[#1A1A1A]/10 text-[10px] font-mono text-[#1A1A1A]/40 uppercase">
                Zone ID #{selectedZone.id} · Fest #{festId}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
              <div className="text-5xl">🗺️</div>
              <p className="text-sm font-bold text-[#1A1A1A]/50">
                Click any zone or landmark on the map to see details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legend row */}
      <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest">
        {[
          { color: '#F06E38', label: 'Stage' },
          { color: '#F4C430', label: 'Food' },
          { color: '#EC6484', label: 'Gate' },
          { color: '#9CA3AF', label: 'Parking' },
          { color: '#06B6D4', label: 'Restroom' },
          { color: '#6366F1', label: 'Registration' },
          { color: '#EF4444', label: 'First Aid' },
          { color: '#8B5CF6', label: 'Info' },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-[#1A1A1A]" style={{ backgroundColor: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
