// LotusSeaCanvas.tsx
'use client';

import React, { useRef, useMemo, useState, useCallback, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { CameraControls, Sparkles, QuadraticBezierLine } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import {
  MeshPhysicalMaterial,
  PlaneGeometry,
  DoubleSide,
  Vector3,
  AdditiveBlending,
  Color,
  RepeatWrapping,
  LinearFilter,
  ShaderMaterial,
} from 'three';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useCanvasVisibility } from '@/hooks/useCanvasVisibility';
import { applyInkWaterShader } from './shaders/InkWaterShader';
import ProceduralLamp, { createLotusPetalsGeometry } from './ProceduralLamp';
import Ripple from './Ripple';
import IonSun from './IonSun';

// 分辨率半载与四分之一载降级常量 (遵循 Postprocessing 规范)
export const Resolution = {
  FULL: 1.0,
  HALF: 0.5,
  QUARTER: 0.25,
} as const;

// ==================== 类型定义 ====================
export interface LampData {
  id: string;
  userId: string;
  userName: string;
  position: [number, number, number];
  message: string;
  prayerCount: number;
  dedications: number; // 保持向后兼容
}

// 身份权限定义
export type UserRoleType =
  | '理事'
  | '学长姐'
  | '学员'
  | 'admin'
  | 'presidency'
  | 'committee'
  | 'member'
  | string;

export const isInnerCirclePermitted = (role?: string): boolean => {
  if (!role) return false;
  return ['理事', '学长姐', 'committee', 'presidency', 'admin'].includes(role);
};

// 双圈规则：内圈 (0 ~ 8) 仅限理事与学长姐，外圈 (8 ~ 30) 全员可放
const INNER_RADIUS = 8;
const OUTER_RADIUS = 30;

// ==================== 工具函数 ====================
// 程序化生成水墨法线贴图（柔和水波纹）
const createInkNormalMap = (): THREE.Texture => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 100; i++) {
    ctx.strokeStyle = `rgba(${Math.random() * 255},${Math.random() * 255},255,0.05)`;
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.beginPath();
    const x0 = Math.random() * size;
    const y0 = Math.random() * size;
    ctx.moveTo(x0, y0);
    for (let s = 0; s < 8; s++) {
      ctx.lineTo(
        x0 + (Math.random() - 0.5) * size * 0.3,
        y0 + (Math.random() - 0.5) * size * 0.3
      );
    }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
};

// ==================== 水面组件 ====================
interface InkWaterProps {
  size?: number;
  segments?: number;
  onWaterPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onWaterMove?: (point: THREE.Vector3 | null) => void;
  isPlacementMode: boolean;
}

const InkWater: React.FC<InkWaterProps> = ({
  size = 100,
  segments = 160,
  onWaterPointerDown,
  onWaterMove,
  isPlacementMode,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<PlaneGeometry>(null);
  const normalMap = useMemo(() => createInkNormalMap(), []);
  const uniformsRef = useRef({ uTime: { value: 0 } });

  const waterMaterial = useMemo(() => {
    const mat = new MeshPhysicalMaterial({
      color: '#000000',
      metalness: 0.7,
      roughness: 0.2,
      side: DoubleSide,
      envMapIntensity: 1.2,
      clearcoat: 0.3,
      clearcoatRoughness: 0.1,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.3, 0.3),
    });
    applyInkWaterShader(mat, uniformsRef.current);
    return mat;
  }, [normalMap]);

  // 波浪顶点动态动画：完全卸载至 GPU 顶点着色器，消除每帧 25,921 次 CPU 循环与 77,000 次 Math.sin() 计算
  useFrame(({ clock }) => {
    uniformsRef.current.uTime.value = clock.elapsedTime;
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isPlacementMode && onWaterMove) {
      onWaterMove(e.point);
    }
  };

  const handlePointerOut = () => {
    if (onWaterMove) onWaterMove(null);
  };

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      material={waterMaterial}
      onPointerDown={onWaterPointerDown}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <planeGeometry ref={geometryRef} args={[size, size, segments, segments]} />
    </mesh>
  );
};

