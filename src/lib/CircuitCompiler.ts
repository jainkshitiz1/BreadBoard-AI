import { usePhysicsStore } from '../store/physicsStore';

export class CircuitCompiler {
    /**
     * Generates a SPICE-compatible netlist string from the current physical DSU state.
     */
    static generateNetlist(): string {
        const state = usePhysicsStore.getState();
        const { components, wires, parent } = state;

        let netlist = "* FluxBoard AI Generated Netlist\n";
        netlist += "* Standard simulation commands\n.op\n.tran 1ms 10ms\n\n";

        // Track assigned SPICE node names mapping from DSU topological nets.
        // Every HoleId belongs to a NetId. We need string identifiers for SPICE (e.g. "N1", "N2").
        // GND should strictly be node "0" in SPICE.
        const nodeMap = new Map<number, string>();
        let nextNodeId = 1;

        const getSpiceNode = (holeId: string) => {
            const netId = state.getNetId(holeId);

            if (nodeMap.has(netId)) return nodeMap.get(netId)!;

            // Semantic grounding
            if (holeId.includes('GND')) {
                nodeMap.set(netId, '0');
                return '0';
            }

            const nodeName = `N${nextNodeId++}`;
            nodeMap.set(netId, nodeName);
            return nodeName;
        };

        // 1. Compile Components
        components.forEach((comp, idx) => {
            if (comp.type === 'RESISTOR') {
                const n1 = getSpiceNode(comp.pins['P1']);
                const n2 = getSpiceNode(comp.pins['P2']);
                // Format: R<name> <node1> <node2> <value>
                netlist += `R${idx} ${n1} ${n2} 1k\n`;
            }
            else if (comp.type === 'LED') {
                const anode = getSpiceNode(comp.pins['ANODE']);
                const cathode = getSpiceNode(comp.pins['CATHODE']);
                // Format: D<name> <anode> <cathode> <model>
                netlist += `D${idx} ${anode} ${cathode} LED_MODEL\n`;
            }
            else if (comp.type === 'BATTERY_5V' || comp.type === 'POWER_SUPPLY') {
                // Add a power source
                // Assuming an external power source component exists
                const vccNode = getSpiceNode(comp.pins['VCC']);
                const gndNode = getSpiceNode(comp.pins['GND']); // Should map to '0'
                netlist += `V${idx} ${vccNode} ${gndNode} DC 5.0\n`;
            }
            // Add other models as they expand (ICs, MCUs)
        });

        // 2. Compile The Zero-Ohm Rule (Wire physical connectivity as perfect conductors)
        netlist += "\n* physical wires (Zero-Ohm Rule)\n";
        wires.forEach((wire, idx) => {
            const n1 = getSpiceNode(wire.source);
            const n2 = getSpiceNode(wire.dest);

            // If the physical store already grouped them via DSU (getNetId),
            // n1 and n2 might technically be the exact same SPICE node string already.
            // But to force SPICE to see the wire itself (useful for current sensing),
            // we implement the rule: V_WIRE_1 nodeA nodeB DC 0

            if (n1 !== n2) {
                netlist += `V_WIRE_${idx} ${n1} ${n2} DC 0\n`;
            }
        });

        netlist += "\n.model LED_MODEL D(IS=1e-19 N=1.6 RS=1.5)\n";
        netlist += ".end\n";

        return netlist;
    }
}
