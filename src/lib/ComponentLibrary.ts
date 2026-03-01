export interface PinDefinition {
    label: string;
    dx: number; // Column offset relative to top-left pin (0 = same column)
    dy: number; // Row offset relative to top-left pin (0 = same row, crossing trench = significant offset)
}

export interface ComponentDef {
    type: string;
    category: 'IC' | 'PASSIVE' | 'MCU';
    pins: PinDefinition[];
    widthCols: number;
    heightRows: number;
    mustCrossTrench: boolean;
}

export const COMPONENT_LIBRARY: Record<string, ComponentDef> = {
    'RESISTOR': {
        type: 'RESISTOR',
        category: 'PASSIVE',
        pins: [
            { label: 'P1', dx: 0, dy: 0 },
            { label: 'P2', dx: 3, dy: 0 } // Takes up 4 columns horizontally
        ],
        widthCols: 4,
        heightRows: 1,
        mustCrossTrench: false,
    },
    'LED': {
        type: 'LED',
        category: 'PASSIVE',
        pins: [
            { label: 'ANODE', dx: 0, dy: 0 },
            { label: 'CATHODE', dx: 1, dy: 0 }
        ],
        widthCols: 2,
        heightRows: 1,
        mustCrossTrench: false,
    },
    'DIP8_IC': {
        type: 'DIP8_IC',
        category: 'IC',
        pins: [
            { label: 'PIN1', dx: 0, dy: 0 },
            { label: 'PIN2', dx: 1, dy: 0 },
            { label: 'PIN3', dx: 2, dy: 0 },
            { label: 'PIN4', dx: 3, dy: 0 },
            { label: 'PIN5', dx: 3, dy: 5 }, // Crosses trench (dy offset of 5 rows, from E to F for example is technically A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, I=9, J=10. Wait, letters are rows? Typical breadboards: 1-60 are columns, A-J are rows.)
            { label: 'PIN6', dx: 2, dy: 5 },
            { label: 'PIN7', dx: 1, dy: 5 },
            { label: 'PIN8', dx: 0, dy: 5 },
        ],
        widthCols: 4,
        heightRows: 6, // E to F is a jump
        mustCrossTrench: true,
    },
    'NODEMCU_ESP32': {
        type: 'NODEMCU_ESP32',
        category: 'MCU',
        pins: Array.from({ length: 30 }).map((_, i) => ({
            label: `PIN${i + 1}`,
            dx: i < 15 ? i : 29 - i,
            dy: i < 15 ? 0 : 9
        })),
        widthCols: 15,
        heightRows: 10,
        mustCrossTrench: true,
    },
    'BATTERY': {
        type: 'BATTERY',
        category: 'PASSIVE',
        pins: [
            { label: 'POSITIVE', dx: 0, dy: 0 },
            { label: 'NEGATIVE', dx: 5, dy: 0 },
        ],
        widthCols: 6,
        heightRows: 2,
        mustCrossTrench: false,
    },
    'SWITCH': {
        type: 'SWITCH',
        category: 'PASSIVE',
        pins: [
            { label: 'IN', dx: 0, dy: 0 },
            { label: 'OUT', dx: 3, dy: 0 },
        ],
        widthCols: 4,
        heightRows: 2,
        mustCrossTrench: false,
    },
    'CAPACITOR': {
        type: 'CAPACITOR',
        category: 'PASSIVE',
        pins: [
            { label: 'POSITIVE', dx: 0, dy: 0 },
            { label: 'NEGATIVE', dx: 1, dy: 0 },
        ],
        widthCols: 2,
        heightRows: 1,
        mustCrossTrench: false,
    },
    'TRANSISTOR': {
        type: 'TRANSISTOR',
        category: 'PASSIVE',
        pins: [
            { label: 'BASE', dx: 0, dy: 0 },
            { label: 'COLLECTOR', dx: 1, dy: 0 },
            { label: 'EMITTER', dx: 2, dy: 0 },
        ],
        widthCols: 3,
        heightRows: 1,
        mustCrossTrench: false,
    },
    'LIGHT_BULB': {
        type: 'LIGHT_BULB',
        category: 'PASSIVE',
        pins: [
            { label: 'P1', dx: 0, dy: 0 },
            { label: 'P2', dx: 2, dy: 0 },
        ],
        widthCols: 3,
        heightRows: 2,
        mustCrossTrench: false,
    },
    'DIODE': {
        type: 'DIODE',
        category: 'PASSIVE',
        pins: [
            { label: 'ANODE', dx: 0, dy: 0 },
            { label: 'CATHODE', dx: 1, dy: 0 },
        ],
        widthCols: 2,
        heightRows: 1,
        mustCrossTrench: false,
    },
    'ZENER_DIODE': {
        type: 'ZENER_DIODE',
        category: 'PASSIVE',
        pins: [
            { label: 'ANODE', dx: 0, dy: 0 },
            { label: 'CATHODE', dx: 1, dy: 0 },
        ],
        widthCols: 2,
        heightRows: 1,
        mustCrossTrench: false,
    },
    'POTENTIOMETER': {
        type: 'POTENTIOMETER',
        category: 'PASSIVE',
        pins: [
            { label: 'CCW', dx: 0, dy: 0 },
            { label: 'WIPER', dx: 1, dy: 0 },
            { label: 'CW', dx: 2, dy: 0 },
        ],
        widthCols: 3,
        heightRows: 1,
        mustCrossTrench: false,
    },
    'RELAY': {
        type: 'RELAY',
        category: 'PASSIVE',
        pins: [
            { label: 'COIL_A', dx: 0, dy: 0 },
            { label: 'COIL_B', dx: 1, dy: 0 },
            { label: 'COM', dx: 3, dy: 0 },
            { label: 'NO', dx: 4, dy: 0 },
            { label: 'NC', dx: 5, dy: 0 },
        ],
        widthCols: 6,
        heightRows: 2,
        mustCrossTrench: false,
    },
    'BUZZER': {
        type: 'BUZZER',
        category: 'PASSIVE',
        pins: [
            { label: 'POSITIVE', dx: 0, dy: 0 },
            { label: 'NEGATIVE', dx: 1, dy: 0 },
        ],
        widthCols: 2,
        heightRows: 1,
        mustCrossTrench: false,
    },
    'PHOTORESISTOR': {
        type: 'PHOTORESISTOR',
        category: 'PASSIVE',
        pins: [
            { label: 'P1', dx: 0, dy: 0 },
            { label: 'P2', dx: 1, dy: 0 },
        ],
        widthCols: 2,
        heightRows: 1,
        mustCrossTrench: false,
    },
};

