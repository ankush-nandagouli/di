/**
 * Procedural sample Wavefront .obj model generators for testing and previewing 3D art
 */

export interface Sample3DModel {
  id: string;
  name: string;
  description: string;
  generateObj: () => string;
}

export const SAMPLE_3D_MODELS: Sample3DModel[] = [
  {
    id: 'quantum_core',
    name: 'Quantum Geodesic Core',
    description: 'High-precision icosahedral energy node with 12 vertices and 20 gold/cyan facets.',
    generateObj: () => {
      const phi = (1 + Math.sqrt(5)) / 2;
      return `# Dakshyam Quantum Geodesic Core OBJ
o QuantumCore
v -1  ${phi.toFixed(4)}  0
v  1  ${phi.toFixed(4)}  0
v -1 -${phi.toFixed(4)}  0
v  1 -${phi.toFixed(4)}  0
v  0 -1  ${phi.toFixed(4)}
v  0  1  ${phi.toFixed(4)}
v  0 -1 -${phi.toFixed(4)}
v  0  1 -${phi.toFixed(4)}
v  ${phi.toFixed(4)}  0 -1
v  ${phi.toFixed(4)}  0  1
v -${phi.toFixed(4)}  0 -1
v -${phi.toFixed(4)}  0  1
vn 0 0 1
vn 0 1 0
vn 1 0 0
f 1//1 12//1 6//1
f 1//1 6//1 2//1
f 1//1 2//1 8//1
f 1//1 8//1 11//1
f 1//1 11//1 12//1
f 2//2 6//2 10//2
f 6//2 12//2 5//2
f 12//2 11//2 3//2
f 11//2 8//2 7//2
f 8//2 2//2 9//2
f 4//3 10//3 5//3
f 4//3 5//3 3//3
f 4//3 3//3 7//3
f 4//3 7//3 9//3
f 4//3 9//3 10//3
f 5//1 10//1 6//1
f 3//1 5//1 12//1
f 7//2 3//2 11//2
f 9//2 7//2 8//2
f 10//3 9//3 2//3
`;
    }
  },
  {
    id: 'robotic_hub',
    name: 'Robotics Satellite Hub',
    description: 'Dual-octahedral mechanical array with central sensor core and sensor rings.',
    generateObj: () => {
      return `# Dakshyam Robotics Satellite Hub OBJ
o RoboticsHub
# Central core
v 0 2 0
v 1.5 0 1.5
v -1.5 0 1.5
v -1.5 0 -1.5
v 1.5 0 -1.5
v 0 -2 0
# Outer sensory nodes
v 2.8 0 0
v 0 0 2.8
v -2.8 0 0
v 0 0 -2.8
v 0 2.8 0
v 0 -2.8 0
vn 0 1 0
vn 0 -1 0
f 1 2 3
f 1 3 4
f 1 4 5
f 1 5 2
f 6 3 2
f 6 4 3
f 6 5 4
f 6 2 5
# Sensor linkages
f 11 7 2
f 11 8 3
f 11 9 4
f 11 10 5
f 12 2 7
f 12 3 8
f 12 4 9
f 12 5 10
`;
    }
  },
  {
    id: 'cyber_drone',
    name: 'Stealth Aero Turbine',
    description: 'Hexagonal aerospace drone turbine intake with aerodynamic canted fins.',
    generateObj: () => {
      const sides = 8;
      const r1 = 2.2;
      const r2 = 1.0;
      const h = 1.6;
      let out = `# Dakshyam Stealth Aero Turbine OBJ\no TurbineDrone\n`;
      // Outer front ring
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        out += `v ${(Math.cos(a) * r1).toFixed(4)} ${(Math.sin(a) * r1).toFixed(4)} ${(h / 2).toFixed(4)}\n`;
      }
      // Outer back ring
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        out += `v ${(Math.cos(a) * r1).toFixed(4)} ${(Math.sin(a) * r1).toFixed(4)} ${(-h / 2).toFixed(4)}\n`;
      }
      // Inner hub
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        out += `v ${(Math.cos(a) * r2).toFixed(4)} ${(Math.sin(a) * r2).toFixed(4)} 0\n`;
      }
      // Front cap apex
      out += `v 0 0 ${(h * 0.8).toFixed(4)}\n`;
      out += `v 0 0 ${(-h * 0.8).toFixed(4)}\n`;
      
      const apexFront = sides * 3 + 1;
      const apexBack = sides * 3 + 2;

      // Outer hull faces
      for (let i = 1; i <= sides; i++) {
        const next = i === sides ? 1 : i + 1;
        out += `f ${i} ${next} ${sides + next} ${sides + i}\n`;
      }
      // Turbine spokes to inner hub
      for (let i = 1; i <= sides; i++) {
        const next = i === sides ? 1 : i + 1;
        const hubIdx = sides * 2 + i;
        const nextHub = sides * 2 + next;
        out += `f ${i} ${hubIdx} ${nextHub} ${next}\n`;
        out += `f ${hubIdx} ${apexFront} ${nextHub}\n`;
        out += `f ${sides + i} ${nextHub} ${apexBack}\n`;
      }
      return out;
    }
  }
];
