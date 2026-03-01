import { useState, useRef, useCallback } from 'react';
import { Navbar } from './Navbar';
import { DropZone } from './DropZone';
import { BOMCard } from './BOMCard';
import { WiringMap } from './WiringMap';
import { Scene } from './3d/Scene';
import { Toaster, toast } from 'sonner';
import { usePhysicsStore } from '../../store/physicsStore';
import { GeminiAnalyst } from '../../lib/gemini';
import { COMPONENT_LIBRARY } from '../../lib/ComponentLibrary';
import { CircuitEditBot } from './CircuitEditBot';

const MIN_LEFT = 180;
const MIN_MID = 160;
const MIN_RIGHT = 300;

/** Thin draggable divider between panels */
function ResizeDivider({ onDrag }: { onDrag: (dx: number) => void }) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    lastX.current = e.clientX;

    const onMove = (me: MouseEvent) => {
      if (!dragging.current) return;
      onDrag(me.clientX - lastX.current);
      lastX.current = me.clientX;
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [onDrag]);

  return (
    <div
      onMouseDown={onMouseDown}
      className="group relative w-1 flex-shrink-0 cursor-col-resize select-none z-10"
      style={{ background: '#1e293b' }}
    >
      {/* Wider invisible hit area */}
      <div className="absolute inset-y-0 -left-1.5 -right-1.5 group-hover:bg-cyan-500/8 transition-colors" />
      {/* Glow pip at centre */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'linear-gradient(to bottom, transparent, #22d3ee88, transparent)', boxShadow: '0 0 8px #22d3ee' }}
      />
    </div>
  );
}

export default function PrompterCAD() {
  const [fullscreen3D, setFullscreen3D] = useState(false);
  const [leftW, setLeftW] = useState(256);
  const [midW, setMidW] = useState(256);

  const containerRef = useRef<HTMLElement>(null);

  const dragLeft = useCallback((dx: number) => {
    setLeftW(w => Math.max(MIN_LEFT, w + dx));
  }, []);

  const dragMid = useCallback((dx: number) => {
    setLeftW(lw => {
      setMidW(mw => {
        const containerW = containerRef.current?.offsetWidth ?? 1200;
        const newMid = Math.max(MIN_MID, mw + dx);
        if (containerW - lw - newMid < MIN_RIGHT) return mw;
        return newMid;
      });
      return lw;
    });
  }, []);

  const components = usePhysicsStore((s: any) => s.components);
  const wires = usePhysicsStore((s: any) => s.wires);
  const addComponent = usePhysicsStore((s: any) => s.addComponent);
  const addWire = usePhysicsStore((s: any) => s.addWire);
  const rebuildGraph = usePhysicsStore((s: any) => s.rebuildGraph);

  const hasContent = components.length > 0 || wires.length > 0;

  const bomItems = components.map((c: any) => ({
    id: c.id as unknown as number,
    name: c.type,
    desc: `Anchor: ${Object.values(c.pins as Record<string, string>)[0] || 'Floating'}`,
    type: 'Component',
    stock: 'In Stock'
  }));

  const connections = wires.map((w: any) => ({
    id: w.id as unknown as number,
    source: w.source,
    dest: w.dest,
    type: 'Jumper'
  }));

  const handleDeleteBOM = (id: number) => {
    usePhysicsStore.getState().removeComponent(String(id));
    toast.error('Component removed from board');
  };
  const handleAddBOM = () => toast.error('Manual add disabled. Ask the AI.');
  const handleSwapBOM = (_id: number) => toast.info('Swap handled by AI routing');

  const handleGenerate = async (prompt: string, imageBase64: string) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          const result = await GeminiAnalyst.generateCircuit(prompt, imageBase64);
          if (result) {
            usePhysicsStore.setState({ components: [], wires: [] });
            result.components.forEach((c: any) => {
              if (COMPONENT_LIBRARY[c.type]) {
                addComponent({ id: c.id, type: c.type, pins: { anchor: c.anchorHole }, rotation: c.rotation });
              }
            });
            result.wires.forEach((w: any) => {
              addWire({ id: Math.random().toString(36).substring(7), source: w.source, dest: w.dest, color: w.color });
            });
            rebuildGraph();
            resolve(result.analysis);
          } else reject('Failed null');
        } catch (e) { console.error(e); reject(e); }
      }),
      {
        loading: 'AI Routing physical circuit...',
        success: (msg) => `Circuit Generated! ${msg}`,
        error: 'Failed to process schematic'
      }
    );
  };

  return (
    <div className="h-screen text-slate-200 font-sans overflow-hidden flex flex-col bg-slate-950">
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { maxWidth: '360px', fontSize: '0.78rem' } }} />
      <Navbar />

      {/* Full 3D Overlay Mode */}
      {fullscreen3D && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          <div className="flex-1"><Scene /></div>
          <button
            onClick={() => setFullscreen3D(false)}
            className="absolute top-4 right-4 z-50 px-4 py-2 bg-slate-900/90 backdrop-blur border border-slate-700 text-lime-400 font-mono text-sm rounded-lg hover:border-lime-400 transition-all"
          >
            ✕ EXIT 3D VIEW
          </button>
          <div className="absolute bottom-4 left-4 text-xs font-mono text-slate-500 pointer-events-none">
            Drag to orbit · Scroll to zoom · Right-click to pan
          </div>
        </div>
      )}

      {/* Three-panel resizable layout */}
      <main ref={containerRef} className="flex-1 flex overflow-hidden">

        {/* Panel 1: Upload + Prompt */}
        <div
          className="flex-shrink-0 flex flex-col bg-slate-900/50 backdrop-blur overflow-y-auto"
          style={{ width: leftW }}
        >
          <div className="p-3 flex flex-col gap-3 h-full">
            <DropZone onGenerate={handleGenerate} />
          </div>
        </div>

        <ResizeDivider onDrag={dragLeft} />

        {/* Panel 2: BOM + Wiring Map */}
        <div
          className="flex-shrink-0 flex flex-col bg-slate-900/30 backdrop-blur"
          style={{ width: midW }}
        >
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto border-b border-slate-800 p-3">
              <BOMCard items={bomItems} onDelete={handleDeleteBOM} onAdd={handleAddBOM} onSwap={handleSwapBOM} />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <WiringMap connections={connections} />
            </div>
          </div>
        </div>

        <ResizeDivider onDrag={dragMid} />

        {/* Panel 3: 3D Breadboard (dominant, flex-1) */}
        <div className="flex-1 relative flex flex-col" style={{ minWidth: MIN_RIGHT }}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/70 backdrop-blur flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              <span className="text-xs font-mono text-lime-400">3D BREADBOARD WORKSPACE</span>
              {hasContent && (
                <span className="text-xs font-mono text-cyan-400 ml-2">
                  · {components.length} components · {wires.length} wires
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!hasContent && <span className="text-xs text-slate-500 font-mono">Upload a schematic → GENERATE</span>}
              <button
                onClick={() => setFullscreen3D(true)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400 text-cyan-400 text-xs font-mono rounded transition-all"
              >
                ⤢ FULLSCREEN
              </button>
            </div>
          </div>
          {/* 3D Canvas */}
          <div className="flex-1 relative"><Scene /></div>
        </div>

      </main>

      <CircuitEditBot />
    </div>
  );
}