// ==================== 双圈结界 ====================
const ConcentricRings: React.FC = () => {
  const ringData = [
    { inner: 0, outer: INNER_RADIUS, color: '#FBBF24', opacity: 0.22 }, // 内圈：理事/学长姐专属
    { inner: INNER_RADIUS, outer: OUTER_RADIUS, color: '#F59E0B', opacity: 0.12 }, // 外圈：全员可放
  ];

  return (
    <group position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {ringData.map((ring, i) => (
        <mesh key={i}>
          <ringGeometry args={[ring.inner, ring.outer, 128]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity}
            side={DoubleSide}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
      {/* 内圈专属分界发光金环 */}
      <mesh>
        <ringGeometry args={[INNER_RADIUS - 0.08, INNER_RADIUS + 0.08, 128]} />
        <meshBasicMaterial
          color="#FDE68A"
          transparent
          opacity={0.45}
          side={DoubleSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// ==================== 边界粒子 ====================
const GlowBoundary: React.FC<{ radius?: number; count?: number }> = ({
  radius = OUTER_RADIUS,
  count = 600,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.5;
      arr[i * 3] = Math.cos(angle) * (radius + jitter);
      arr[i * 3 + 1] = 0.1 + Math.random() * 0.3;
      arr[i * 3 + 2] = Math.sin(angle) * (radius + jitter);
    }
    return arr;
  }, [count, radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  const shaderMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColorA: { value: new Color('#4ade80') },
          uColorB: { value: new Color('#60a5fa') },
          uColorC: { value: new Color('#c084fc') },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 3.0;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;
          varying vec2 vUv;
          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
            float t = sin(uTime * 0.5 + gl_PointCoord.x * 3.0) * 0.5 + 0.5;
            vec3 color = mix(uColorA, uColorB, t);
            color = mix(color, uColorC, sin(uTime * 0.3 + gl_PointCoord.y) * 0.5 + 0.5);
            gl_FragColor = vec4(color, alpha * 0.8);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />;
};

// ==================== 放置预览灯（盛开莲花灯） ====================
const PreviewLamp: React.FC<{ position: [number, number, number] | null }> = ({ position }) => {
  const lotusGeometry = useMemo(() => createLotusPetalsGeometry(), []);

  if (!position) return null;
  return (
    <group position={position} scale={0.9}>
      <mesh geometry={lotusGeometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.35}
          metalness={0.1}
          side={DoubleSide}
          transparent
          opacity={0.7}
          emissive="#ff5500"
          emissiveIntensity={1.8}
        />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <coneGeometry args={[0.13, 0.44, 8]} />
        <meshStandardMaterial
          color="#fffbe6"
          emissive="#ffaa00"
          emissiveIntensity={3.5}
          transparent
          opacity={0.85}
        />
      </mesh>
      <pointLight color="#ff8833" intensity={2.5} distance={6} position={[0, 0.3, 0]} />
    </group>
  );
};

// ==================== 莲花灯神经网络光纤连接（因陀罗网 · 万灯交织） ====================
interface NeuralConnectionsProps {
  lamps: LampData[];
  isMobile?: boolean;
}

const NeuralConnections: React.FC<NeuralConnectionsProps> = ({ lamps, isMobile = false }) => {
  const connections = useMemo(() => {
    const list: {
      start: [number, number, number];
      end: [number, number, number];
      mid: [number, number, number];
    }[] = [];

    // 全量互联：每盏莲花与其他所有莲花彼此相连，构成重重无尽的因陀罗网
    for (let i = 0; i < lamps.length; i++) {
      for (let j = i + 1; j < lamps.length; j++) {
        const p1 = lamps[i].position;
        const p2 = lamps[j].position;
        const dist = Math.hypot(p1[0] - p2[0], p1[2] - p2[2]);

        // 动态拱高：随两灯跨度延展，最高 2.6；加入微小算法错落偏移，避免多条光缆在空中平面重叠
        const baseHeight = Math.min(dist * 0.16, 2.6);
        const stagger = ((i * 7 + j * 13) % 5) * 0.12 - 0.24;
        const arcHeight = Math.max(0.65, baseHeight + stagger);
        const midY = Math.max(p1[1], p2[1]) + 0.3 + arcHeight;

        list.push({
          start: [p1[0], p1[1] + 0.3, p1[2]],
          end: [p2[0], p2[1] + 0.3, p2[2]],
          mid: [(p1[0] + p2[0]) / 2, midY, (p1[2] + p2[2]) / 2],
        });
      }
    }

    return list;
  }, [lamps]);

  return (
    <group>
      {connections.map((conn, i) => (
        <QuadraticBezierLine
          key={i}
          start={conn.start}
          end={conn.end}
          mid={conn.mid}
          color="#ffaa44"
          lineWidth={isMobile ? 1.0 : 1.3}
          transparent
          opacity={0.65}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      ))}
    </group>
  );
};

// ==================== 主 3D 场景 ====================
interface LampSceneProps {
  isPlacementMode: boolean;
  setIsPlacementMode: (val: boolean) => void;
  isZoomed: boolean;
  setIsZoomed: (val: boolean) => void;
  lamps: LampData[];
  setLamps: React.Dispatch<React.SetStateAction<LampData[]>>;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: UserRoleType;
  onPlaceLamp?: (pos?: [number, number, number]) => void;
  onDedicate?: (lampId?: string) => void;
  onLimitReached?: (msg?: string) => void;
  cameraControlsRef: React.RefObject<CameraControls | null>;
  handlePray: (lampId: string) => void;
  isMobile?: boolean;
}

const LampScene: React.FC<LampSceneProps> = ({
  isPlacementMode,
  setIsPlacementMode,
  isZoomed,
  setIsZoomed,
  lamps,
  setLamps,
  currentUserId,
  currentUserName,
  currentUserRole,
  onPlaceLamp,
  onLimitReached,
  cameraControlsRef,
  handlePray,
  isMobile = false,
}) => {
  const { camera } = useThree();
  const [ripples, setRipples] = useState<{ id: string; position: [number, number, number] }[]>([]);
  const [previewPos, setPreviewPos] = useState<[number, number, number] | null>(null);
  const [nearIds, setNearIds] = useState<Set<string>>(new Set());
  const [nearTextIds, setNearTextIds] = useState<Set<string>>(new Set());
  const lastLightUpdateRef = useRef(0);

  // 移动端兼容的双击判定引用（连续两次 onPointerDown 时间差与位移）
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const placementTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 挂载时配置初始默认视角并持久化保存为重置锚点 (saveState)
  const handleControlsRef = useCallback(
    (controls: CameraControls | null) => {
      cameraControlsRef.current = controls;
      if (controls) {
        if (isMobile) {
          // 移动端黄金纵向画幅：适度拉近视角，让莲池与同修心灯清晰呈现
          controls.setLookAt(0, 10.5, 22, 0, 1.8, -3, false);
        } else {
          controls.setLookAt(0, 10, 18, 0, 0, 0, false);
        }
        controls.saveState();
      }
    },
    [cameraControlsRef, isMobile]
  );

  // 监听设备切换或屏幕方向自适应更新视角锚点
  useEffect(() => {
    if (cameraControlsRef.current && !isZoomed) {
      if (isMobile) {
        cameraControlsRef.current.setLookAt(0, 10.5, 22, 0, 1.8, -3, false);
      } else {
        cameraControlsRef.current.setLookAt(0, 10, 18, 0, 0, 0, false);
      }
      cameraControlsRef.current.saveState();
    }
  }, [isMobile, isZoomed, cameraControlsRef]);

  // 光源与 3D 文字动态视距裁剪（LOD）：每 0.5 秒计算最近的心灯
  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (now - lastLightUpdateRef.current > 0.5) {
      lastLightUpdateRef.current = now;
      const distances = lamps.map((lamp) => ({
        id: lamp.id,
        userId: lamp.userId,
        dist: new Vector3(...lamp.position).distanceTo(camera.position),
      }));
      distances.sort((a, b) => a.dist - b.dist);

      // 点光源裁剪：移动端仅开启最近 3 盏灯，桌面端 8 盏
      const maxLights = isMobile ? 3 : 8;
      const nearestLights = distances.slice(0, maxLights).map((d) => d.id);
      const newLightSet = new Set(nearestLights);
      setNearIds((prev) => {
        if (prev.size !== newLightSet.size || [...prev].some((id) => !newLightSet.has(id))) {
          return newLightSet;
        }
        return prev;
      });

      // 3D 文字裁剪（LOD）：移动端视距扩大至 34，最大渲染 12 盏，保证全池主要心灯均能清晰显示
      const maxText = isMobile ? 12 : 25;
      const maxTextDist = isMobile ? 34 : 38;
      const nearestText = distances
        .filter((d) => d.dist < maxTextDist || d.userId === currentUserId)
        .slice(0, maxText)
        .map((d) => d.id);
      // 保证用户自己的灯始终有文字
      const ownLamp = lamps.find((l) => l.userId === currentUserId);
      if (ownLamp && !nearestText.includes(ownLamp.id)) {
        nearestText.push(ownLamp.id);
      }
      const newTextSet = new Set(nearestText);
      setNearTextIds((prev) => {
        if (prev.size !== newTextSet.size || [...prev].some((id) => !newTextSet.has(id))) {
          return newTextSet;
        }
        return prev;
      });
    }
  });

  // 结界权限判定：内圈 (0 ~ 8) 仅限理事与学长姐供灯，外圈 (8 ~ 30) 全体同修皆可供灯
  const checkPlacementAllowed = useCallback(
    (distance: number): boolean => {
      const canAccessInner = isInnerCirclePermitted(currentUserRole);
      if (!canAccessInner) {
        return distance >= INNER_RADIUS && distance <= OUTER_RADIUS;
      }
      return distance <= OUTER_RADIUS;
    },
    [currentUserRole]
  );

  /**
   * 模块二：单人单灯限制与供灯逻辑
   */
  const handlePlaceLampAt = useCallback(
    async (point: THREE.Vector3) => {
      const distance = Math.hypot(point.x, point.z);
      const canAccessInner = isInnerCirclePermitted(currentUserRole);
      if (!checkPlacementAllowed(distance)) {
        if (!canAccessInner && distance < INNER_RADIUS) {
          toast.warning(
            '🪷 莲花灯光环内圈仅限【理事】和【学长姐】供奉，学员请在光环外圈供灯（距离中心 8 ~ 30）',
            { duration: 4500 }
          );
        } else {
          toast.warning('请在道场光环结界内供奉心灯（距离中心不超过 30）');
        }
        return;
      }

      // 前端拦截：遍历现有 lamps 状态，若已存在当前同修的莲灯，阻断操作并弹出全局 Toast 提示
      const userAlreadyHasLamp = lamps.some(
        (lamp) => lamp.userId === currentUserId || (currentUserName && currentUserName !== '同修' && lamp.userName === currentUserName)
      );
      if (userAlreadyHasLamp) {
        setIsPlacementMode(false);
        if (onLimitReached) {
          onLimitReached('每位同修仅限供奉一盏莲灯');
        } else {
          toast.warning('每位同修仅限供奉一盏莲灯', {
            icon: '🪷',
            duration: 3500,
          });
        }
        return;
      }

      const pos: [number, number, number] = [point.x, 0, point.z];

      try {
        const res = await fetch('/api/lamps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            userName: currentUserName,
            position: pos,
            message: '愿平安吉祥',
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || '供奉莲灯失败';
          toast.error(errMsg);
          return;
        }

        const newLamp = await res.json();
        setLamps((prev) => [
          ...prev,
          {
            id: newLamp.id,
            userId: newLamp.userId,
            userName: newLamp.userName || currentUserName,
            position: [newLamp.posX, newLamp.posY, newLamp.posZ],
            message: newLamp.message || '愿平安吉祥',
            prayerCount: newLamp.prayerCount || 0,
            dedications: newLamp.prayerCount || 0,
          },
        ]);
        setRipples((prev) => [...prev, { id: `ripple-${Date.now()}`, position: pos }]);
        if (onPlaceLamp) {
          onPlaceLamp(pos);
        } else {
          toast.success('已供上一盏心灯，愿光明常驻', { icon: '🪷' });
        }
        setIsPlacementMode(false);
      } catch (err) {
        console.error('供灯请求失败', err);
        toast.error('网络异常，供灯未能成功');
      }
    },
    [checkPlacementAllowed, currentUserRole, lamps, currentUserId, currentUserName, onLimitReached, onPlaceLamp, setLamps, setIsPlacementMode]
  );

  /**
   * 模块一：移动端兼容的双击判定与 CameraControls 视角缩放平滑过渡
   */
  const handleWaterPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      // 仅响应主要点击（排除鼠标右键拖拽等操作）
      if (e.button !== 0) return;

      const now = Date.now();
      const delta = now - lastTapRef.current.time;
      const distX = Math.abs(e.clientX - lastTapRef.current.x);
      const distY = Math.abs(e.clientY - lastTapRef.current.y);

      // 双击判定：连续两次 onPointerDown 时间间隔 40ms ~ 380ms，触点位移不超过 32px
      const isDoubleTap = delta > 40 && delta < 380 && distX < 32 && distY < 32;

      if (isDoubleTap) {
        // 重置双击判定，防止三次连续点击造成误判
        lastTapRef.current = { time: 0, x: 0, y: 0 };

        // 取消正在等待的单次放置延时，优先执行双击缩放手势
        if (placementTimerRef.current) {
          clearTimeout(placementTimerRef.current);
          placementTimerRef.current = null;
        }

        if (!cameraControlsRef.current) return;

        if (!isZoomed) {
          // isZoomed === false：利用双击获取的 3D 交点坐标，调用 setLookAt 平滑推移放大
          cameraControlsRef.current.setLookAt(
            e.point.x,
            e.point.y + 4,
            e.point.z + 6,
            e.point.x,
            e.point.y,
            e.point.z,
            true // smooth transition
          );
          setIsZoomed(true);
        } else {
          // isZoomed === true：再次双击触发 reset(true) 平滑退回初始视角
          cameraControlsRef.current.reset(true);
          setIsZoomed(false);
        }
        return;
      }

      // 单次点击：记录时间戳与触点坐标
      lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };

      // 处于供灯模式时，设置防抖延时（留出 260ms 双击判定窗口，避免双击第一下误供灯）
      if (isPlacementMode) {
        if (placementTimerRef.current) {
          clearTimeout(placementTimerRef.current);
        }
        const targetPoint = e.point.clone();
        placementTimerRef.current = setTimeout(() => {
          placementTimerRef.current = null;
          handlePlaceLampAt(targetPoint);
        }, 260);
      }
    },
    [isZoomed, isPlacementMode, handlePlaceLampAt, cameraControlsRef, setIsZoomed]
  );

  // 清理放置延时
  useEffect(() => {
    return () => {
      if (placementTimerRef.current) {
        clearTimeout(placementTimerRef.current);
      }
    };
  }, []);

  // 水面移动处理（预览灯）
  const handleWaterMove = useCallback(
    (point: THREE.Vector3 | null) => {
      if (!point) {
        setPreviewPos(null);
        return;
      }
      const distance = Math.hypot(point.x, point.z);
      if (checkPlacementAllowed(distance)) {
        setPreviewPos([point.x, 0.1, point.z]);
      } else {
        setPreviewPos(null);
      }
    },
    [checkPlacementAllowed]
  );

  const removeRipple = useCallback((id: string) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <fogExp2 attach="fog" args={['#0a0a0a', 0.05]} />

      {/* 场景光照 */}
      <ambientLight intensity={0.4} color="#FFF1D0" />
      <hemisphereLight args={['#1a1a2e', '#000000', 0.3]} />
      <pointLight position={[0, 20, 0]} intensity={1.5} distance={100} color="#E8F0FF" />

      {/* 空间金光粒子 */}
      <Sparkles count={isMobile ? 80 : 250} scale={30} size={2} speed={0.2} color="#FBBF24" opacity={0.6} />

      {/* 苍穹高能螺旋离子日轮（IonSun 天体发光特效）：移动端优化为 2,400 粒子，增大尺寸保持视觉丰满度并彻底根除 Overdraw 卡顿 */}
      <IonSun
        position={[0, 8, -38]}
        rotation={[0.35, 0, 0.15]}
        coreRadius={isMobile ? 3.8 : 3.5}
        maxRadius={16}
        particleCount={isMobile ? 2400 : 30000}
        particleSize={isMobile ? 0.35 : 0.22}
        spiralArms={3}
      />

      {/* 双圈结界 */}
      <ConcentricRings />

      {/* 边界粒子 */}
      <GlowBoundary radius={OUTER_RADIUS} count={isMobile ? 160 : 600} />

      {/* 水墨水面：移动端 48x48 网格细分保证涟漪波纹细腻，GPU Shader 驱动无掉帧 */}
      <InkWater
        size={100}
        segments={isMobile ? 48 : 160}
        onWaterPointerDown={handleWaterPointerDown}
        onWaterMove={handleWaterMove}
        isPlacementMode={isPlacementMode}
      />

      {/* 放置预览灯 */}
      <PreviewLamp position={previewPos} />

      {/* 渲染所有心灯（结合 LOD 视距裁剪优化） */}
      {lamps.map((lamp) => (
        <ProceduralLamp
          key={lamp.id}
          id={lamp.id}
          userId={lamp.userId}
          position={lamp.position}
          userName={lamp.userName}
          lightEnabled={nearIds.has(lamp.id)}
          showText={nearTextIds.has(lamp.id)}
          isMobile={isMobile}
          onPray={handlePray}
          onDedicate={handlePray}
          message={lamp.message}
          prayerCount={lamp.prayerCount ?? lamp.dedications ?? 0}
          dedications={lamp.dedications ?? lamp.prayerCount ?? 0}
        />
      ))}

      {/* 莲花灯神经网络光纤连接（因陀罗网 · 优化版 MeshLine 贝塞尔曲线） */}
      <NeuralConnections lamps={lamps} isMobile={isMobile} />

      {/* 涟漪 */}
      {ripples.map((ripple) => (
        <Ripple
          key={ripple.id}
          position={ripple.position}
          color="#F59E0B"
          onComplete={() => removeRipple(ripple.id)}
        />
      ))}

      {/* 模块一要求：全面改用 CameraControls */}
      <CameraControls
        ref={handleControlsRef}
        makeDefault
        smoothTime={0.6}
        minDistance={2}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enabled={!isPlacementMode}
      />
    </>
  );
};

// ==================== LotusSeaCanvas 容器组件 ====================
export interface LotusSeaCanvasProps {
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: UserRoleType;
  maxLampsPerUser?: number;
  canResetDaochang?: boolean;
  onPlaceLamp?: (pos?: [number, number, number]) => void;
  onDedicate?: (lampId?: string) => void;
  onLimitReached?: (msg?: string) => void;
  onResetDaochang?: () => void;
  onClose?: () => void;
}

const LotusSeaCanvas: React.FC<LotusSeaCanvasProps> = ({
  currentUserId = 'user-me',
  currentUserName = '同修',
  currentUserRole = 'member',
  canResetDaochang,
  onPlaceLamp,
  onDedicate,
  onLimitReached,
  onResetDaochang,
  onClose,
}) => {
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [lamps, setLamps] = useState<LampData[]>([]);
  const isMobile = useIsMobile();
  const cameraControlsRef = useRef<CameraControls | null>(null);

  // 模块三：祈祷防抖映射与待同步计数
  const prayDebounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const prayPendingCounts = useRef<Map<string, number>>(new Map());

  // 初始化拉取数据库中的心灯列表
  useEffect(() => {
    let isMounted = true;
    fetch('/api/lamps')
      .then((res) => {
        if (!res.ok) throw new Error('API fetch failed');
        return res.json();
      })
      .then((data: any[]) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setLamps(
            data.map((item) => ({
              id: item.id,
              userId: item.userId,
              userName: item.userName || '同修',
              position: [item.posX, item.posY, item.posZ],
              message: item.message || '愿平安吉祥',
              prayerCount: item.prayerCount ?? 0,
              dedications: item.prayerCount ?? 0,
            }))
          );
        }
      })
      .catch((err) => {
        console.warn('获取莲灯列表失败：', err);
      });

    return () => {
      isMounted = false;
      // 卸载前将正在排队的防抖祈祷全部 flush 发送，保证功德数据不丢失
      prayDebounceTimers.current.forEach((timer, lampId) => {
        clearTimeout(timer);
        const countToSync = prayPendingCounts.current.get(lampId);
        if (countToSync && countToSync > 0) {
          fetch(`/api/lamps/${lampId}/pray`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: countToSync }),
            keepalive: true,
          }).catch(() => {});
        }
      });
      prayPendingCounts.current.clear();
      prayDebounceTimers.current.clear();
    };
  }, []);

  /**
   * 模块三：祈祷数值更新
   * 1. 视觉触发的同时，前端乐观更新 (Optimistic UI) 该灯祈祷数值，让悬浮数字立即 +1
   * 2. 后台防抖 (Debounce) 调用 API，利用 Prisma 的 increment: 1 原子操作更新数据库中的 prayerCount
   */
  const handlePray = useCallback(
    (lampId: string) => {
      // 1. 乐观更新立即 +1
      setLamps((prev) =>
        prev.map((lamp) =>
          lamp.id === lampId
            ? {
                ...lamp,
                prayerCount: (lamp.prayerCount || 0) + 1,
                dedications: (lamp.dedications || 0) + 1,
              }
            : lamp
        )
      );

      // 2. 累加防抖待提交数值
      const currentPending = (prayPendingCounts.current.get(lampId) || 0) + 1;
      prayPendingCounts.current.set(lampId, currentPending);

      // 3. 清理该灯先前的防抖定时器
      const existingTimer = prayDebounceTimers.current.get(lampId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // 4. 防抖延迟 500ms 触发后端原子自增
      const timer = setTimeout(async () => {
        const countToSync = prayPendingCounts.current.get(lampId) || 1;
        prayPendingCounts.current.delete(lampId);
        prayDebounceTimers.current.delete(lampId);

        try {
          const res = await fetch(`/api/lamps/${lampId}/pray`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: countToSync }),
          });
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data && typeof data.prayerCount === 'number') {
              // 用服务器权威计数对齐，防止多端数值微小飘移
              setLamps((prev) =>
                prev.map((l) =>
                  l.id === lampId
                    ? { ...l, prayerCount: data.prayerCount, dedications: data.prayerCount }
                    : l
                )
              );
            }
          } else {
            console.error(`更新莲灯 ${lampId} 祈祷数返回异常: ${res.status}`);
          }
        } catch (err) {
          console.error(`网络异常，无法同步莲灯 ${lampId} 祈祷数`, err);
        }
      }, 500);

      prayDebounceTimers.current.set(lampId, timer);
    },
    []
  );

  /**
   * 模块二：清空道场 (Reset Action)
   * 创建管理端专属清空道场函数：调用 API 执行 prisma.lamp.deleteMany({})，
   * 并在请求成功后通过 setLamps([]) 瞬间清空 3D 场景中的所有莲灯渲染。
   */
  const handleResetDaochang = useCallback(async () => {
    if (!window.confirm('确定要清空道场中所有的莲灯吗？此操作将重置全部供灯记录。')) {
      return;
    }

    try {
      const res = await fetch('/api/lamps', {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('清空道场接口返回异常');
      }

      // 瞬间清空 3D 场景中的所有莲灯渲染
      setLamps([]);
      setIsPlacementMode(false);
      if (cameraControlsRef.current) {
        cameraControlsRef.current.reset(true);
        setIsZoomed(false);
      }
      toast.success('道场已清空重置，万籁归寂', { icon: '🧹' });
      onResetDaochang?.();
    } catch (error) {
      console.error('清空道场失败', error);
      toast.error('清空道场失败，请重试');
    }
  }, [onResetDaochang]);

  /**
   * 切换供灯模式（带单人单灯的前端拦截前置检查）
   */
  const handleTogglePlacement = useCallback(() => {
    if (!isPlacementMode) {
      const alreadyHas = lamps.some(
        (l) => l.userId === currentUserId || (currentUserName && currentUserName !== '同修' && l.userName === currentUserName)
      );
      if (alreadyHas) {
        if (onLimitReached) {
          onLimitReached('每位同修仅限供奉一盏莲灯');
        } else {
          toast.warning('每位同修仅限供奉一盏莲灯', {
            icon: '🪷',
            duration: 3500,
          });
        }
        return;
      }
    }
    setIsPlacementMode((prev) => !prev);
  }, [isPlacementMode, lamps, currentUserId, currentUserName, onLimitReached]);

  /**
   * 恢复视角
   */
  const handleResetView = useCallback(() => {
    if (cameraControlsRef.current) {
      cameraControlsRef.current.reset(true);
      setIsZoomed(false);
    }
  }, []);

  // 管理端权限判定：管理层角色或显式传参允许清空
  const isManagement =
    canResetDaochang ??
    (currentUserRole === 'admin' ||
      currentUserRole === 'presidency' ||
      currentUserRole === 'committee' ||
      currentUserRole === '理事' ||
      process.env.NODE_ENV !== 'production');

  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useCanvasVisibility(containerRef);
  const [isContextLost, setIsContextLost] = useState(false);

  // WebGL 显存崩溃防御与优雅降级
  const handleCreated = ({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;
    const onLost = (event: Event) => {
      event.preventDefault();
      console.warn('[LotusSeaCanvas] WebGL Context lost. Guarding and falling back.');
      setIsContextLost(true);
    };
    const onRestored = () => {
      console.info('[LotusSeaCanvas] WebGL Context restored.');
      setIsContextLost(false);
    };
    canvas.addEventListener('webglcontextlost', onLost, false);
    canvas.addEventListener('webglcontextrestored', onRestored, false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Canvas
        shadows={!isMobile}
        camera={{
          position: isMobile ? [0, 10.5, 22] : [0, 10, 18],
          fov: isMobile ? 54 : 50,
          near: 0.1,
          far: 200,
        }}
        // 模块一：智能自适应 DPR 支持最高 2.0，彻底消除低清晰度拉伸发虚，与 Retina 视网膜屏达到点对点真高清
        dpr={isMobile ? [1, 2] : [1, 2]}
        frameloop={!isVisible ? 'demand' : 'always'}
        // 模块一：关闭原生 MSAA，交由单通道 SMAA 接管，启用高性能模式
        gl={{
          powerPreference: "high-performance",
          antialias: false,
          precision: "highp",
          alpha: true,
          preserveDrawingBuffer: false,
        }}
        onCreated={handleCreated}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <LampScene
            isPlacementMode={isPlacementMode}
            setIsPlacementMode={setIsPlacementMode}
            isZoomed={isZoomed}
            setIsZoomed={setIsZoomed}
            lamps={lamps}
            setLamps={setLamps}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserRole={currentUserRole}
            onPlaceLamp={onPlaceLamp}
            onDedicate={onDedicate}
            onLimitReached={onLimitReached}
            cameraControlsRef={cameraControlsRef}
            handlePray={handlePray}
            isMobile={isMobile}
          />

          {/* 模块二：电影级低功耗后处理管线 (luminanceThreshold 提高至 0.92，杜绝文字自身发光散焦变糊) */}
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <Bloom
              mipmapBlur
              intensity={isMobile ? 1.05 : 1.4}
              luminanceThreshold={0.92}
              luminanceSmoothing={0.2}
              radius={isMobile ? 0.6 : 0.75}
              levels={isMobile ? 5 : 8}
              resolutionScale={isMobile ? Resolution.HALF : Resolution.FULL}
            />
            {/* 模块一：轻量级形态学抗锯齿，彻底平滑连线与发光体边缘锯齿 */}
            <SMAA />
            {!isMobile && <Vignette eskil={false} offset={0.12} darkness={0.85} />}
            {!isMobile && <Noise opacity={0.015} />}
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* WebGL 显存崩溃守护备用图层 */}
      {isContextLost && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0a1628] via-[#10243e] to-[#0a1628] text-center p-6">
          <div className="h-16 w-16 rounded-full bg-golden-rich/15 border border-golden-rich/35 flex items-center justify-center mb-3.5 text-2xl shadow-lg">
            🪷
          </div>
          <h3 className="text-lg font-bold text-amber-200 mb-2 font-serif">3D 莲池禅境自愈守护中</h3>
          <p className="text-xs text-amber-100/70 max-w-xs leading-relaxed mb-4">
            检测到设备显存占用较高，系统已自动挂起 3D 画布以保障系统流畅稳定。
          </p>
          <button
            onClick={() => setIsContextLost(false)}
            className="px-5 py-2 rounded-full border border-golden-rich/50 bg-golden-rich/20 text-xs font-semibold text-golden-rich hover:bg-golden-rich/30 transition-all active:scale-95 shadow-sm pointer-events-auto"
          >
            重新唤醒 3D 莲池
          </button>
        </div>
      )}

      {/* 顶部控制栏 */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(16px + env(safe-area-inset-top, 0px))',
          left: '16px',
          right: '16px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        {/* 右侧：缩放状态下的快速复位按钮 */}
        {isZoomed && (
          <button
            onClick={handleResetView}
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'rgba(20, 20, 20, 0.75)',
              backdropFilter: 'blur(8px)',
              color: '#FDE047',
              border: '1px solid rgba(253, 224, 71, 0.3)',
              borderRadius: '9999px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ↺ 还原全局视角
          </button>
        )}
      </div>

      {/* 底部供灯按钮与提示（手机端避让安全区与底部高度） */}
      <div
        style={{
          position: 'absolute',
          bottom: isMobile
            ? 'calc(24px + env(safe-area-inset-bottom, 0px))'
            : 'calc(28px + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          width: 'max-content',
          maxWidth: '94vw',
        }}
      >
        {isPlacementMode && (
          <div
            style={{
              backgroundColor: 'rgba(20, 20, 20, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              borderRadius: '9999px',
              padding: '6px 18px',
              color: '#FEF08A',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              maxWidth: '92vw',
              textAlign: 'center',
            }}
          >
            {isInnerCirclePermitted(currentUserRole) ? (
              <span>🪷 您当前身份为【{currentUserRole}】：享有内圈及外圈任意水面供灯特权</span>
            ) : (
              <span>🌱 您当前身份为【学员】：请在光环外圈供灯（内圈为理事与学长姐专属福田）</span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 底部退出供灯按钮（手机端特别适配） */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(28, 25, 23, 0.85)',
                color: '#E5E7EB',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '9999px',
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.25s ease',
              }}
              title="退出供灯"
              aria-label="退出供灯"
            >
              <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>退出</span>
            </button>
          )}

          {/* 供灯 / 取消供灯按钮 */}
          <button
            onClick={handleTogglePlacement}
            style={{
              backgroundColor: isPlacementMode ? '#EF4444' : '#FBBF24',
              color: '#050505',
              border: 'none',
              borderRadius: '9999px',
              padding: '12px 28px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(251, 191, 36, 0.45)',
              transition: 'all 0.3s ease',
            }}
          >
            {isPlacementMode ? '取消供灯' : '＋ 供灯'}
          </button>
        </div>
        <span
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.75)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(6px)',
            padding: '2px 12px',
            borderRadius: '9999px',
          }}
        >
          双击水面缩放视角 · 点击心灯祈祷回向
        </span>
      </div>
    </div>
  );
};

export default LotusSeaCanvas;
