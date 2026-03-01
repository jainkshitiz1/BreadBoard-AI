import { create } from 'zustand';

export type HoleId = string; // e.g., 'A1', 'J60', 'VCC1_15', 'GND2_45'
export type NetId = number;

export interface ComponentInstance {
    id: string;
    type: string;
    pins: Record<string, HoleId>; // e.g., { 'yin': 'A1', 'yang': 'A3' }
    rotation: number;
}

export interface WireInstance {
    id: string;
    source: HoleId;
    dest: HoleId;
    color: string;
}

interface PhysicsState {
    components: ComponentInstance[];
    wires: WireInstance[];

    // The DSU disjoint set array for the nodes
    parent: Record<HoleId, HoleId>;

    // Actions
    addComponent: (comp: ComponentInstance) => void;
    removeComponent: (id: string) => void;
    addWire: (wire: WireInstance) => void;
    removeWire: (id: string) => void;

    // Get the NetId for a topological hole
    getNetId: (hole: HoleId) => NetId;

    // Rebuild the DSU graph based on current wires and board physics
    rebuildGraph: () => void;
}

// Helper to determine base breadboard internal connections (The Metal Clip Law)
function getBaseConnectedHoles(hole: HoleId): HoleId[] {
    // A standard full-size breadboard has 63 or 60 columns. Let's assume 60.
    // Rows 1-60.
    // Power Rails: Left (+ -) Right (+ -), split at 30? The rule: "The outer Power Rails (VCC/GND) break connectivity at column 30."

    const connected: HoleId[] = [];

    // Match standard signal holes: A-J, 1-60
    const signalMatch = hole.match(/^([A-J])(\d+)$/);
    if (signalMatch) {
        const col = signalMatch[1];
        const row = parseInt(signalMatch[2], 10);

        // Metal Clip Law: Columns A-E are electrically connected. Columns F-J are electrically connected.
        const leftCols = ['A', 'B', 'C', 'D', 'E'];
        const rightCols = ['F', 'G', 'H', 'I', 'J'];

        if (leftCols.includes(col)) {
            leftCols.forEach(c => {
                if (c !== col) connected.push(`${c}${row}`);
            });
        } else if (rightCols.includes(col)) {
            rightCols.forEach(c => {
                if (c !== col) connected.push(`${c}${row}`);
            });
        }
        return connected;
    }

    // Power rails: e.g., VCC_LEFT_15 (meaning left VCC rail, row 15)
    // Need to parse power rails and split at 30.
    // Let's use format: RAIL_{TYPE}_{SIDE}_{INDEX}  (e.g., RAIL_VCC_L_10)
    const railMatch = hole.match(/^RAIL_(VCC|GND)_(L|R)_(\d+)$/);
    if (railMatch) {
        const type = railMatch[1];
        const side = railMatch[2];
        const index = parseInt(railMatch[3], 10);

        // Split at 30 means 1-30 are connected, 31-60 are connected
        const start = index <= 30 ? 1 : 31;
        const end = index <= 30 ? 30 : 60;

        for (let i = start; i <= end; i++) {
            if (i !== index) {
                connected.push(`RAIL_${type}_${side}_${i}`);
            }
        }
    }

    return connected;
}

export const usePhysicsStore = create<PhysicsState>((set, get) => ({
    components: [],
    wires: [],
    parent: {},

    addComponent: (comp) => set((state) => {
        const newComps = [...state.components, comp];
        return { components: newComps };
    }),

    removeComponent: (id) => set((state) => {
        return { components: state.components.filter(c => c.id !== id) };
    }),

    addWire: (wire) => set((state) => {
        const newWires = [...state.wires, wire];
        return { wires: newWires };
    }),

    removeWire: (id) => set((state) => {
        return { wires: state.wires.filter(w => w.id !== id) };
    }),

    getNetId: (hole) => {
        let current = hole;
        let parents = get().parent;

        // Path compression
        const path: HoleId[] = [];
        while (parents[current] && parents[current] !== current) {
            path.push(current);
            current = parents[current];
        }

        // Simple hash to integer
        let hash = 0;
        for (let i = 0; i < current.length; i++) {
            hash = (Math.imul(31, hash) + current.charCodeAt(i)) | 0;
        }
        return Math.abs(hash);
    },

    rebuildGraph: () => {
        const state = get();
        const parent: Record<HoleId, HoleId> = {};

        const find = (i: HoleId): HoleId => {
            if (!parent[i]) parent[i] = i;
            if (parent[i] === i) return i;
            return parent[i] = find(parent[i]);
        };

        const union = (i: HoleId, j: HoleId) => {
            const rootI = find(i);
            const rootJ = find(j);
            if (rootI !== rootJ) {
                // Union by simple lexicographical tie break for determinism
                if (rootI < rootJ) {
                    parent[rootJ] = rootI;
                } else {
                    parent[rootI] = rootJ;
                }
            }
        };

        // 1. Build base connections for all possible holes (1-60)
        // To be efficient, we only need to union the canonical base holes when they are referenced
        // Actually, it's easier to just pre-union the board's internal metal clips

        for (let row = 1; row <= 60; row++) {
            // A-E
            for (let i = 1; i < 5; i++) {
                union(`A${row}`, `${String.fromCharCode(65 + i)}${row}`); // A-E
            }
            // F-J
            for (let i = 1; i < 5; i++) {
                union(`F${row}`, `${String.fromCharCode(70 + i)}${row}`); // F-J
            }

            // Power Rails
            if (row < 30) {
                union(`RAIL_VCC_L_1`, `RAIL_VCC_L_${row + 1}`);
                union(`RAIL_GND_L_1`, `RAIL_GND_L_${row + 1}`);
                union(`RAIL_VCC_R_1`, `RAIL_VCC_R_${row + 1}`);
                union(`RAIL_GND_R_1`, `RAIL_GND_R_${row + 1}`);
            } else if (row < 60) {
                union(`RAIL_VCC_L_31`, `RAIL_VCC_L_${row + 1}`);
                union(`RAIL_GND_L_31`, `RAIL_GND_L_${row + 1}`);
                union(`RAIL_VCC_R_31`, `RAIL_VCC_R_${row + 1}`);
                union(`RAIL_GND_R_31`, `RAIL_GND_R_${row + 1}`);
            }
        }

        // 2. Add Wire Unions
        state.wires.forEach(wire => {
            union(wire.source, wire.dest);
        });

        set({ parent });
    }
}));
