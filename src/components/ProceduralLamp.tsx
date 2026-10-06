'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Text, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface ProceduralLampProps {
  position: [number, number, number];
  id?: string;
  userId?: string;
  userName?: string;
  lightEnabled?: boolean;
  showText?: boolean;
  onDedicate?: (id: string) => void;
  onPray?: (id: string) => void;
  message?: string;
  dedications?: number;
  prayerCount?: number;
}

// 模块级单例几何体缓存，彻底消除数十个心灯重复构建与显存重复占用
let cachedLotusGeometry: THREE.BufferGeometry | null = null;
let cachedHaloGeometry: THREE.BufferGeometry | null = null;

export function getSharedLotusGeometry(): THREE.BufferGeometry {
  if (!cachedLotusGeometry) {
    cachedLotusGeometry = createLotusPetalsGeometry(false);
  }
  return cachedLotusGeometry;
}

export function getSharedHaloGeometry(): THREE.BufferGeometry {
  if (!cachedHaloGeometry) {
    // 细分段数从 16 提升至 64，消除水面多边形光晕折角，呈现圆润光斑
    const geom = new THREE.RingGeometry(0.1, 1.45, 64);
    geom.rotateX(-Math.PI / 2);
    cachedHaloGeometry = geom;
  }
  return cachedHaloGeometry;
}

/**
 * 构建高质感多层水上盛开莲花灯几何体（参考真实样本图 media_1788944003877.jpg）：
 * 1. 外层 10 瓣：宽展深绯红（#d32f2f），倾角 60°
 * 2. 中层 8 瓣：炽烈橙红（#ff5722），倾角 40°
 * 3. 内层 6 瓣：金橙暖色（#ff9800），倾角 20°
 * 4. 底托基座：暗青绿荷座（#2e4a22）
 */
export function createLotusPetalsGeometry(useCache = true): THREE.BufferGeometry {
  if (useCache && cachedLotusGeometry) {
    return cachedLotusGeometry;
  }

  const geoms: THREE.BufferGeometry[] = [];

  function createPetal(
    length: number,
    width: number,
    cupCurve: number,
    tiltOut: number,
    yaw: number,
    colorHex: string
  ): THREE.BufferGeometry {
    // 细分精度从 3x5 提升至 8x12，曲面更丝滑圆润，消除手机端折角
    const geom = new THREE.PlaneGeometry(width, length, 8, 12);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const ny = (y + length / 2) / length;
      let widthScale = Math.sin(ny * Math.PI);
      if (ny > 0.7) widthScale = ((1 - ny) / 0.3) * Math.sin(0.7 * Math.PI);
      pos.setX(i, x * Math.max(widthScale, 0.08));
      pos.setZ(i, Math.sin(ny * Math.PI) * cupCurve);
    }
    geom.translate(0, length / 2, 0);
    geom.rotateX(tiltOut);
    geom.rotateY(yaw);
    geom.computeVertexNormals();

    const colors = new Float32Array(pos.count * 3);
    const col = new THREE.Color(colorHex);
    for (let i = 0; i < pos.count; i++) {
      const ny = pos.getY(i) / length;
      const factor = 0.85 + 0.35 * Math.min(Math.max(ny, 0), 1);
      colors[i * 3] = Math.min(col.r * factor, 1);
      colors[i * 3 + 1] = Math.min(col.g * factor, 1);
      colors[i * 3 + 2] = Math.min(col.b * factor, 1);
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }

  // 第一层：外展大花瓣（10 瓣，深绯红色）
  for (let i = 0; i < 10; i++) {
    const yaw = (i / 10) * Math.PI * 2;
    geoms.push(createPetal(0.9, 0.4, 0.14, 1.05, yaw, '#d32f2f'));
  }

  // 第二层：中层捧心瓣（8 瓣，炽烈橙红色）
  for (let i = 0; i < 8; i++) {
    const yaw = (i / 8) * Math.PI * 2 + 0.314;
    geoms.push(createPetal(0.72, 0.33, 0.11, 0.7, yaw, '#ff5722'));
  }

  // 第三层：内层直立护心瓣（6 瓣，金橙暖色）
  for (let i = 0; i < 6; i++) {
    const yaw = (i / 6) * Math.PI * 2 + 0.15;
    geoms.push(createPetal(0.55, 0.26, 0.08, 0.35, yaw, '#ff9800'));
  }

  // 莲座底托（暗青绿荷座：细分段数从 8 提升至 32，消除明显多边形八角形切面）
  const baseGeom = new THREE.CylinderGeometry(0.32, 0.42, 0.08, 32);
  baseGeom.translate(0, 0.04, 0);
  baseGeom.computeVertexNormals();
  const baseColors = new Float32Array(baseGeom.attributes.position.count * 3);
  const baseCol = new THREE.Color('#2e4a22');
  for (let i = 0; i < baseGeom.attributes.position.count; i++) {
    baseColors[i * 3] = baseCol.r;
    baseColors[i * 3 + 1] = baseCol.g;
    baseColors[i * 3 + 2] = baseCol.b;
  }
  baseGeom.setAttribute('color', new THREE.BufferAttribute(baseColors, 3));
  geoms.push(baseGeom);

  const merged = mergeGeometries(geoms, false);
  if (useCache) {
    cachedLotusGeometry = merged;
  }
  return merged;
}