/**
 * Validates whether a component can be placed at a specific anchor hole.
 * Enforces the "Self-Shorting" UI rule for ICs.
 */
export function validatePlacement(type: string, anchorHole: string): { valid: boolean; error?: string } {
    const def = COMPONENT_LIBRARY[type];
    if (!def) return { valid: false, error: "Unknown component type" };

    // Parse anchorHole, e.g., 'E15' -> Row 'E' (index 4), Col 15
    // Note: On physical boards, 1-60 are the columns. A-J are the rows.
    // Wait, in my store I used A-J as columns and numbers as rows or vice versa? 
    // "Columns A-E are electrically connected" -> A-E are usually called rows, and 1-60 are columns.
    // The system's prompt: "The Metal Clip Law: Columns A-E are electrically connected. Columns F-J are electrically connected. The center trench breaks them."
    // Okay, the prompt strictly defines A-E and F-J as COLUMNS. And 1-60 as ROWS.
    // So 'E15' = Column E, Row 15. The trench is between Column E and Column F.

    const match = anchorHole.match(/^([A-J])(\d+)$/);
    if (!match) return { valid: false, error: "Invalid anchor hole format. Must be A-J and 1-60." };

    const anchorColChar = match[1];
    const anchorColCode = anchorColChar.charCodeAt(0); // A=65
    const anchorRow = parseInt(match[2], 10);

    if (def.mustCrossTrench) {
        // If it's an IC, it must span the trench (E to F). Let's check max dy.
        const maxDy = Math.max(...def.pins.map(p => p.dy));

        // The columns are A(0), B(1), C(2), D(3), E(4) || TRENCH || F(5), G(6), H(7), I(8), J(9)
        // If anchor is A-E, and we add maxDy, the new column index must cross the trench.
        const startColIndex = anchorColCode - 65;
        const endColIndex = startColIndex + maxDy;

        const startsBeforeTrench = startColIndex <= 4; // A-E
        const endsAfterTrench = endColIndex >= 5; // F-J

        if (!(startsBeforeTrench && endsAfterTrench)) {
            return {
                valid: false,
                error: `Self-Shorting Rule: ${type} must physically span the center trench. Cannot place entirely on one side.`
            };
        }
    }

    // Ensure it doesn't fall off the board 
    const maxDx = Math.max(...def.pins.map(p => p.dx));
    if (anchorRow + maxDx > 60) return { valid: false, error: "Component falls off the bottom of the board." };

    return { valid: true };
}
