import { useMemo } from 'react';
import * as THREE from 'three';
import { usePhysicsStore } from '../../../store/physicsStore';
import { COMPONENT_LIBRARY } from '../../../lib/ComponentLibrary';
import { Text } from '@react-three/drei';
import { ROW_Z, TRENCH_Z_MID } from './RealisticBreadboard';

const PITCH = 0.254;
const COLS = 60;
const BOARD_Y = 0.055;   // board top surface Y

// ─── Coordinate helpers ──────────────────────────────────────────────────────
function getHolePos(holeId: string): THREE.Vector3 {
    const m = holeId.match(/^([A-J])(\d+)$/);
    if (!m) return new THREE.Vector3(0, 0, 0);
    const col = parseInt(m[2], 10);
    return new THREE.Vector3((col - 1 - COLS / 2) * PITCH, 0, ROW_Z[m[1]] ?? 0);
}

/**
 * IC center X/Z: body always centered on the trench midpoint.
 * Pin 0 is at anchor column, so X center = anchorCol + (n-1)/2 * PITCH.
 */
function icCenterFromAnchor(anchorHole: string, pinCount: number): [number, number] {
    const m = anchorHole.match(/^([A-J])(\d+)$/);
    if (!m) return [0, TRENCH_Z_MID];
    const col = parseInt(m[2], 10);
    const cx = (col - 1 - COLS / 2) * PITCH + ((pinCount - 1) / 2) * PITCH;
    return [cx, TRENCH_Z_MID];
}

