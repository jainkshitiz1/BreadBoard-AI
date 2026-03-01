import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ComponentInstance, WireInstance } from './physicsStore';

export interface SavedCircuit {
    id: string;
    name: string;
    savedAt: number;
    components: ComponentInstance[];
    wires: WireInstance[];
}

interface LibraryState {
    circuits: SavedCircuit[];
    saveCircuit: (name: string, components: ComponentInstance[], wires: WireInstance[]) => void;
    deleteCircuit: (id: string) => void;
    renameCircuit: (id: string, name: string) => void;
    importCircuit: (circuit: SavedCircuit) => void;
}

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set) => ({
            circuits: [],

            saveCircuit: (name, components, wires) =>
                set((s) => ({
                    circuits: [
                        {
                            id: crypto.randomUUID(),
                            name,
                            savedAt: Date.now(),
                            components: JSON.parse(JSON.stringify(components)),
                            wires: JSON.parse(JSON.stringify(wires)),
                        },
                        ...s.circuits,
                    ],
                })),

            deleteCircuit: (id) =>
                set((s) => ({ circuits: s.circuits.filter((c) => c.id !== id) })),

            renameCircuit: (id, name) =>
                set((s) => ({
                    circuits: s.circuits.map((c) => (c.id === id ? { ...c, name } : c)),
                })),

            importCircuit: (circuit) =>
                set((s) => ({
                    circuits: [{ ...circuit, id: crypto.randomUUID(), savedAt: Date.now() }, ...s.circuits],
                })),
        }),
        { name: 'fluxboard-library' }
    )
);

// ── File System helpers ────────────────────────────────────────────────────

/** Save circuit as a .fluxboard.json file on disk */
export async function exportCircuitToFile(circuit: SavedCircuit): Promise<void> {
    const json = JSON.stringify(circuit, null, 2);
    const fileName = `${circuit.name.replace(/[^a-z0-9_\-]/gi, '_')}.fluxboard.json`;

    // Try File System Access API (Chrome/Edge 86+)
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: fileName,
                types: [{ description: 'FluxBoard Circuit', accept: { 'application/json': ['.json', '.fluxboard.json'] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(json);
            await writable.close();
            return;
        } catch (e: any) {
            if (e.name === 'AbortError') return; // user cancelled
        }
    }

    // Fallback: trigger download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

/** Load a .fluxboard.json file from disk, returns parsed SavedCircuit */
export async function importCircuitFromFile(): Promise<SavedCircuit | null> {
    // Try File System Access API
    if ('showOpenFilePicker' in window) {
        try {
            const [handle] = await (window as any).showOpenFilePicker({
                types: [{ description: 'FluxBoard Circuit', accept: { 'application/json': ['.json'] } }],
                multiple: false,
            });
            const file = await handle.getFile();
            const text = await file.text();
            return JSON.parse(text) as SavedCircuit;
        } catch (e: any) {
            if (e.name === 'AbortError') return null;
        }
    }

    // Fallback: invisible <input type="file">
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.fluxboard.json';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return resolve(null);
            const text = await file.text();
            try { resolve(JSON.parse(text) as SavedCircuit); }
            catch { resolve(null); }
        };
        input.click();
    });
}
