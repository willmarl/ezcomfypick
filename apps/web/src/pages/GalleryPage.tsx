import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MoreHorizontal } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { GalleryActionSheet } from '../components/sheets/GalleryActionSheet';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Virtual } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/virtual';
import '../styles/gallery-swiper.css';
import { apiClient } from '../api/client';
import { useCollections } from '../hooks/useCollections';
import { Header } from '../components/Header';

export const GalleryPage: React.FC = () => {
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [actionSheetImagePath, setActionSheetImagePath] = useState<string | null>(null);
  const downSwipeRef = useRef({ y: 0, x: 0 });
  const swiperRef = useRef<SwiperType | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const collections = useCollections();

  // Sync activeIndex when dialog opens
  useEffect(() => {
    if (previewIndex !== null) {
      setActiveIndex(previewIndex);
    }
  }, [previewIndex]);

  // Fetch all tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await apiClient.getAllTags();
        setAllTags(tags);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };
    fetchTags();
  }, []);

  // Fetch gallery images
  const fetchGalleryImages = useCallback(
    async (newOffset: number = 0) => {
      setLoading(true);
      try {
        const result = await apiClient.getGalleryImages(
          selectedCollection || undefined,
          selectedTags.length > 0 ? selectedTags : undefined,
          newOffset,
          30
        );
        if (newOffset === 0) {
          setImages(result.images);
        } else {
          setImages((prev) => [...prev, ...result.images]);
        }
        setOffset(newOffset + result.images.length);
        setHasMore(result.has_more);
      } catch (err) {
        console.error('Failed to fetch gallery images:', err);
      } finally {
        setLoading(false);
      }
    },
    [selectedCollection, selectedTags]
  );

  // Fetch when filters change
  useEffect(() => {
    setOffset(0);
    setImages([]);
    setPreviewIndex(null);
    fetchGalleryImages(0);
  }, [selectedCollection, selectedTags, fetchGalleryImages]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading) {
        fetchGalleryImages(offset);
      }
    });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [offset, hasMore, loading, fetchGalleryImages]);

  // Load more when near end of gallery in preview
  useEffect(() => {
    if (previewIndex !== null && previewIndex >= images.length - 3 && hasMore && !loading) {
      fetchGalleryImages(offset);
    }
  }, [previewIndex, images.length, hasMore, loading, offset, fetchGalleryImages]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#090909',
        overflow: 'hidden',
      }}
    >
      <Header
        count={0}
        canUndo={false}
        onUndo={() => {}}
        onSettings={() => {}}
      />

      {/* Collection filter pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '12px 16px',
          scrollbarWidth: 'none',
          borderBottom: '1px solid #1a1a1a',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setSelectedCollection('')}
          style={{
            padding: '8px 14px',
            borderRadius: '100px',
            border: selectedCollection === '' ? '1.5px solid oklch(65% 0.18 145 / 0.6)' : '1.5px solid #242424',
            background: selectedCollection === '' ? 'oklch(65% 0.18 145 / 0.12)' : '#141414',
            color: selectedCollection === '' ? 'oklch(72% 0.16 145)' : '#6b6b6b',
            fontSize: '13px',
            fontWeight: selectedCollection === '' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          All
        </button>
        {collections.collections.map((col) => (
          <button
            key={col.folder}
            onClick={() => setSelectedCollection(col.folder)}
            style={{
              padding: '8px 14px',
              borderRadius: '100px',
              border: selectedCollection === col.folder ? '1.5px solid oklch(65% 0.18 145 / 0.6)' : '1.5px solid #242424',
              background: selectedCollection === col.folder ? 'oklch(65% 0.18 145 / 0.12)' : '#141414',
              color: selectedCollection === col.folder ? 'oklch(72% 0.16 145)' : '#6b6b6b',
              fontSize: '13px',
              fontWeight: selectedCollection === col.folder ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '14px' }}>{col.emoji || '📁'}</span>
            <span>{col.name}</span>
          </button>
        ))}
      </div>

      {/* Tag filter pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          overflowX: 'auto',
          padding: '12px 16px',
          scrollbarWidth: 'none',
          borderBottom: '1px solid #1a1a1a',
          flexShrink: 0,
        }}
      >
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              style={{
                padding: '6px 12px',
                background: isSelected ? 'oklch(65% 0.18 145 / 0.2)' : '#1a1a1a',
                border: `1px solid ${isSelected ? 'oklch(65% 0.18 145 / 0.6)' : '#2a2a2a'}`,
                borderRadius: '16px',
                fontSize: '13px',
                color: isSelected ? 'oklch(65% 0.18 145)' : '#b0b0b0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Image grid */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          scrollbarWidth: 'none',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2px',
          }}
        >
          {images.map((imagePath, idx) => (
            <button
              key={imagePath}
              onClick={() => setPreviewIndex(idx)}
              style={{
                aspectRatio: '1 / 1',
                background: '#141414',
                border: 'none',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <img
                src={apiClient.getGalleryImageUrl(imagePath)}
                alt={imagePath}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </button>
          ))}
        </div>
        <div ref={sentinelRef} style={{ height: '40px', marginTop: '40px' }} />
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6b6b6b', fontSize: '14px' }}>
            Loading...
          </div>
        )}
      </div>

      {/* Image preview dialog with Swiper */}
      <Dialog.Root open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 50,
            }}
          />
          <Dialog.Content
            style={{
              position: 'fixed',
              inset: 0,
              background: 'transparent',
              zIndex: 50,
              padding: 0,
              border: 'none',
            }}
          >
            <Dialog.Title style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
              Image viewer
            </Dialog.Title>
            <Dialog.Description style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
              View and manage gallery images
            </Dialog.Description>
            {/* Down-swipe to close wrapper */}
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPointerDown={(e) => {
                downSwipeRef.current = { y: e.clientY, x: e.clientX };
              }}
              onPointerUp={(e) => {
                const dy = e.clientY - downSwipeRef.current.y;
                const dx = e.clientX - downSwipeRef.current.x;
                if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
                  setPreviewIndex(null);
                }
              }}
            >
              <Swiper
                key="swiper-viewer"
                modules={[Virtual]}
                virtual
                slidesPerView={1}
                spaceBetween={0}
                initialSlide={previewIndex ?? 0}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                onSlideChange={(swiper) => {
                  setActiveIndex(swiper.activeIndex);
                }}
                style={{ width: '100%', height: '100%' }}
              >
                {images.map((imagePath, idx) => (
                  <SwiperSlide key={imagePath} virtualIndex={idx}>
                    <img
                      src={apiClient.getGalleryImageUrl(imagePath)}
                      alt={imagePath}
                      draggable={false}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Thumbnail strip */}
            <div
              style={{
                position: 'absolute',
                bottom: '50px',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px',
                padding: '0 16px',
                pointerEvents: 'auto',
                zIndex: 100,
              }}
            >
              {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
                const idx = activeIndex + offset;
                if (idx < 0 || idx >= images.length) {
                  return (
                    <div
                      key={`empty-${offset}`}
                      style={{
                        width: offset === 0 ? 52 : 40,
                        height: offset === 0 ? 52 : 40,
                        flexShrink: 0,
                      }}
                    />
                  );
                }
                const isCurrent = offset === 0;
                const imagePath = images[idx];
                return (
                  <img
                    key={`thumb-${idx}-${imagePath}`}
                    src={apiClient.getGalleryImageUrl(imagePath)}
                    alt={imagePath}
                    onClick={() => swiperRef.current?.slideTo(idx)}
                    style={{
                      width: isCurrent ? 52 : 40,
                      height: isCurrent ? 52 : 40,
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: isCurrent ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.2)',
                      opacity: isCurrent ? 1 : 0.6,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                  />
                );
              })}
            </div>

            {/* Actions button */}
            <button
              onClick={() => {
                setActionSheetImagePath(images[activeIndex] ?? null);
                setShowActions(true);
              }}
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                lineHeight: 1,
                zIndex: 100,
              }}
            >
              <MoreHorizontal size={24} />
            </button>

            {/* Close button */}
            <Dialog.Close asChild>
              <button
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  lineHeight: 1,
                  zIndex: 100,
                }}
              >
                <X size={24} />
              </button>
            </Dialog.Close>

            {/* Filename */}
            {previewIndex !== null && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '0',
                  right: '0',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '12px',
                  pointerEvents: 'none',
                }}
              >
                {images[activeIndex]?.split('/').pop()}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <GalleryActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        imagePath={actionSheetImagePath}
        collections={collections.collections}
        allTags={allTags}
        onActionComplete={(action, newPath) => {
          if (action === 'move' && newPath) {
            setImages((prev) => prev.map((p, i) => (i === activeIndex ? newPath : p)));
          } else {
            setImages((prev) => prev.filter((_, i) => i !== activeIndex));
            setPreviewIndex(null);
          }
        }}
      />
    </div>
  );
};
