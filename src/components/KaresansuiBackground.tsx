"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";

interface Point {
  x: number;
  y: number;
}

/**
 * 交互式枯山水沙纹背景 (Interactive Karesansui Garden)
 *
 * 设计意境：一片俯视视角的白沙禅园。用户的指针滑动会在沙地上
 * 留下多条平行的耙沙波纹（贝塞尔曲线），波纹永久保留（永久轨迹模式）。
 * Canvas 固定在全屏底层，pointer-events: none，不阻挡任何 UI 交互。
 */
export function KaresansuiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<Point | null>(null);
  const animFrameRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();

  // 沙纹绘制核心函数：在两点之间绘制 N 条平行贝塞尔曲线段
  const drawRake = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: Point,
      to: Point,
      isDark: boolean
    ) => {
      const RAKE_LINES = 5; // 耙齿数量
      const RAKE_SPACING = 4; // 耙齿间距 (px)
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return;

      // 垂直于移动方向的单位法向量
      const nx = -dy / len;
      const ny = dx / len;

      // 曲线颜色：白天沙地暖金，夜晚银砚墨灰
      const lineColor = isDark
        ? "rgba(200, 200, 190, 0.055)"
        : "rgba(140, 110, 60, 0.07)";

      ctx.save();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 0.9;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < RAKE_LINES; i++) {
        // 将每条平行线从中心向两侧偏移
        const offset = (i - (RAKE_LINES - 1) / 2) * RAKE_SPACING;
        const ox = nx * offset;
        const oy = ny * offset;

        // 微扰贝塞尔控制点，让线条略带自然弧度
        const mid = {
          x: (from.x + to.x) / 2 + ox + (Math.random() - 0.5) * 2,
          y: (from.y + to.y) / 2 + oy + (Math.random() - 0.5) * 2,
        };

        ctx.beginPath();
        ctx.moveTo(from.x + ox, from.y + oy);
        ctx.quadraticCurveTo(mid.x, mid.y, to.x + ox, to.y + oy);
        ctx.stroke();
      }

      ctx.restore();
    },
    []
  );

  // 处理指针/触摸移动事件
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const current: Point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const isDark = document.documentElement.classList.contains("dark");

      if (lastPointRef.current) {
        drawRake(ctx, lastPointRef.current, current, isDark);
      }

      lastPointRef.current = current;
    },
    [drawRake]
  );

  const handlePointerUp = useCallback(() => {
    lastPointRef.current = null;
  }, []);

  // 处理触摸事件
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const touch = e.touches[0];
      if (!touch) return;

      const rect = canvas.getBoundingClientRect();
      const current: Point = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };

      const isDark = document.documentElement.classList.contains("dark");

      if (lastPointRef.current) {
        drawRake(ctx, lastPointRef.current, current, isDark);
      }

      lastPointRef.current = current;
    },
    [drawRake]
  );

  const handleTouchEnd = useCallback(() => {
    lastPointRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置 Canvas 尺寸为全屏 (高刷 Retina DPR 适配，消除移动端与 Mac 屏幕发虚)
    const resize = () => {
      // 1. 获取设备物理像素比 (取 dpr，通常 Retina 为 2 或 3，上限锁在 2 兼顾极致锐利度与电池能耗)
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 2. 将底层位图物理分辨率放大至 dpr 倍 (例如 1080p 屏幕以 2160p 精度绘制)
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      // 3. 通过 CSS 尺寸将其限制回屏幕实际视口尺寸 (保持 100vw * 100vh 呈现)
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // 4. 缩放 2D 渲染上下文坐标系，使得后续所有 drawRake 和坐标计算仍使用常规 CSS 逻辑像素
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    // 移动端不监听指针波纹渲染，避免触控滑动网页时高频触发 Canvas 重绘导致掉帧
    const isMobileDevice = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
    if (!isMobileDevice) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointerleave", handlePointerUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointerleave", handlePointerUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [handlePointerMove, handlePointerUp, handleTouchMove, handleTouchEnd]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-5] pointer-events-none"
      style={{ backgroundColor: "transparent" }}
      aria-hidden="true"
    />
  );
}
