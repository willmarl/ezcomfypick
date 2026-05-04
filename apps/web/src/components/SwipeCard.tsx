import { forwardRef, useRef, useState, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { apiClient } from '../api/client';

interface SwipeCardProps {
  imagePath: string;
  isTop: boolean;
  stackIndex: number;
  onSwipe: (dir: 'left' | 'right', path: string) => void;
  isMagnified: boolean;
}

interface SwipeCardHandle {
  flyOut: (dir: 'left' | 'right') => void;
}

const THRESHOLD = 100;
const ROT_FACTOR = 0.08;

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  ({ imagePath, isTop, stackIndex, onSwipe, isMagnified }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const startRef = useRef<{ x: number; y: number } | null>(null);
    const dragRef = useRef({ x: 0, y: 0, active: false });
    const [drag, setDrag] = useState({ x: 0, y: 0 });
    const [releasing, setReleasing] = useState(false);
    const [gone, setGone] = useState(false);

    const getPointer = (e: PointerEvent | React.PointerEvent) => ({
      x: e.clientX,
      y: e.clientY,
    });

    const onPointerDown = useCallback((e: React.PointerEvent) => {
      if (!isTop || isMagnified) return;
      e.preventDefault();
      const p = getPointer(e);
      startRef.current = p;
      dragRef.current = { x: 0, y: 0, active: true };

      const handleMove = (e: PointerEvent) => {
        if (!dragRef.current.active) return;
        e.preventDefault();
        const p = getPointer(e);
        if (!startRef.current) return;
        const dx = p.x - startRef.current.x;
        const dy = p.y - startRef.current.y;
        dragRef.current = { x: dx, y: dy, active: true };
        setDrag({ x: dx, y: dy });
      };

      const handleUp = () => {
        if (!dragRef.current.active) return;
        dragRef.current.active = false;
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);

        const { x } = dragRef.current;
        if (Math.abs(x) > THRESHOLD) {
          const dir = x > 0 ? 'right' : 'left';
          flyOut(dir);
        } else {
          setReleasing(true);
          setDrag({ x: 0, y: 0 });
          setTimeout(() => setReleasing(false), 300);
        }
      };

      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
    }, [isTop, isMagnified]);

    const flyOut = useCallback((dir: 'left' | 'right') => {
      setReleasing(true);
      const targetX = dir === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
      setDrag({ x: targetX, y: dragRef.current.y || 0 });
      setTimeout(() => {
        setGone(true);
        onSwipe(dir, imagePath);
      }, 350);
    }, [imagePath, onSwipe]);

    if (gone) return null;

    const rot = drag.x * ROT_FACTOR;
    const keepOpacity = Math.min(Math.max(drag.x / THRESHOLD, 0), 1);
    const deleteOpacity = Math.min(Math.max(-drag.x / THRESHOLD, 0), 1);

    const scale = isTop ? 1 : stackIndex === 1 ? 0.95 : 0.9;
    const translateY = isTop ? 0 : stackIndex === 1 ? 18 : 34;

    return (
      <div
        ref={cardRef}
        onPointerDown={isTop ? onPointerDown : undefined}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: isTop ? 'grab' : 'default',
          userSelect: 'none',
          willChange: 'transform',
          transform: `translateY(${translateY}px) scale(${scale}) translateX(${drag.x}px) translateY(${drag.y * 0.3}px) rotate(${rot}deg)`,
          transition: releasing ? 'transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275)' : 'none',
          zIndex: isTop ? 10 : stackIndex === 1 ? 9 : 8,
          transformOrigin: '50% 100%',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: isTop
              ? '0 24px 80px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4)'
              : '0 8px 24px rgba(0,0,0,0.4)',
            background: '#141414',
            position: 'relative',
          }}
        >
          {isMagnified ? (
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={6}
              doubleClick={{ mode: 'zoomIn' }}
              centerOnInit
            >
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ width: '100%', height: '100%' }}
              >
                <img
                  src={apiClient.getImageUrl(imagePath)}
                  alt={imagePath}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </TransformComponent>
            </TransformWrapper>
          ) : (
            <img
              src={apiClient.getImageUrl(imagePath)}
              alt={imagePath}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}

          {/* KEEP overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `oklch(65% 0.18 145 / ${keepOpacity * 0.55})`,
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              padding: '28px',
              pointerEvents: 'none',
              opacity: keepOpacity,
            }}
          >
            <div
              style={{
                border: '3px solid oklch(65% 0.18 145)',
                borderRadius: '10px',
                padding: '6px 16px',
                color: 'oklch(65% 0.18 145)',
                fontSize: '26px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                transform: 'rotate(-8deg)',
                textShadow: '0 0 20px oklch(65% 0.18 145 / 0.6)',
              }}
            >
              KEEP
            </div>
          </div>

          {/* SKIP overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `oklch(62% 0.2 25 / ${deleteOpacity * 0.55})`,
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              padding: '28px',
              pointerEvents: 'none',
              opacity: deleteOpacity,
            }}
          >
            <div
              style={{
                border: '3px solid oklch(62% 0.2 25)',
                borderRadius: '10px',
                padding: '6px 16px',
                color: 'oklch(62% 0.2 25)',
                fontSize: '26px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                transform: 'rotate(8deg)',
                textShadow: '0 0 20px oklch(62% 0.2 25 / 0.6)',
              }}
            >
              SKIP
            </div>
          </div>

          {/* filename tag */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '5px 14px',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.55)',
                fontFamily: 'monospace',
                letterSpacing: '0.02em',
                maxWidth: '80%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {imagePath.split('/').pop()}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SwipeCard.displayName = 'SwipeCard';
