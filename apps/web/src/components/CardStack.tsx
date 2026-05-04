import { forwardRef, useRef, useImperativeHandle } from 'react';
import { SwipeCard } from './SwipeCard';

interface CardStackProps {
  images: string[];
  onSwipe: (dir: 'left' | 'right', path: string) => void;
  isMagnified: boolean;
}

interface CardStackHandle {
  flyOut: (dir: 'left' | 'right') => void;
}

export const CardStack = forwardRef<CardStackHandle, CardStackProps>(
  ({ images, onSwipe, isMagnified }, ref) => {
    const topCardRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      flyOut: (dir: 'left' | 'right') => {
        topCardRef.current?.flyOut(dir);
      },
    }));

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', padding: '8px 16px 0', zIndex: 0, overflow: 'hidden' }}>
        {images.slice(0, 3).map((imagePath, i) => (
          <SwipeCard
            key={imagePath}
            ref={i === 0 ? topCardRef : undefined}
            imagePath={imagePath}
            isTop={i === 0}
            stackIndex={i}
            onSwipe={onSwipe}
            isMagnified={i === 0 ? isMagnified : false}
          />
        ))}
      </div>
    );
  }
);

CardStack.displayName = 'CardStack';
