import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { Matrix4, Quaternion, Vector3 } from "three";

export function useCircularCarousel(count: number) {
  const stageRef = useRef<HTMLDivElement>(null);
  const phase = useRef(0);
  const frame = useRef(0);
  const busy = useRef(false);
  const paint = useRef(() => {});
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const [moving, setMoving] = useState(false);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const cards = Array.from(stage.querySelectorAll<HTMLElement>(".about-card"));
    const bodies = Array.from(stage.querySelectorAll<HTMLElement>(".about-card-body"));
    const matrix = new Matrix4();
    const rotation = new Quaternion();
    const position = new Vector3();
    const scale = new Vector3();
    const up = new Vector3(0, 1, 0);

    paint.current = () => {
      const radius = Math.min(340, stage.clientWidth * 0.39);
      cards.forEach((card, index) => {
        // An unbounded phase keeps the orbit continuous across the last/first card.
        const angle = (index - phase.current) * Math.PI * 2 / count;
        const depth = Math.cos(angle);
        position.set(Math.sin(angle) * radius, 0, (depth - 1) * 240);
        rotation.setFromAxisAngle(up, -Math.sin(angle) * 0.34);
        scale.setScalar(0.92 + depth * 0.08);
        matrix.compose(position, rotation, scale);
        card.style.transform = `translate(-50%, -50%) matrix3d(${matrix.elements.join(",")})`;
        card.style.opacity = String(Math.max(0, Math.min(1, (depth + 0.65) / 0.9)));
        card.style.zIndex = String(Math.round((depth + 1) * 100));
        card.style.pointerEvents = depth > 0 ? "auto" : "none";
      });
    };
    const measure = () => {
      const height = Math.ceil(Math.max(...bodies.map(body => body.offsetHeight))) + 2;
      stage.style.setProperty("--about-card-height", `${height}px`);
      stage.style.height = `${height + 36}px`;
      paint.current();
    };
    let resizeFrame = 0;
    // Defer layout writes so WebKit does not re-enter the observer delivery loop.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(measure);
    });
    observer.observe(stage);
    bodies.forEach(body => observer.observe(body));
    measure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(resizeFrame);
      cancelAnimationFrame(frame.current);
      paint.current = () => {};
      busy.current = false;
    };
  }, [count]);

  const rotate = useCallback((direction: number, focusCard = false) => {
    if (busy.current) return;
    busy.current = true;
    setMoving(true);
    const start = phase.current;
    const target = start + direction;
    const started = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const next = ((target % count) + count) % count;
    const tick = (now: number) => {
      const progress = reducedMotion.matches ? 1 : Math.min(1, (now - started) / 600);
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      phase.current = start + (target - start) * eased;
      paint.current();
      if (progress < 1) frame.current = requestAnimationFrame(tick);
      else {
        setActive(next);
        setMoving(false);
        busy.current = false;
        if (focusCard) {
          // Wait for React to remove inert from the newly centered card.
          frame.current = requestAnimationFrame(() => stageRef.current?.querySelector<HTMLElement>(`[data-index="${next}"] h2`)?.focus({ preventScroll: true }));
        }
      }
    };
    frame.current = requestAnimationFrame(tick);
  }, [count]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || busy.current) return;
    if ((event.target as HTMLElement).closest("a,button")) return;
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.3) rotate(dx < 0 ? 1 : -1);
  };

  return {
    stageRef, active, moving, rotate,
    gestureHandlers: { onPointerDown, onPointerUp, onPointerCancel: () => { pointer.current = null; } },
  };
}
