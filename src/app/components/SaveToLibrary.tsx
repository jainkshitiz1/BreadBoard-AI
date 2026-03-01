import { useState } from 'react';
import { useLibraryStore } from '../../store/libraryStore';
import { usePhysicsStore } from '../../store/physicsStore';
import { toast } from 'sonner';

export function SaveToLibraryButton() {
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [showLib, setShowLib] = useState(false);

    const components = usePhysicsStore((s: any) => s.components);
    const wires = usePhysicsStore((s: any) => s.wires);
    const saveCircuit = useLibraryStore((s) => s.saveCircuit);
    const deleteCircuit = useLibraryStore((s) => s.deleteCircuit);
    const circuits = useLibraryStore((s) => s.circuits);
    const addComponent = usePhysicsStore((s: any) => s.addComponent);
    const addWire = usePhysicsStore((s: any) => s.addWire);
    const rebuildGraph = usePhysicsStore((s: any) => s.rebuildGraph);

    const hasContent = components.length > 0;

    const handleSave = () => {
        const finalName = name.trim() || `Circuit ${new Date().toLocaleTimeString()}`;
        saveCircuit(finalName, components, wires);
        setShowModal(false);
        setName('');
        toast.success(`💾 Saved "${finalName}" to library`);
    };

    const handleLoad = (circuit: any) => {
        usePhysicsStore.setState({ components: [], wires: [] });
        circuit.components.forEach((c: any) => addComponent(c));
        circuit.wires.forEach((w: any) => addWire(w));
        rebuildGraph();
        setShowLib(false);
        toast.success(`📂 Loaded "${circuit.name}"`);
    };

    return (
        <>
            {/* Toolbar buttons */}
            <div className="flex items-center gap-2">
                <button
                    disabled={!hasContent}
                    onClick={() => setShowModal(true)}
                    className="px-3 py-1 text-xs font-mono rounded border transition-all disabled:opacity-30"
                    style={{
                        background: 'rgba(6,182,212,0.08)',
                        border: '1px solid #22d3ee44',
                        color: '#22d3ee',
                    }}
                    title="Save current circuit to library"
                >
                    💾 SAVE
                </button>
                <button
                    onClick={() => setShowLib(true)}
                    className="px-3 py-1 text-xs font-mono rounded border transition-all"
                    style={{
                        background: 'rgba(139,92,246,0.08)',
                        border: '1px solid #7c3aed55',
                        color: '#a78bfa',
                    }}
                    title="Open saved library"
                >
                    📚 LIBRARY {circuits.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-500/30 text-violet-300 text-[10px]">{circuits.length}</span>}
                </button>
            </div>

            {/* Save modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-80 rounded-2xl p-6 flex flex-col gap-4"
                        style={{ background: 'rgba(8,12,28,0.98)', border: '1px solid #22d3ee33', boxShadow: '0 0 40px #22d3ee18' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-sm font-mono font-bold text-cyan-400 tracking-widest">SAVE TO LIBRARY</span>
                        </div>
                        <p className="text-xs text-slate-500">{components.length} components · {wires.length} wires</p>
                        <input
                            autoFocus
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors"
                            placeholder="Circuit name (optional)…"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 py-2 rounded-xl text-xs font-mono text-slate-400 border border-slate-700 hover:border-slate-500 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave}
                                className="flex-1 py-2 rounded-xl text-xs font-mono font-bold text-white transition-all"
                                style={{ background: 'linear-gradient(135deg,#0e7490,#06b6d4)', boxShadow: '0 0 12px #22d3ee33' }}>
                                💾 Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Library panel modal */}
            {showLib && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-[480px] max-h-[70vh] rounded-2xl flex flex-col overflow-hidden"
                        style={{ background: 'rgba(8,12,28,0.98)', border: '1px solid #7c3aed44', boxShadow: '0 0 40px #7c3aed18' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                                <span className="text-sm font-mono font-bold text-violet-400 tracking-widest">CIRCUIT LIBRARY</span>
                                <span className="text-xs text-slate-500">({circuits.length} saved)</span>
                            </div>
                            <button onClick={() => setShowLib(false)}
                                className="text-slate-500 hover:text-slate-300 text-lg transition-colors">✕</button>
                        </div>
                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                            {circuits.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-600 font-mono text-sm">
                                    <span className="text-4xl mb-2">📭</span>
                                    No circuits saved yet.<br />Generate a circuit and hit 💾 SAVE.
                                </div>
                            ) : circuits.map(c => (
                                <div key={c.id}
                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 hover:border-violet-500/40 transition-colors group"
                                    style={{ background: 'rgba(15,23,42,0.8)' }}>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-mono text-slate-200 group-hover:text-violet-300 transition-colors">{c.name}</span>
                                        <span className="text-[10px] text-slate-500">
                                            {c.components.length} components · {c.wires.length} wires · {new Date(c.savedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleLoad(c)}
                                            className="px-3 py-1 text-[11px] font-mono rounded-lg transition-all"
                                            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid #7c3aed55', color: '#a78bfa' }}>
                                            📂 Load
                                        </button>
                                        <button onClick={() => { deleteCircuit(c.id); toast.info('Deleted from library'); }}
                                            className="px-2 py-1 text-[11px] rounded-lg text-red-400 border border-red-900/40 hover:border-red-500/60 transition-all">
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
