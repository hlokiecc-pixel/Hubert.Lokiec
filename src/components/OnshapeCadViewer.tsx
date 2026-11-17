import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, RotateCw, Layers, ZoomIn, ZoomOut, Check, Info } from 'lucide-react';

interface OnshapeCadViewerProps {
  onshapeUrl?: string;
  onUpdateUrl?: (url: string) => void;
  isEditable?: boolean;
}

export const OnshapeCadViewer: React.FC<OnshapeCadViewerProps> = ({
  onshapeUrl = '',
  onUpdateUrl,
  isEditable = false,
}) => {
  const [urlInput, setUrlInput] = useState(onshapeUrl);
  const [activeTab, setActiveTab] = useState<'cad-embed' | 'interactive-schematic'>('interactive-schematic');
  const [rotationAngle, setRotationAngle] = useState(35);
  const [pitchAngle, setPitchAngle] = useState(20);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showFlowVectors, setShowFlowVectors] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeComponent, setActiveComponent] = useState<'wing' | 'fuselage' | 'tail' | 'cfd-mesh'>('wing');
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    setUrlInput(onshapeUrl);
    if (onshapeUrl && onshapeUrl.trim().length > 0) {
      setActiveTab('cad-embed');
    }
  }, [onshapeUrl]);

  const handleSaveUrl = () => {
    if (onUpdateUrl) {
      onUpdateUrl(urlInput.trim());
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
      if (urlInput.trim().length > 0) {
        setActiveTab('cad-embed');
      }
    }
  };

  // Check if URL is valid Onshape document
  const isOnshapeUrl = urlInput.includes('cad.onshape.com') || onshapeUrl.includes('cad.onshape.com');

  return (
    <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-4 py-2.5 bg-slate-50 gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('interactive-schematic')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'interactive-schematic'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Interactive Schematic & CFD
          </button>
          <button
            onClick={() => setActiveTab('cad-embed')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'cad-embed'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Onshape 3D Assembly Embed
          </button>
        </div>

        {onshapeUrl && (
          <a
            href={onshapeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>Open in Onshape</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Mode 1: Real Onshape Embed or Configuration */}
      {activeTab === 'cad-embed' && (
        <div className="p-4">
          {isOnshapeUrl ? (
            <div className="space-y-3">
              <div className="relative w-full h-[450px] bg-slate-900 rounded-lg overflow-hidden border border-slate-200">
                <iframe
                  src={onshapeUrl || urlInput}
                  title="Onshape 3D CAD Assembly"
                  className="w-full h-full border-0"
                  allow="fullscreen"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Direct Onshape 3D viewport. Mouse: Left-drag to rotate, Right-drag to pan, Scroll to zoom.</span>
                <a
                  href={onshapeUrl || urlInput}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  Full Document <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="py-10 px-6 text-center max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Add Your Onshape 3D Assembly URL</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  You can share your Onshape model with anyone visiting your portfolio. In Onshape, click <strong>Share</strong> &rarr; make document <strong>Public</strong> or generate a link, then paste it below.
                </p>
              </div>

              <div className="flex items-center gap-2 max-w-md mx-auto">
                <input
                  type="url"
                  placeholder="https://cad.onshape.com/documents/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveUrl}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  {savedFeedback ? 'Saved!' : 'Save Link'}
                </button>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-left border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-700 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  Quick Tip for Onshape Embedding:
                </div>
                <p className="text-slate-500">
                  You can paste any standard Onshape link (e.g. <code className="text-slate-800 bg-white px-1 py-0.5 rounded border">https://cad.onshape.com/documents/xxx/w/yyy/e/zzz</code>). When public, visitors can freely inspect the 3D geometry and sub-assemblies.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Interactive Aircraft Schematic & CFD Inspection Canvas */}
      {activeTab === 'interactive-schematic' && (
        <div className="p-4 space-y-4">
          <div className="relative w-full h-[380px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center select-none">
            {/* SVG Engineering Aircraft Wireframe */}
            <svg
              viewBox="0 0 600 400"
              className="w-full h-full transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotationAngle - 35}deg)`,
              }}
            >
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.7" />
                </pattern>
                <linearGradient id="cfdGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Background Grid */}
              <rect width="600" height="400" fill="#090d16" />
              <rect width="600" height="400" fill="url(#grid)" />

              {/* Coordinate Center Lines */}
              <line x1="300" y1="20" x2="300" y2="380" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="200" x2="560" y2="200" stroke="#1e293b" strokeDasharray="3 3" />

              {/* Flow Vectors if enabled (XFLR5 / ANSYS simulation representation) */}
              {showFlowVectors && (
                <g opacity="0.6">
                  {[-120, -60, 0, 60, 120].map((yOffset, i) => (
                    <g key={i} className="animate-pulse">
                      <path
                        d={`M 80 ${200 + yOffset} Q 260 ${195 + yOffset * 0.7} 520 ${200 + yOffset * 1.1}`}
                        fill="none"
                        stroke="url(#cfdGradient)"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                      />
                      <polygon
                        points={`515,${197 + yOffset * 1.1} 525,${200 + yOffset * 1.1} 515,${203 + yOffset * 1.1}`}
                        fill="#38bdf8"
                      />
                    </g>
                  ))}
                </g>
              )}

              {/* Aircraft Fuselage */}
              <path
                d="M 160 200 C 180 185, 410 185, 440 200 C 410 215, 180 215, 160 200 Z"
                fill={activeComponent === 'fuselage' ? '#1e293b' : '#0f172a'}
                stroke={activeComponent === 'fuselage' ? '#60a5fa' : '#334155'}
                strokeWidth={showWireframe ? '1.5' : '2'}
              />

              {/* Main Wings (High-lift airfoil section) */}
              <g
                stroke={activeComponent === 'wing' ? '#60a5fa' : '#475569'}
                strokeWidth={showWireframe ? '1.5' : '2'}
                fill={activeComponent === 'wing' ? '#1e293b' : '#0f172a'}
                fillOpacity="0.8"
              >
                {/* Left Wing */}
                <polygon points="280,188 220,50 260,50 330,188" />
                {/* Right Wing */}
                <polygon points="280,212 220,350 260,350 330,212" />

                {/* Wing Chord Lines (XFLR5 stations) */}
                {showWireframe && (
                  <>
                    <line x1="240" y1="96" x2="280" y2="96" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="260" y1="142" x2="305" y2="142" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="240" y1="304" x2="280" y2="304" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="260" y1="258" x2="305" y2="258" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  </>
                )}
              </g>

              {/* Horizontal & Vertical Stabilizer (Tail) */}
              <g
                stroke={activeComponent === 'tail' ? '#60a5fa' : '#475569'}
                strokeWidth="1.5"
                fill={activeComponent === 'tail' ? '#1e293b' : '#0f172a'}
              >
                <polygon points="410,195 445,150 460,150 435,195" />
                <polygon points="410,205 445,250 460,250 435,205" />
              </g>

              {/* Probe / Dimension Markers */}
              <circle cx="280" cy="200" r="3" fill="#ef4444" />
              <text x="290" y="204" fill="#94a3b8" fontSize="10" fontFamily="monospace">CG (Center of Gravity)</text>

              <circle cx="270" cy="142" r="3" fill="#38bdf8" />
              <text x="135" y="146" fill="#38bdf8" fontSize="10" fontFamily="monospace">XFLR5 Pressure Station</text>

              {/* Status Overlay in SVG */}
              <text x="30" y="45" fill="#e2e8f0" fontSize="12" fontWeight="600" fontFamily="sans-serif">
                M.Sc. Capstone Airframe CAD Model
              </text>
              <text x="30" y="65" fill="#64748b" fontSize="10" fontFamily="monospace">
                ROLE: XFLR5 Aerodynamics · ANSYS CFD · Onshape CAD
              </text>
            </svg>

            {/* Interactive HUD Overlay Buttons */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-lg backdrop-blur-xs">
              <button
                onClick={() => setZoomLevel((prev) => Math.min(prev + 0.15, 1.6))}
                title="Zoom In"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((prev) => Math.max(prev - 0.15, 0.7))}
                title="Zoom Out"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setRotationAngle((prev) => (prev + 45) % 360)}
                title="Rotate View"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowWireframe(!showWireframe)}
                title="Toggle Wireframe Mesh"
                className={`p-1.5 rounded ${
                  showWireframe ? 'text-blue-400 bg-blue-950/60' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Simulation Legend */}
            <div className="absolute top-3 right-3 bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-[10px] font-mono text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Low Pressure / High Lift</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Attached Boundary Layer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span>Stagnation Point</span>
              </div>
            </div>
          </div>

          {/* Component Inspection Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              onClick={() => setActiveComponent('wing')}
              className={`p-2.5 text-left border rounded-lg transition-colors ${
                activeComponent === 'wing'
                  ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-[11px] font-semibold">1. Main Wing Airfoil</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">XFLR5 Polars & L/D</div>
            </button>
            <button
              onClick={() => setActiveComponent('fuselage')}
              className={`p-2.5 text-left border rounded-lg transition-colors ${
                activeComponent === 'fuselage'
                  ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-[11px] font-semibold">2. Fuselage Pod</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">ANSYS Drag Minimization</div>
            </button>
            <button
              onClick={() => setActiveComponent('tail')}
              className={`p-2.5 text-left border rounded-lg transition-colors ${
                activeComponent === 'tail'
                  ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-[11px] font-semibold">3. Empennage (Tail)</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Pitch Stability & Trim</div>
            </button>
            <button
              onClick={() => setShowFlowVectors(!showFlowVectors)}
              className={`p-2.5 text-left border rounded-lg transition-colors ${
                showFlowVectors
                  ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-[11px] font-semibold">4. Flow Vectors</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {showFlowVectors ? 'Flow: Active' : 'Flow: Hidden'}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
