
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PoseData } from '../types';
import { RefreshCw, Check, MousePointer2, Move, Layers } from 'lucide-react';

interface MannequinPoseProps {
  pose: PoseData;
  onChange: (pose: PoseData) => void;
}

const MannequinPose: React.FC<MannequinPoseProps> = ({ pose, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mannequinGroupRef = useRef<THREE.Group | null>(null);
  
  const [selectedJoint, setSelectedJoint] = useState<string | null>(null);
  const jointsRef = useRef<{ [key: string]: THREE.Object3D }>({});
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // 專業體塊材質
  const blockMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: 0x00d9ff, 
    transparent: true, 
    opacity: 0.6,
    emissive: 0x004455,
    emissiveIntensity: 0.5,
    flatShading: true,
    metalness: 0.5,
    roughness: 0.2
  }), []);

  const selectedMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: 0xfff000, 
    transparent: false, 
    opacity: 1,
    emissive: 0xffaa00,
    emissiveIntensity: 0.8,
    flatShading: true
  }), []);

  const updateJointRotationState = (jointName: string, rotation: THREE.Euler) => {
    const currentBones = { ...pose.bones };
    currentBones[jointName] = { x: rotation.x, y: rotation.y, z: rotation.z };
    onChange({ ...pose, bones: currentBones });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030508);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.4, 3.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const topLight = new THREE.DirectionalLight(0xffffff, 1);
    topLight.position.set(5, 10, 5);
    scene.add(topLight);

    const mannequin = new THREE.Group();
    mannequinGroupRef.current = mannequin;

    const createBodyPart = (name: string, geometry: THREE.BufferGeometry, position: [number, number, number], parent?: THREE.Object3D) => {
      const group = new THREE.Group();
      group.name = name;
      group.position.set(...position);
      const mesh = new THREE.Mesh(geometry, blockMaterial.clone());
      mesh.name = name + '_mesh';
      const edgeGeo = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 }));
      group.add(mesh);
      group.add(line);
      if (parent) parent.add(group);
      else mannequin.add(group);
      jointsRef.current[name] = group;
      return group;
    };

    const pelvis = createBodyPart('pelvis', new THREE.BoxGeometry(0.38, 0.22, 0.24), [0, 0.9, 0]);
    const torso = createBodyPart('torso', new THREE.BoxGeometry(0.42, 0.55, 0.22), [0, 0.4, 0], pelvis);
    const head = createBodyPart('head', new THREE.BoxGeometry(0.2, 0.26, 0.2), [0, 0.45, 0], torso);
    const uArmL = createBodyPart('uArmL', new THREE.BoxGeometry(0.12, 0.38, 0.12), [-0.28, 0.2, 0], torso);
    const lArmL = createBodyPart('lArmL', new THREE.BoxGeometry(0.1, 0.35, 0.1), [0, -0.38, 0], uArmL);
    const uArmR = createBodyPart('uArmR', new THREE.BoxGeometry(0.12, 0.38, 0.12), [0.28, 0.2, 0], torso);
    const lArmR = createBodyPart('lArmR', new THREE.BoxGeometry(0.1, 0.35, 0.1), [0, -0.38, 0], uArmR);
    const uLegL = createBodyPart('uLegL', new THREE.BoxGeometry(0.18, 0.48, 0.18), [-0.14, -0.35, 0], pelvis);
    const lLegL = createBodyPart('lLegL', new THREE.BoxGeometry(0.14, 0.45, 0.14), [0, -0.48, 0], uLegL);
    const uLegR = createBodyPart('uLegR', new THREE.BoxGeometry(0.18, 0.48, 0.18), [0.14, -0.35, 0], pelvis);
    const lLegR = createBodyPart('lLegR', new THREE.BoxGeometry(0.14, 0.45, 0.14), [0, -0.48, 0], uLegR);

    scene.add(mannequin);
    const grid = new THREE.GridHelper(20, 40, 0x003344, 0x010508);
    scene.add(grid);

    const animate = () => {
      const frameId = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      return frameId;
    };
    const frameId = animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) rendererRef.current.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!cameraRef.current || !mannequinGroupRef.current) return;
      const rect = containerRef.current!.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(mannequinGroupRef.current.children, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !jointsRef.current[obj.name.replace('_mesh', '')]) obj = obj.parent;
        const name = obj.name.replace('_mesh', '');
        if (jointsRef.current[name]) {
          setSelectedJoint(name);
          isDraggingRef.current = true;
          previousMousePosition.current = { x: event.clientX, y: event.clientY };
          controlsRef.current!.enabled = false;
          return;
        }
      }
      setSelectedJoint(null);
      controlsRef.current!.enabled = true;
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current || !selectedJoint) return;
      const deltaX = event.clientX - previousMousePosition.current.x;
      const deltaY = event.clientY - previousMousePosition.current.y;
      const sensitivity = 0.012;
      const bone = jointsRef.current[selectedJoint];
      if (bone) {
        bone.rotation.x += deltaY * sensitivity;
        bone.rotation.y += deltaX * sensitivity;
      }
      previousMousePosition.current = { x: event.clientX, y: event.clientY };
    };
    const handlePointerUp = () => {
      if (isDraggingRef.current && selectedJoint) {
        const bone = jointsRef.current[selectedJoint];
        if (bone) updateJointRotationState(selectedJoint, bone.rotation);
      }
      isDraggingRef.current = false;
    };
    const el = containerRef.current;
    el.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [selectedJoint, pose]);

  useEffect(() => {
    Object.entries(jointsRef.current).forEach(([name, group]) => {
      const g = group as THREE.Object3D;
      const mesh = g.children.find(c => c.name.includes('_mesh')) as THREE.Mesh;
      if (mesh) (mesh.material as THREE.MeshStandardMaterial).copy(name === selectedJoint ? selectedMaterial : blockMaterial);
    });
    if (mannequinGroupRef.current) mannequinGroupRef.current.rotation.y = pose.rotation.y;
    Object.entries(pose.bones).forEach(([name, rot]) => {
      const bone = jointsRef.current[name];
      if (bone && !isDraggingRef.current) {
        const r = rot as { x: number; y: number; z: number };
        bone.rotation.set(r.x, r.y, r.z);
      }
    });
    if (cameraRef.current && cameraRef.current.fov !== pose.perspective) {
      cameraRef.current.fov = pose.perspective;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [selectedJoint, pose]);

  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      <div className="flex-1 overflow-hidden touch-none" ref={containerRef} />
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
        <div className="bg-black/60 backdrop-blur-3xl px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-4 shadow-2xl">
          {selectedJoint ? (
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] leading-none">Posing</span>
                <span className="text-sm text-yellow-400 font-black uppercase mt-1">{selectedJoint}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <MousePointer2 size={16} className="text-cyan-400" />
              <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">Select block to pose</span>
            </div>
          )}
        </div>
        <button onClick={() => onChange({ ...pose, rotation: {x:0, y:0, z:0}, bones: {} })} className="pointer-events-auto w-12 h-12 bg-zinc-900/90 rounded-2xl border border-white/10 flex items-center justify-center text-zinc-400 active:rotate-180 transition-all shadow-xl">
          <RefreshCw size={20} />
        </button>
      </div>
      <div className="p-8 bg-zinc-950 border-t border-white/5 space-y-8 shrink-0">
        {selectedJoint ? (
          <div className="flex justify-between items-center h-14 animate-in slide-in-from-bottom-4 duration-300">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                 <Move size={20} className="text-yellow-400" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] text-yellow-400/80 font-black uppercase tracking-widest">DRAG SCREEN</span>
                 <span className="text-[9px] text-zinc-600 font-bold uppercase">To rotate limb</span>
               </div>
             </div>
             <button onClick={() => { setSelectedJoint(null); if (controlsRef.current) controlsRef.current.enabled = true; }} className="px-10 py-4 bg-yellow-400 text-black rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-[0_10px_20px_rgba(250,204,21,0.2)]">
               <Check size={18} className="inline mr-2" /> Done
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-10 py-2">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest flex items-center gap-2"><RefreshCw size={10} /> Body Spin</label>
                <span className="text-[10px] text-zinc-400 font-mono">{Math.round((pose.rotation.y * 180) / Math.PI)}°</span>
              </div>
              <input type="range" min="-3.14" max="3.14" step="0.01" value={pose.rotation.y} onChange={(e) => onChange({...pose, rotation: {...pose.rotation, y: parseFloat(e.target.value)}})} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest flex items-center gap-2"><Layers size={10} /> Lens Angle</label>
                <span className="text-[10px] text-zinc-400 font-mono">{pose.perspective}mm</span>
              </div>
              <input type="range" min="30" max="110" step="1" value={pose.perspective} onChange={(e) => onChange({...pose, perspective: parseInt(e.target.value)})} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MannequinPose;
