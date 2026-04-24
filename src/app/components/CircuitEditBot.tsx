import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { usePhysicsStore } from '../../store/physicsStore';
import { COMPONENT_LIBRARY } from '../../lib/ComponentLibrary';
import { toast } from 'sonner';

interface Message {
    role: 'user' | 'ai';
    text: string;
}

const API_KEYS = [
    import.meta.env.VITE_GEMINI_API_KEY || '',
].filter(Boolean);
let _ki = 0;
const nextKey = () => API_KEYS.length > 0 ? API_KEYS[(_ki = (_ki + 1) % API_KEYS.length)] : '';

export function CircuitEditBot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: "Hey! I'm **Circuitex** ⚡\nDescribe an edit — I'll update the board.\n\nExamples:\n• *Add a capacitor at B25*\n• *Remove the LED at B10*\n• *Move the resistor to row C*" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const components = usePhysicsStore((s: any) => s.components);
    const wires = usePhysicsStore((s: any) => s.wires);
    const addComponent = usePhysicsStore((s: any) => s.addComponent);
    const removeComponent = usePhysicsStore((s: any) => s.removeComponent);
    const addWire = usePhysicsStore((s: any) => s.addWire);
    const removeWire = usePhysicsStore((s: any) => s.removeWire);
    const rebuildGraph = usePhysicsStore((s: any) => s.rebuildGraph);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const send = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const model = new GoogleGenerativeAI(nextKey()).getGenerativeModel({ model: 'gemini-3-flash-preview' });

            const systemCtx = `
You are Circuitex, an expert breadboard circuit editor AI.
The user is editing an existing 60-column breadboard layout in real-time.

CURRENT BOARD STATE:
Components: ${JSON.stringify(components, null, 2)}
Wires: ${JSON.stringify(wires, null, 2)}

AVAILABLE COMPONENT TYPES (use EXACTLY):
${JSON.stringify(Object.keys(COMPONENT_LIBRARY))}

BREADBOARD RULES:
- Columns 1-60, Rows A-J. Trench between E and F.
- ICs (DIP8_IC) MUST anchor on row E and straddle the trench.
- LEDs/Transistors/Capacitors anchor on rows A-D or G-J.
- Resistors lie flat on a single row.

YOUR TASK:
1. Understand the user's edit request in plain English.
2. Produce a JSON patch to apply. Use this exact format:
{
  "action": "add" | "remove" | "replace" | "none",
  "add_components": [{ "id": "cX", "type": "TYPENAME", "anchorHole": "B25", "rotation": 0 }],
  "remove_component_ids": ["c2"],
  "add_wires": [{ "id": "wX", "source": "B25", "dest": "RAIL_GND_L_25", "color": "#3b82f6" }],
  "remove_wire_ids": ["w3"],
  "message": "Human-readable explanation of what you did."
}

If no board changes are needed (e.g. the user is just asking a question), set action to "none" and fill only "message".
Return ONLY valid raw JSON — no markdown, no backticks.
`;

            const result = await model.generateContent([systemCtx, userMsg]);
            const raw = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
            const patch = JSON.parse(raw);

            // Apply removes first
            (patch.remove_component_ids || []).forEach((id: string) => removeComponent(id));
            (patch.remove_wire_ids || []).forEach((id: string) => removeWire(id));

            // Apply adds
            (patch.add_components || []).forEach((c: any) => {
                if (COMPONENT_LIBRARY[c.type]) {
                    addComponent({ id: c.id || crypto.randomUUID().slice(0, 6), type: c.type, pins: { anchor: c.anchorHole }, rotation: c.rotation || 0 });
                }
            });
            (patch.add_wires || []).forEach((w: any) => {
                addWire({ id: w.id || crypto.randomUUID().slice(0, 6), source: w.source, dest: w.dest, color: w.color || '#22d3ee' });
            });

            if (patch.action !== 'none') rebuildGraph();

            setMessages(prev => [...prev, { role: 'ai', text: patch.message || 'Done!' }]);
            if (patch.action !== 'none') toast.success('Board updated by Circuitex ⚡');
        } catch (e: any) {
            // Suppress raw SDK/API error messages (403 leaked key, 429 quota, network, etc.)
            // Never expose raw API errors to the user — just show a friendly fallback.
            const isApiError = e?.message?.toLowerCase().includes('api key') ||
                e?.message?.toLowerCase().includes('quota') ||
                e?.message?.toLowerCase().includes('403') ||
                e?.message?.toLowerCase().includes('429') ||
                e?.message?.toLowerCase().includes('fetch');

            const friendlyMsg = isApiError
                ? 'AI is temporarily unavailable. Please try again in a moment.'
                : 'Could not process that edit. Try rephrasing your request.';

            console.warn('[CircuitEditBot]', e?.message); // silent log only
            setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${friendlyMsg}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* FAB trigger */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group"
                style={{
                    background: 'linear-gradient(135deg, #0f172a 60%, #164e63)',
                    border: '1.5px solid #22d3ee55',
                    boxShadow: open ? '0 0 24px #22d3ee55' : '0 0 12px #22d3ee22',
                }}
                title="Circuitex Edit Bot"
            >
                <span className="text-2xl transition-transform duration-300 group-hover:scale-110">
                    {open ? '✕' : '⚡'}
                </span>
            </button>

            {/* Chat panel */}
            {open && (
                <div
                    className="fixed bottom-24 right-6 z-50 w-[340px] flex flex-col rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(8, 12, 28, 0.97)',
                        border: '1px solid #22d3ee33',
                        boxShadow: '0 0 40px #22d3ee18, 0 24px 48px rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(16px)',
                        height: '480px',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/80 flex-shrink-0"
                        style={{ background: 'rgba(15,23,42,0.9)' }}>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest">CIRCUITEX</span>
                        <span className="text-xs font-mono text-slate-500 ml-1">/ EDIT BOT</span>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className="max-w-[88%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                                    style={m.role === 'user' ? {
                                        background: 'linear-gradient(135deg, #0e7490, #0891b2)',
                                        color: '#fff',
                                        borderRadius: '14px 14px 4px 14px',
                                    } : {
                                        background: 'rgba(30,41,59,0.8)',
                                        color: '#cbd5e1',
                                        border: '1px solid #1e293b',
                                        borderRadius: '14px 14px 14px 4px',
                                    }}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700">
                                    <div className="flex gap-1 items-center">
                                        {[0, 1, 2].map(j => (
                                            <div key={j} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                                                style={{ animation: `bounce 1s ease-in-out ${j * 0.15}s infinite` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input bar */}
                    <div className="flex items-center gap-2 p-3 border-t border-slate-800/80 flex-shrink-0">
                        <input
                            className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors"
                            placeholder="Add LED to B30, remove resistor…"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && send()}
                            disabled={loading}
                        />
                        <button
                            onClick={send}
                            disabled={loading || !input.trim()}
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                            style={{
                                background: 'linear-gradient(135deg, #0e7490, #06b6d4)',
                                boxShadow: loading ? 'none' : '0 0 10px #22d3ee44',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