const ProceduralLamp: React.FC<ProceduralLampProps> = ({
  position,
  id = 'lamp',
  userName = '',
  lightEnabled = true,
  showText = true,
  onDedicate,
  onPray,
  message,
  dedications,
  prayerCount,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const lotusMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const flameMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const sparklesGroupRef = useRef<THREE.Group>(null);
  const sparklesPointsRef = useRef<THREE.Points>(null);
  const plusOneRef = useRef<THREE.Group>(null);
  const plusOneTextRef = useRef<any>(null);

  // 1.5 秒点击特效控制
  const vfxStartTimeRef = useRef<number | null>(null);
  const [sparklesActive, setSparklesActive] = useState(false);
  const [floatingPlusOne, setFloatingPlusOne] = useState(false);

  const currentCount = prayerCount ?? dedications ?? 0;

  // 莲花花瓣几何体：使用共享单例缓存，彻底消除多个心灯重复构建
  const lotusGeometry = useMemo(() => getSharedLotusGeometry(), []);

  // 水面泛光倒影几何体：使用共享单例缓存
  const haloGeometry = useMemo(() => getSharedHaloGeometry(), []);

  const baseEmissive = lightEnabled ? 1.4 : 0.8;

  // 莲花花瓣温润材质（带顶点色）
  const lotusMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.32,
      metalness: 0.08,
      side: THREE.DoubleSide,
      emissive: new THREE.Color('#ff4500'),
      emissiveIntensity: baseEmissive,
    });
    lotusMaterialRef.current = mat;
    return mat;
  }, [baseEmissive]);

  // 中心烛火材质
  const flameMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#fffbe6',
      emissive: new THREE.Color('#ffaa00'),
      emissiveIntensity: 3.2,
      roughness: 0.1,
      metalness: 0.05,
    });
    flameMaterialRef.current = mat;
    return mat;
  }, []);

  // 水面倒影光晕材质
  const haloMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#ff5500',
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);

  useEffect(() => {
    return () => {
      lotusMaterial.dispose();
      flameMaterial.dispose();
      haloMaterial.dispose();
    };
  }, [lotusMaterial, flameMaterial, haloMaterial]);

  useEffect(() => {
    if (lotusMaterialRef.current && vfxStartTimeRef.current === null) {
      lotusMaterialRef.current.emissiveIntensity = baseEmissive;
    }
  }, [baseEmissive]);

  /**
   * 点击交互绑定与祈祷特效
   */
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    vfxStartTimeRef.current = performance.now() / 1000;
    setSparklesActive(true);
    setFloatingPlusOne(true);

    if (onPray) {
      onPray(id);
    } else if (onDedicate) {
      onDedicate(id);
    }
  };

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const group = groupRef.current;
    const light = lightRef.current;
    if (!group) return;

    // 水波微浪浮动与倾摇
    const baseY = position[1] ?? 0;
    group.position.y = baseY + Math.sin(t * 1.5 + position[0]) * 0.08;
    group.rotation.y = Math.sin(t * 0.5 + position[2]) * 0.08;
    group.rotation.z = Math.cos(t * 0.7 + position[0]) * 0.02;

    // 火苗灵动闪烁
    if (flameRef.current) {
      const f = 0.9 + Math.sin(t * 8.5 + position[0]) * 0.12 + Math.random() * 0.05;
      flameRef.current.scale.set(f, f + Math.sin(t * 12.0) * 0.12, f);
    }

    // 基础光源呼吸律动
    const baseLightIntensity = 3.0 + Math.sin(t * 6.5 + position[2]) * 0.6;
    if (light && vfxStartTimeRef.current === null) {
      light.intensity = baseLightIntensity;
    }

    // 点击互动特效 (VFX)：1.5 秒内极速扩散消散并平滑恢复
    if (vfxStartTimeRef.current !== null) {
      const nowSec = performance.now() / 1000;
      const elapsed = nowSec - vfxStartTimeRef.current;
      const duration = 1.5;

      if (elapsed <= duration) {
        const progress = elapsed / duration;
        const decay = Math.pow(1 - progress, 2.5);
        const dynamicEmissive = baseEmissive + decay * 3.8;

        if (lotusMaterialRef.current) {
          lotusMaterialRef.current.emissiveIntensity = dynamicEmissive;
        }

        if (flameMaterialRef.current) {
          flameMaterialRef.current.emissiveIntensity = 3.2 + decay * 3.0;
        }

        if (light) {
          light.intensity = baseLightIntensity + decay * 6.5;
        }

        // 莲灯微幅跃动放大
        const scalePulse = 1 + Math.sin(progress * Math.PI) * 0.18 * (1 - progress);
        group.scale.setScalar(scalePulse);

        // 金光 Sparkles 环向外扩散
        if (sparklesGroupRef.current) {
          const ringScale = 0.8 + Math.sqrt(progress) * 3.5;
          sparklesGroupRef.current.scale.set(ringScale, 0.4, ringScale);
        }

        // 浮动 +1 功德缓缓升腾并淡出
        if (plusOneRef.current) {
          plusOneRef.current.position.y = 1.5 + progress * 0.8;
        }
        if (plusOneTextRef.current) {
          const fadeAlpha = Math.max(0, 1 - progress * 1.15);
          plusOneTextRef.current.fillOpacity = fadeAlpha;
          plusOneTextRef.current.outlineOpacity = fadeAlpha;
        }
      } else {
        // 回归稳态
        vfxStartTimeRef.current = null;
        if (lotusMaterialRef.current) {
          lotusMaterialRef.current.emissiveIntensity = baseEmissive;
        }
        if (flameMaterialRef.current) {
          flameMaterialRef.current.emissiveIntensity = 3.2;
        }
        if (light) {
          light.intensity = baseLightIntensity;
        }
        group.scale.setScalar(1);
        setSparklesActive(false);
        setFloatingPlusOne(false);
      }
    }
  });

  return (
    <group ref={groupRef} position={position} onPointerDown={handlePointerDown}>
      {/* 三层盛开莲花花瓣（绯红至橘红多层结构） */}
      <mesh
        geometry={lotusGeometry}
        material={lotusMaterial}
        onPointerDown={handlePointerDown}
      />

      {/* 中心明亮烛芯火苗（16段光滑圆锥） */}
      <mesh
        ref={flameRef}
        material={flameMaterial}
        position={[0, 0.26, 0]}
        onPointerDown={handlePointerDown}
      >
        <coneGeometry args={[0.13, 0.44, 16]} />
      </mesh>

      {/* 水面倒影光晕（还原水波光晕） */}
      <mesh
        geometry={haloGeometry}
        material={haloMaterial}
        position={[0, -0.02, 0]}
      />

      {/* 核心温润金红点光源 */}
      {lightEnabled && (
        <pointLight
          ref={lightRef}
          color="#ff7722"
          intensity={3.2}
          distance={8}
          decay={2}
          position={[0, 0.35, 0]}
        />
      )}

      {/* 点击释放的金光扩散消散粒子环 Sparkles */}
      {sparklesActive && (
        <group ref={sparklesGroupRef} position={[0, 0.15, 0]}>
          <Sparkles
            ref={sparklesPointsRef}
            count={65}
            scale={[1.8, 0.3, 1.8]}
            size={3.0}
            speed={2.2}
            noise={0.3}
            color="#FFD700"
            opacity={0.95}
          />
        </group>
      )}

      {/* 浮动祈福 +1 功德特效 */}
      {floatingPlusOne && (
        <group ref={plusOneRef} position={[0, 1.5, 0]}>
          <Billboard onPointerDown={handlePointerDown}>
            <Text
              ref={plusOneTextRef}
              fontSize={0.26}
              color="#FDE047"
              anchorX="center"
              anchorY="middle"
              material-depthTest={false}
              outlineWidth={0.025}
              outlineColor="#78350F"
              fillOpacity={1}
              outlineOpacity={1}
            >
              +1 随喜功德
            </Text>
          </Billboard>
        </group>
      )}

      {/* 悬浮同修姓名与祈祷计数 Billboard（LOD 视距裁剪优化：仅靠近相机的心灯渲染 3D 文字，杜绝移动端卡顿） */}
      {showText && (
        <Billboard position={[0, 1.25, 0]} onPointerDown={handlePointerDown}>
          {userName && (
            <Text
              fontSize={0.28}
              color="#FFE4A0"
              anchorX="center"
              anchorY="middle"
              material-depthTest={false}
              outlineWidth={0.02}
              outlineColor="#000000"
              fillOpacity={0.95}
            >
              {userName}
            </Text>
          )}
          <Text
            fontSize={0.2}
            color="#F59E0B"
            anchorX="center"
            anchorY="middle"
            material-depthTest={false}
            outlineWidth={0.015}
            outlineColor="#000000"
            fillOpacity={0.9}
            position={[0, -0.32, 0]}
          >
            {`🙏 ${currentCount}`}
          </Text>
          {message && (
            <Text
              fontSize={0.16}
              color="#FEF08A"
              anchorX="center"
              anchorY="middle"
              material-depthTest={false}
              outlineWidth={0.01}
              outlineColor="#1c1917"
              fillOpacity={0.85}
              position={[0, -0.58, 0]}
              maxWidth={3.5}
            >
              {message}
            </Text>
          )}
        </Billboard>
      )}
    </group>
  );
};

export default ProceduralLamp;
