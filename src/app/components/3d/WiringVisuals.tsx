import { useMemo } from 'react';
import * as THREE from 'three';
import { usePhysicsStore } from '../../../store/physicsStore';
import { ROW_Z } from './RealisticBreadboard';

const PITCH = 0.254;
const COLS = 60;

function getHoleCoordinates(holeId: string): THREE.Vector3 {
    const sig = holeId.match(/^([A-J])(\d+)$/);
    if (sig) {
        const col = parseInt(sig[2], 10);
        const x = (col - 1 - COLS / 2) * PITCH;
        const z = ROW_Z[sig[1]] ?? 0;
        return new THREE.Vector3(x, 0.055, z);
    }
    const rail = holeId.match(/^RAIL_(VCC|GND)_(L|R)_(\d+)$/);
    if (rail) {
        const isVcc = rail[1] === 'VCC';
        const isLeft = rail[2] === 'L';
        const col = parseInt(rail[3], 10);
        const x = (col - 1 - COLS / 2) * PITCH;
        const z = isLeft
            ? (isVcc ? -PITCH * 8 : -PITCH * 7)
            : (isVcc ? PITCH * 7.5 : PITCH * 8.5);
        return new THREE.Vector3(x, 0.055, z);
    }
    return new THREE.Vector3(0, 0.055, 0);
}

/** Shared material cache — one material per hex colour string */
const _matCache: Record<string, THREE.MeshStandardMaterial> = {};
function getWireMat(color: string): THREE.MeshStandardMaterial {
    if (!_matCache[color]) {
        _matCache[color] = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.35,
            metalness: 0.05,
            emissive: color,
            emissiveIntensity: 0.18,
        });
    }
    return _matCache[color];
}

/**
 * Build a Manhattan-routed wire with strict 90° bends.
 *
 * Each wire gets a GLOBAL slot index → unique elevation band so wires
 * at the same path never clip through each other.
 * A small lateral jitter (±0…±0.02) spreads co-located wires sideways.
 */
function buildWireGeometry(
    source: string,
    dest: string,
    slotIndex: number
): THREE.BufferGeometry {
    const s = getHoleCoordinates(source);
    const e = getHoleCoordinates(dest);

    // ── unique elevation for this wire ──────────────────────────────
    const BASE_ELEV = 0.22;
    const SLOT_H = 0.065;           // height step per slot
    const elev = BASE_ELEV + slotIndex * SLOT_H;

    // ── small lateral spread to untangle co-routed pairs ──────────
    const lateralSlot = slotIndex % 5 - 2;           // –2..+2
    const xSpread = lateralSlot * 0.011;          // –0.022..+0.022
    const zSpread = (slotIndex % 3 - 1) * 0.009; // –0.009..+0.009

    // ── 90-degree Manhattan path:  UP → X → Z → DOWN ─────────────
    const p0 = s.clone();
    const p1 = new THREE.Vector3(s.x + xSpread, elev, s.z + zSpread);
    const p2 = new THREE.Vector3(e.x + xSpread, elev, s.z + zSpread); // X leg
    const p3 = new THREE.Vector3(e.x + xSpread, elev, e.z + zSpread); // Z leg
    const p4 = e.clone();

    const path = new THREE.CurvePath<THREE.Vector3>();
    const seg = (a: THREE.Vector3, b: THREE.Vector3) => {
        if (a.distanceTo(b) > 0.003) path.add(new THREE.LineCurve3(a, b));
    };
    seg(p0, p1);
    seg(p1, p2);
    seg(p2, p3);
    seg(p3, p4);

    // 12 path samples, 5 radial segments — light geometry
    return new THREE.TubeGeometry(path, 12, 0.022, 5, false);
}

function Wire({ source, dest, color, slotIndex }: {
    source: string; dest: string; color: string; slotIndex: number;
}) {
    const geo = useMemo(
        () => buildWireGeometry(source, dest, slotIndex),
        [source, dest, slotIndex]
    );
    return <mesh geometry={geo} material={getWireMat(color)} />;
}

export function WiringVisuals() {
    const wires = usePhysicsStore(state => state.wires);

    // ── Each wire gets its own GLOBAL slot index ─────────────────────
    // This guarantees every wire has a unique elevation even when
    // src/dest coincide with another wire.
    const resolveColor = (wire: any): string => {
        if (wire.source?.includes('VCC') || wire.dest?.includes('VCC')) return '#ef4444';
        if (wire.source?.includes('GND') || wire.dest?.includes('GND')) return '#3b82f6';
        return wire.color || '#10b981';
    };

    return (
        <group>
            {wires.map((wire: any, idx: number) => (
                <Wire
                    key={wire.id}
                    source={wire.source}
                    dest={wire.dest}
                    color={resolveColor(wire)}
                    slotIndex={idx}   // ← global index = unique slot guaranteed
                />
            ))}
        </group>
    );
}
