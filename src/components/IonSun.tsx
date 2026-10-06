// IonSun.tsx
'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface IonSunProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  coreRadius?: number;
  particleCount?: number;
  particleSize?: number;
  maxRadius?: number;
  spiralArms?: number;
}

export const IonSun: React.FC<IonSunProps> = ({
  position = [-80, 60, -150],
  rotation = [0.35, 0, 0.15],
  coreRadius = 10,
  particleCount = 30000,
  particleSize = 0.22,
  maxRadius = 45,
  spiralArms = 3,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  // ==================== 生成粒子数据 ====================
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // 颜色梯度停止点
    const colorCenter = new THREE.Color('#ffff55'); // 亮黄
    const colorMid = new THREE.Color('#ff5500');    // 橙红
    const colorOuter = new THREE.Color('#aa00ff');  // 紫
    const colorEdge = new THREE.Color('#ff00aa');   // 粉紫

    const tempColor = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      // ---- 位置生成：中心密集 + 螺旋盘 + 离子尾迹 ----
      let x: number, y: number, z: number, r: number;

      if (i < particleCount * 0.85) {
        // 主螺旋盘体（85% 粒子）
        const t = Math.pow(Math.random(), 1.5);
        r = t * maxRadius;

        // 螺旋角度：半径越大旋转越多，加上随机扰动
        const angle = r * (spiralArms * 0.35) + Math.random() * Math.PI * 0.5;

        // 盘面厚度随半径增加而减小
        const thickness = (1 - t) * 4 + 0.3;
        y = (Math.random() - 0.5) * thickness * 2;

        // 形成椭圆盘：在 XZ 平面拉伸
        const flatX = Math.cos(angle) * r * (0.85 + Math.random() * 0.3);
        const flatZ = Math.sin(angle) * r * (0.65 + Math.random() * 0.3);

        x = flatX;
        z = flatZ;
      } else {
        // 离子尾迹（15% 粒子）：沿 X 正方向喷射
        const t = Math.random();
        r = t * maxRadius * 1.2;
        const spread = 0.5 + Math.random() * 2.0;
        x = r * 1.5 + (Math.random() - 0.5) * spread * r;
        y = (Math.random() - 0.5) * spread * 0.3 * r;
        z = (Math.random() - 0.5) * spread * 0.5 * r;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // ---- 颜色映射（基于半径 r 归一化） ----
      const normalized = Math.min(r / maxRadius, 1.0);

      if (normalized < 0.3) {
        tempColor.lerpColors(colorCenter, colorMid, normalized / 0.3);
      } else if (normalized < 0.7) {
        tempColor.lerpColors(colorMid, colorOuter, (normalized - 0.3) / 0.4);
      } else {
        tempColor.lerpColors(colorOuter, colorEdge, (normalized - 0.7) / 0.3);
      }

      // 增加一些随机亮度变化
      const brightness = 0.8 + Math.random() * 0.4;
      colors[i * 3] = tempColor.r * brightness;
      colors[i * 3 + 1] = tempColor.g * brightness;
      colors[i * 3 + 2] = tempColor.b * brightness;
    }

    return { positions, colors };
  }, [particleCount, maxRadius, spiralArms]);

  // 创建 BufferGeometry 并挂载 attributes
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  // 粒子材质：AdditiveBlending 叠加发光
  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: particleSize,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
        fog: false,
      }),
    [particleSize]
  );

  // ==================== 缓慢自转 ====================
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.025;
      groupRef.current.rotation.z -= delta * 0.008;
    }
    if (coreRef.current) {
      const scale = 1 + Math.sin(Date.now() * 0.0012) * 0.02;
      coreRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <group ref={groupRef}>
        {/* 高能发光内核 */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[coreRadius, 24, 24]} />
          <meshStandardMaterial
            color="#ff8800"
            emissive="#ffaa00"
            emissiveIntensity={3.5}
            roughness={0.2}
            metalness={0.1}
            fog={false}
          />
        </mesh>

        {/* 螺旋离子云 */}
        <points geometry={geometry} material={particleMaterial} />

        {/* 照射莲花水面的金光光源 */}
        <pointLight color="#ff9900" intensity={2.5} distance={100} decay={2} />
      </group>
    </group>
  );
};

export default IonSun;