// ─── LED ─────────────────────────────────────────────────────────────────────
// Pins MUST be at ±PITCH*0.5 so they land in two adjacent holes (widthCols=2)
function LEDBody({ ledColor = '#ef4444' }: { ledColor?: string }) {
    const BASE_R = 0.092;
    const BASE_H = 0.12;
    const DOME_R = 0.10;
    const FLANGE = 0.015;
    const PIN_R = 0.010;
    // Exact hole spacing: 1 PITCH between the two holes, so ±PITCH/2 from center
    const ANODE_X = -PITCH * 0.5;  // col N   (longer leg)
    const CATHODE_X = PITCH * 0.5;  // col N+1 (shorter leg, flat on one side)
    const ANODE_L = 0.30;   // long enough to reach into board
    const CATHODE_L = 0.24;

    return (
        <group>
            {/* Flat bottom base ring (real LEDs have a flat rim at the cathode side) */}
            <mesh position={[0, 0.008, 0]}>
                <cylinderGeometry args={[BASE_R + 0.005, BASE_R + 0.005, 0.016, 20]} />
                <meshStandardMaterial color="#a0a8b0" metalness={0.2} roughness={0.4} />
            </mesh>
            {/* Base cylinder */}
            <mesh position={[0, BASE_H / 2 + 0.016, 0]}>
                <cylinderGeometry args={[BASE_R, BASE_R, BASE_H, 20]} />
                <meshPhysicalMaterial color="#d4d8de" transparent opacity={0.72} roughness={0.1} />
            </mesh>
            {/* Collar flange */}
            <mesh position={[0, BASE_H + 0.016 + FLANGE / 2, 0]}>
                <cylinderGeometry args={[BASE_R + 0.012, BASE_R + 0.012, FLANGE, 20]} />
                <meshStandardMaterial color="#a0a8b0" metalness={0.1} roughness={0.3} />
            </mesh>
            {/* Glass dome */}
            <mesh position={[0, BASE_H + 0.016 + FLANGE + DOME_R * 0.72, 0]}>
                <sphereGeometry args={[DOME_R, 28, 28, 0, Math.PI * 2, 0, Math.PI * 0.72]} />
                <meshPhysicalMaterial
                    color={ledColor} transparent opacity={0.55}
                    roughness={0} transmission={0.6} ior={1.48}
                    emissive={ledColor} emissiveIntensity={1.5}
                />
            </mesh>
            {/* Internal semiconductor die */}
            <mesh position={[0, BASE_H * 0.55 + 0.016, 0]}>
                <boxGeometry args={[0.022, 0.006, 0.022]} />
                <meshStandardMaterial color="#1e293b" emissive={ledColor} emissiveIntensity={2.5} />
            </mesh>
            {/* Glow light */}
            <pointLight color={ledColor} intensity={3.5} distance={2.0}
                position={[0, BASE_H + DOME_R + 0.016, 0]} />

            {/* ── Anode (long) at ANODE_X = -PITCH/2 → col N exactly */}
            <mesh position={[ANODE_X, -ANODE_L / 2, 0]}>
                <cylinderGeometry args={[PIN_R, PIN_R, ANODE_L, 6]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* ── Cathode (short) at CATHODE_X = +PITCH/2 → col N+1 exactly */}
            <mesh position={[CATHODE_X, -CATHODE_L / 2, 0]}>
                <cylinderGeometry args={[PIN_R, PIN_R, CATHODE_L, 6]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
            </mesh>
        </group>
    );
}

// ─── RESISTOR ────────────────────────────────────────────────────────────────
// PIN_HALF = (widthCols-1)/2 * PITCH  ← exact hole-to-hole span from center
// e.g. widthCols=4 → PIN_HALF = 1.5*PITCH so pins land on cols N and N+3
function ResistorBody({ w, widthCols }: { w: number; widthCols: number }) {
    const R = 0.072;
    const bodyLen = w * 0.52;
    const PIN_R = 0.011;
    const RISE = R + 0.04;
    const bodyY = RISE + R;          // body centre height above group origin
    const LEG_DROP = bodyY + 0.18;    // total pin length from top to tip
    const PIN_HALF = (widthCols - 1) / 2 * PITCH; // exact hole position from center
    const horizLen = PIN_HALF - bodyLen / 2;       // horizontal leg length
    const BANDS = ['#5a4000', '#f0f000', '#cc2222', '#ffd700'];

    return (
        <group>
            {/* ── Body cylinder */}
            <mesh position={[0, bodyY, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[R, R, bodyLen, 20]} />
                <meshStandardMaterial color="#c8a265" roughness={0.65} emissive="#6a4010" emissiveIntensity={0.15} />
            </mesh>
            {/* End caps */}
            {([-1, 1] as const).map((s, i) => (
                <mesh key={i} position={[s * bodyLen * 0.52, bodyY, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <sphereGeometry args={[R * 0.85, 14, 14]} />
                    <meshStandardMaterial color="#c8a265" roughness={0.65} />
                </mesh>
            ))}
            {/* Colour bands */}
            {BANDS.map((c, i) => (
                <mesh key={i} position={[bodyLen * (-0.36 + i * 0.24), bodyY, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[R + 0.003, R + 0.003, 0.022, 20]} />
                    <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} />
                </mesh>
            ))}

            {/* ── Left leg: horizontal from body-end → PIN_HALF, then drop INTO hole */}
            <mesh position={[-(bodyLen / 2 + horizLen / 2), bodyY, 0]}>
                <boxGeometry args={[horizLen, PIN_R * 2, PIN_R * 2]} />
                <meshStandardMaterial color="#8fa0b0" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Left vertical drop — centre at bodyY/2, length = bodyY+extra so tip goes into hole */}
            <mesh position={[-PIN_HALF, bodyY / 2 - 0.09, 0]}>
                <cylinderGeometry args={[PIN_R, PIN_R, LEG_DROP, 6]} />
                <meshStandardMaterial color="#8fa0b0" metalness={0.85} roughness={0.2} />
            </mesh>

            {/* ── Right leg */}
            <mesh position={[(bodyLen / 2 + horizLen / 2), bodyY, 0]}>
                <boxGeometry args={[horizLen, PIN_R * 2, PIN_R * 2]} />
                <meshStandardMaterial color="#8fa0b0" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[PIN_HALF, bodyY / 2 - 0.09, 0]}>
                <cylinderGeometry args={[PIN_R, PIN_R, LEG_DROP, 6]} />
                <meshStandardMaterial color="#8fa0b0" metalness={0.85} roughness={0.2} />
            </mesh>
        </group>
    );
}

// ─── CAPACITOR ───────────────────────────────────────────────────────────────
// Larger: radius 0.082, height 0.38
function CapacitorBody() {
    const r = 0.082, h = 0.38, PIN_R = 0.010, LEG_L = 0.24;
    return (
        <group>
            <mesh position={[0, h / 2, 0]}>
                <cylinderGeometry args={[r, r, h, 24]} />
                <meshPhysicalMaterial color="#151515" roughness={0.3} metalness={0.4} />
            </mesh>
            {/* White minus stripe near top */}
            <mesh position={[0, h * 0.88, 0]}>
                <cylinderGeometry args={[r + 0.001, r + 0.001, h * 0.16, 24]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
            </mesh>
            <mesh position={[0, h * 0.88, r + 0.003]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.032, h * 0.14]} />
                <meshBasicMaterial color="#e2e8f0" side={THREE.DoubleSide} />
            </mesh>
            {/* Top flat cap with X-vent */}
            <mesh position={[0, h, 0]}>
                <cylinderGeometry args={[r, r, 0.016, 24]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.3} />
            </mesh>
            {([0, Math.PI / 2] as const).map((rot, i) => (
                <mesh key={i} position={[0, h + 0.010, 0]} rotation={[0, rot, 0]}>
                    <boxGeometry args={[r * 1.6, 0.004, 0.007]} />
                    <meshBasicMaterial color="#2c2c2c" />
                </mesh>
            ))}
            {/* Flange ring at base */}
            <mesh position={[0, 0.012, 0]}>
                <cylinderGeometry args={[r + 0.015, r + 0.015, 0.022, 24]} />
                <meshStandardMaterial color="#0f0f0f" roughness={0.5} metalness={0.5} />
            </mesh>
            {/* Legs drop into board holes exactly */}
            {([-PITCH * 0.5, PITCH * 0.5] as const).map((ox, i) => (
                <mesh key={i} position={[ox, -LEG_L / 2, 0]}>
                    <cylinderGeometry args={[PIN_R, PIN_R, LEG_L, 6]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
                </mesh>
            ))}
        </group>
    );
}

// ─── DIP IC ──────────────────────────────────────────────────────────────────
// Verified local math:  E_local=-PITCH, F_local=+PITCH, bodyHalfD=0.75*PITCH
// Pin strategy: small horizontal elbow OUTSIDE the body, then straight cylindrical
// drop into each hole — same proven approach used by TransistorBody.
function DIPICBody({ w, pinCount = 4 }: { w: number; pinCount?: number }) {
    // ── All constants self-contained (no undefined vars from outer scope) ──
    const BODY_H = 0.20;
    const PIN_R = 0.011;  // cylinder pin radius
    const PIN_W = 0.022;  // box elbow width

    // Local Z positions (group parented at TRENCH_Z_MID world Z)
    // ROW_Z.E = -0.5*PITCH, TRENCH_Z_MID = +0.5*PITCH → local E = -PITCH
    const E_L = -PITCH;        // row E local Z  (-0.254)
    const F_L = PITCH;        // row F local Z  (+0.254)
    const BD = PITCH * 0.75;  // body half-depth (0.1905)

    // Elbow: segment from body-edge to hole
    const ELB_LEN = PITCH - BD;   // = 0.25*PITCH = 0.0635
    const ELB_Y = 0.006;         // just above board

    // Vertical pin: from ELB_Y down through hole into substrate
    const PIN_LEN = 0.23;
    const PIN_CEN_Y = ELB_Y * 0.5 - PIN_LEN * 0.5;  // = -0.112

    // X positions: pin0 at leftmost, centred on body
    const pinXs = Array.from({ length: pinCount }, (_, i) =>
        (i - (pinCount - 1) / 2) * PITCH
    );

    return (
        <group>
            {/* Body */}
            <mesh position={[0, BODY_H / 2, 0]}>
                <boxGeometry args={[w, BODY_H, BD * 2]} />
                <meshPhysicalMaterial color="#08080e" roughness={0.14} metalness={0.2} />
            </mesh>
            {/* Pin-1 notch */}
            <mesh position={[-w * 0.48, BODY_H + 0.001, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 0.003, 10]} />
                <meshStandardMaterial color="#2a2a2a" />
            </mesh>
            {/* Label */}
            <Text position={[0, BODY_H + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.055} color="#ffffff" anchorX="center" anchorY="middle">IC</Text>

            {/* ── Row E pins ── */}
            {pinXs.map((px, i) => (
                <group key={`e${i}`}>
                    {/* elbow from body edge toward row E */}
                    <mesh position={[px, ELB_Y, E_L + ELB_LEN / 2]}>
                        <boxGeometry args={[PIN_W, PIN_W, ELB_LEN]} />
                        <meshStandardMaterial color="#9daab5" metalness={0.92} roughness={0.06} />
                    </mesh>
                    {/* vertical pin drop into row E hole */}
                    <mesh position={[px, PIN_CEN_Y, E_L]}>
                        <cylinderGeometry args={[PIN_R, PIN_R, PIN_LEN, 8]} />
                        <meshStandardMaterial color="#9daab5" metalness={0.92} roughness={0.06} />
                    </mesh>
                </group>
            ))}

            {/* ── Row F pins ── */}
            {pinXs.map((px, i) => (
                <group key={`f${i}`}>
                    {/* elbow from body edge toward row F */}
                    <mesh position={[px, ELB_Y, F_L - ELB_LEN / 2]}>
                        <boxGeometry args={[PIN_W, PIN_W, ELB_LEN]} />
                        <meshStandardMaterial color="#9daab5" metalness={0.92} roughness={0.06} />
                    </mesh>
                    {/* vertical pin drop into row F hole */}
                    <mesh position={[px, PIN_CEN_Y, F_L]}>
                        <cylinderGeometry args={[PIN_R, PIN_R, PIN_LEN, 8]} />
                        <meshStandardMaterial color="#9daab5" metalness={0.92} roughness={0.06} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}
// ─── TRANSISTOR ──────────────────────────────────────────────────────────────
function TransistorBody() {
    const h = 0.22, r = 0.048, PIN_R = 0.009, LEG_L = 0.22;
    return (
        <group>
            <mesh position={[0, h / 2, 0]}>
                <cylinderGeometry args={[r, r, h, 20]} />
                <meshStandardMaterial color="#111" roughness={0.5} />
            </mesh>
            {([-PITCH, 0, PITCH] as const).map((ox, i) => (
                <mesh key={i} position={[ox, -LEG_L / 2, 0]}>
                    <cylinderGeometry args={[PIN_R, PIN_R, LEG_L, 6]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
                </mesh>
            ))}
        </group>
    );
}

// ─── BATTERY ─────────────────────────────────────────────────────────────────
// Body horizontal along X (columns), elevated so it clears the board surface.
// Two vertical pins drop straight down into the two anchor-pin holes.
function BatteryBody({ w }: { w: number }) {
    const r = 0.095;
    const bLen = w * 0.88;
    const PIN_R = 0.010;
    const PIN_L = 0.22;   // how far each pin extends below group centre
    // Lift the group so the bottom of the cylinder is clear of the board
    // Group origin Y = BOARD_Y (set by parent).  Cylinder centre = r + gap above board.
    const BODY_Y_OFFSET = r + 0.015;

    return (
        <group>
            {/* Cylinder body — lies along X axis */}
            <mesh position={[0, BODY_Y_OFFSET, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[r, r, bLen, 24]} />
                <meshStandardMaterial color="#1e3a8a" roughness={0.4} metalness={0.2} />
            </mesh>
            {/* Capacity label band */}
            <mesh position={[0, BODY_Y_OFFSET, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[r + 0.003, r + 0.003, bLen * 0.6, 24]} />
                <meshStandardMaterial color="#2563eb" roughness={0.8} transparent opacity={0.9} />
            </mesh>
            {/* Positive terminal cap */}
            <mesh position={[bLen / 2 + 0.016, BODY_Y_OFFSET, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[r * 0.32, r * 0.32, 0.032, 12]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Negative terminal cap */}
            <mesh position={[-(bLen / 2 + 0.008), BODY_Y_OFFSET, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[r, r, 0.016, 20]} />
                <meshStandardMaterial color="#6b7280" metalness={0.9} roughness={0.2} />
            </mesh>

            {/*
             * Pins: placed at ±(widthCols/2 - 0.5) * PITCH in X so they land in the
             * two anchor holes.  They drop from BOARD_Y_OFFSET to below the board.
             */}
            {([-1, 1] as const).map((side, i) => {
                const pinX = side * (w / 2 - PITCH * 0.5);
                return (
                    <mesh key={i} position={[pinX, (BODY_Y_OFFSET - PIN_L) / 2, 0]}>
                        <cylinderGeometry args={[PIN_R, PIN_R, BODY_Y_OFFSET + PIN_L, 6]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
                    </mesh>
                );
            })}
        </group>
    );
}

// ─── SWITCH ──────────────────────────────────────────────────────────────────
function SwitchBody({ w, d }: { w: number; d: number }) {
    const h = 0.14, PIN_R = 0.009, LEG_L = 0.14;
    return (
        <group>
            <mesh position={[0, h / 2, 0]}>
                <boxGeometry args={[w * 0.85, h, d * 0.75]} />
                <meshPhysicalMaterial color="#1e293b" roughness={0.4} metalness={0.35} reflectivity={0.6} />
            </mesh>
            <mesh position={[-w * 0.12, h + 0.045, 0]}>
                <boxGeometry args={[w * 0.28, h * 0.55, d * 0.42]} />
                <meshStandardMaterial color="#475569" roughness={0.3} />
            </mesh>
            {([-w * 0.3, w * 0.3] as const).map((ox, i) => (
                <mesh key={i} position={[ox, -LEG_L / 2, 0]}>
                    <cylinderGeometry args={[PIN_R, PIN_R, LEG_L, 6]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
                </mesh>
            ))}
        </group>
    );
}

// ─── NodeMCU / ESP32 ─────────────────────────────────────────────────────────
function MCUBody({ w }: { w: number }) {
    const PCB_H = 0.032, PIN_COUNT = 15, LEG_L = 0.14, PIN_R = 0.008;
    const E_Z = ROW_Z.E - TRENCH_Z_MID;
    const F_Z = ROW_Z.F - TRENCH_Z_MID;
    const bodyD = F_Z - E_Z;
    const pinXs = Array.from({ length: PIN_COUNT }, (_, i) => -w / 2 + PITCH / 2 + i * PITCH);

    return (
        <group>
            <mesh position={[0, PCB_H / 2, 0]}>
                <boxGeometry args={[w, PCB_H, bodyD * 0.78]} />
                <meshStandardMaterial color="#065f46" roughness={0.7} metalness={0.1} />
            </mesh>
            <mesh position={[0, PCB_H + 0.052, 0]}>
                <boxGeometry args={[w * 0.42, 0.052, bodyD * 0.42]} />
                <meshStandardMaterial color="#111" roughness={0.45} metalness={0.2} />
            </mesh>
            {pinXs.map((px, i) => (
                <group key={i}>
                    {[E_Z - PITCH * 0.5, F_Z + PITCH * 0.5].map((pz, j) => (
                        <group key={j}>
                            <mesh position={[px, PCB_H + 0.018, pz]}>
                                <boxGeometry args={[0.018, 0.036, 0.018]} />
                                <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.15} />
                            </mesh>
                            <mesh position={[px, -LEG_L / 2, pz]}>
                                <cylinderGeometry args={[PIN_R, PIN_R, LEG_L, 4]} />
                                <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
                            </mesh>
                        </group>
                    ))}
                </group>
            ))}
        </group>
    );
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────
function ComponentBody({ component }: { component: any }) {
    const libDef = COMPONENT_LIBRARY[component.type];
    const anchorHole = (component.pins?.anchor ?? component.anchorHole ?? 'E30') as string;

    if (!libDef) return null;

    const w = libDef.widthCols * PITCH;
    const d = libDef.heightRows * PITCH;

    let cx: number, cz: number;

    if (libDef.mustCrossTrench) {
        [cx, cz] = icCenterFromAnchor(anchorHole, libDef.widthCols);
    } else {
        const anchor = getHolePos(anchorHole);
        cx = anchor.x + ((libDef.widthCols - 1) / 2) * PITCH;
        cz = anchor.z + ((libDef.heightRows - 1) / 2) * PITCH;
    }

    let body: JSX.Element;
    switch (component.type) {
        case 'LED': body = <LEDBody ledColor="#ef4444" />; break;
        case 'RESISTOR': body = <ResistorBody w={w} widthCols={libDef.widthCols} />; break;
        case 'BATTERY': body = <BatteryBody w={w} />; break;
        case 'SWITCH': body = <SwitchBody w={w} d={d} />; break;
        case 'CAPACITOR': body = <CapacitorBody />; break;
        case 'TRANSISTOR': body = <TransistorBody />; break;
        case 'NODEMCU_ESP32': body = <MCUBody w={w} />; break;
        case 'DIP8_IC':
        default: body = <DIPICBody w={w} pinCount={libDef.widthCols} />;
    }

    return (
        <group position={[cx, BOARD_Y, cz]}>
            {body}
        </group>
    );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function ComponentsOnBoard() {
    const components = usePhysicsStore((state: any) => state.components);
    if (!components || components.length === 0) return null;
    return (
        <group>
            {components.map((c: any) => (
                <ComponentBody key={c.id} component={c} />
            ))}
        </group>
    );
}
