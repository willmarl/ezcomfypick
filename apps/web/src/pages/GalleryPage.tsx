import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MoreHorizontal } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { GalleryActionSheet } from '../components/sheets/GalleryActionSheet';
import { RenameCollectionSheet } from '../components/sheets/RenameCollectionSheet';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Virtual } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/virtual';
import '../styles/gallery-swiper.css';
import { apiClient } from '../api/client';
import { useCollections } from '../hooks/useCollections';
import { Header } from '../components/Header';

const isVideo = (path: string) => /\.(mp4|webm|mov)$/i.test(path);

const getMediaUrl = (path: string, isTrash: boolean, isQueue: boolean): string => {
  if (isTrash) return apiClient.getTrashImageUrl(path);
  if (isQueue) return apiClient.getQueueImageUrl(path);
  return apiClient.getGalleryImageUrl(path);
};

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
  const [contextMenuCollection, setContextMenuCollection] = useState<any | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [showRename, setShowRename] = useState(false);
  const [renameCollection, setRenameCollection] = useState<any | null>(null);
  const [contextTag, setContextTag] = useState<string | null>(null);
  const [contextTagPos, setContextTagPos] = useState({ x: 0, y: 0 });
  const [showRenameTag, setShowRenameTag] = useState(false);
  const [renameTagInput, setRenameTagInput] = useState('');
  const [showDeleteTagConfirm, setShowDeleteTagConfirm] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renameTagInputRef = useRef<HTMLInputElement>(null);
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
        let result;
        if (selectedCollection === '__trash__') {
          result = await apiClient.getTrashImages(newOffset, 30);
        } else if (selectedCollection === '__queue__') {
          result = await apiClient.getQueueImages(newOffset, 30);
        } else {
          result = await apiClient.getGalleryImages(
            selectedCollection || undefined,
            selectedTags.length > 0 ? selectedTags : undefined,
            newOffset,
            30
          );
        }
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

  const handleRenameTag = async (newTag: string) => {
    if (!contextTag || !newTag.trim() || newTag.trim() === contextTag) {
      setShowRenameTag(false);
      setContextTag(null);
      return;
    }
    try {
      await apiClient.renameTag(contextTag, newTag.trim());
      setAllTags((prev) =>
        prev.map((t) => (t === contextTag ? newTag.trim() : t))
      );
      setSelectedTags((prev) =>
        prev.map((t) => (t === contextTag ? newTag.trim() : t))
      );
      setShowRenameTag(false);
      setContextTag(null);
    } catch (err) {
      console.error('Failed to rename tag:', err);
      alert(`Failed to rename tag: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteTag = async () => {
    if (!contextTag) return;
    try {
      await apiClient.deleteTag(contextTag);
      setAllTags((prev) => prev.filter((t) => t !== contextTag));
      setSelectedTags((prev) => prev.filter((t) => t !== contextTag));
      setShowDeleteTagConfirm(false);
      setContextTag(null);
    } catch (err) {
      console.error('Failed to delete tag:', err);
      alert(`Failed to delete tag: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteCollection = async () => {
    if (!contextMenuCollection) return;
    const folder = contextMenuCollection.folder;
    setContextMenuCollection(null);
    try {
      await apiClient.deleteCollection(folder);
      if (selectedCollection === folder) setSelectedCollection('');
      collections.refetch();
    } catch (err) {
      console.error('Failed to delete collection:', err);
      alert(`Failed to delete collection: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleRename = async (newName: string, newEmoji: string) => {
    if (!renameCollection) return;
    const folder = renameCollection.folder;
    try {
      await apiClient.updateCollection(folder, { emoji: newEmoji });
      await apiClient.renameCollection(folder, newName);
      if (selectedCollection === folder) setSelectedCollection(newName);
      collections.refetch();
      setShowRename(false);
      setRenameCollection(null);
    } catch (err) {
      console.error('Failed to rename collection:', err);
      alert(`Failed to rename collection: ${err instanceof Error ? err.message : String(err)}`);
    }
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
          onClick={() => {
            setSelectedCollection('');
            setShowActions(false);
          }}
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
            onClick={() => {
              setSelectedCollection(col.folder);
              setShowActions(false);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenuCollection(col);
              setContextMenuPos({ x: e.clientX, y: e.clientY });
            }}
            onPointerDown={(e) => {
              longPressTimer.current = setTimeout(() => {
                setContextMenuCollection(col);
                setContextMenuPos({ x: e.clientX, y: e.clientY });
              }, 500);
            }}
            onPointerUp={() => {
              if (longPressTimer.current) clearTimeout(longPressTimer.current);
            }}
            onPointerLeave={() => {
              if (longPressTimer.current) clearTimeout(longPressTimer.current);
            }}
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
        <button
          onClick={() => {
            setSelectedCollection('__queue__');
            setShowActions(false);
          }}
          style={{
            padding: '8px 14px',
            borderRadius: '100px',
            border: selectedCollection === '__queue__' ? '1.5px solid oklch(65% 0.18 145 / 0.6)' : '1.5px solid #242424',
            background: selectedCollection === '__queue__' ? 'oklch(65% 0.18 145 / 0.12)' : '#141414',
            color: selectedCollection === '__queue__' ? 'oklch(72% 0.16 145)' : '#6b6b6b',
            fontSize: '13px',
            fontWeight: selectedCollection === '__queue__' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '14px' }}>⏱️</span>
          <span>Queue</span>
        </button>
        <button
          onClick={() => {
            setSelectedCollection('__trash__');
            setShowActions(false);
          }}
          style={{
            padding: '8px 14px',
            borderRadius: '100px',
            border: selectedCollection === '__trash__' ? '1.5px solid oklch(65% 0.18 145 / 0.6)' : '1.5px solid #242424',
            background: selectedCollection === '__trash__' ? 'oklch(65% 0.18 145 / 0.12)' : '#141414',
            color: selectedCollection === '__trash__' ? 'oklch(72% 0.16 145)' : '#6b6b6b',
            fontSize: '13px',
            fontWeight: selectedCollection === '__trash__' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '14px' }}>🗑️</span>
          <span>Trash</span>
        </button>
      </div>

      {/* Tag filter pills / Empty Trash button / Queue info */}
      {selectedCollection !== '__trash__' && selectedCollection !== '__queue__' ? (
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
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextTag(tag);
                  setContextTagPos({ x: e.clientX, y: e.clientY });
                }}
                onPointerDown={(e) => {
                  tagLongPressTimer.current = setTimeout(() => {
                    setContextTag(tag);
                    setContextTagPos({ x: e.clientX, y: e.clientY });
                  }, 500);
                }}
                onPointerUp={() => {
                  if (tagLongPressTimer.current) clearTimeout(tagLongPressTimer.current);
                }}
                onPointerLeave={() => {
                  if (tagLongPressTimer.current) clearTimeout(tagLongPressTimer.current);
                }}
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
      ) : images.length > 0 ? (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={async () => {
              try {
                await apiClient.trashEmpty();
                setImages([]);
              } catch (err) {
                console.error('Empty trash failed:', err);
                alert('Failed to empty trash');
              }
            }}
            style={{
              padding: '6px 14px',
              background: 'none',
              border: 'none',
              color: '#e05555',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500,
            }}
          >
            Empty Trash
          </button>
        </div>
      ) : null}

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
              {isVideo(imagePath) ? (
                <video
                  src={getMediaUrl(imagePath, selectedCollection === '__trash__', selectedCollection === '__queue__')}
                  preload="metadata"
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <img
                  src={getMediaUrl(imagePath, selectedCollection === '__trash__', selectedCollection === '__queue__')}
                  alt={imagePath}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              )}
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
                    {isVideo(imagePath) ? (
                      <video
                        src={getMediaUrl(imagePath, selectedCollection === '__trash__', selectedCollection === '__queue__')}
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                        draggable={false}
                      />
                    ) : (
                      <img
                        src={getMediaUrl(imagePath, selectedCollection === '__trash__', selectedCollection === '__queue__')}
                        alt={imagePath}
                        draggable={false}
                      />
                    )}
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
                const thumbStyle = {
                  width: isCurrent ? 52 : 40,
                  height: isCurrent ? 52 : 40,
                  objectFit: 'cover' as const,
                  borderRadius: '6px',
                  border: isCurrent ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.2)',
                  opacity: isCurrent ? 1 : 0.6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                };
                return isVideo(imagePath) ? (
                  <video
                    key={`thumb-${idx}-${imagePath}`}
                    src={getMediaUrl(imagePath, selectedCollection === '__trash__', selectedCollection === '__queue__')}
                    preload="metadata"
                    muted
                    onClick={() => swiperRef.current?.slideTo(idx)}
                    style={thumbStyle}
                  />
                ) : (
                  <img
                    key={`thumb-${idx}-${imagePath}`}
                    src={getMediaUrl(imagePath, selectedCollection === '__trash__', selectedCollection === '__queue__')}
                    alt={imagePath}
                    onClick={() => swiperRef.current?.slideTo(idx)}
                    style={thumbStyle}
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

      {/* Collection context menu */}
      {contextMenuCollection && (
        <>
          <div
            onClick={() => setContextMenuCollection(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 150 }}
          />
          <div
            style={{
              position: 'fixed',
              top: contextMenuPos.y,
              left: contextMenuPos.x,
              zIndex: 151,
              background: '#1e1e1e',
              border: '1px solid #2a2a2a',
              borderRadius: 10,
              overflow: 'hidden',
              minWidth: 160,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <button
              onClick={() => {
                setRenameCollection(contextMenuCollection);
                setShowRename(true);
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'none',
                border: 'none',
                color: '#d0cdc8',
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                borderBottom: '1px solid #2a2a2a',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#242424';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              Rename
            </button>
            <button
              onClick={handleDeleteCollection}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'none',
                border: 'none',
                color: '#e05555',
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#242424';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              Delete collection
            </button>
          </div>
        </>
      )}

      <RenameCollectionSheet
        visible={showRename}
        onClose={() => {
          setShowRename(false);
          setContextMenuCollection(null);
          setRenameCollection(null);
        }}
        collection={renameCollection}
        onRename={handleRename}
      />

      <GalleryActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        imagePath={actionSheetImagePath}
        collections={collections.collections}
        allTags={allTags}
        isTrash={selectedCollection === '__trash__'}
        isQueue={selectedCollection === '__queue__'}
        onActionComplete={(action, newPath) => {
          if (action === 'move' && newPath && !selectedCollection.startsWith('__')) {
            setImages((prev) => prev.map((p, i) => (i === activeIndex ? newPath : p)));
          } else {
            setImages((prev) => prev.filter((_, i) => i !== activeIndex));
            setPreviewIndex(null);
          }
        }}
      />

      {/* Tag context menu */}
      {contextTag && (
        <>
          <div
            onClick={() => setContextTag(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 150 }}
          />
          <div
            style={{
              position: 'fixed',
              top: contextTagPos.y,
              left: contextTagPos.x,
              zIndex: 151,
              background: '#1e1e1e',
              border: '1px solid #2a2a2a',
              borderRadius: 10,
              overflow: 'hidden',
              minWidth: 140,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <button
              onClick={() => {
                setShowRenameTag(true);
                setRenameTagInput(contextTag);
                setTimeout(() => renameTagInputRef.current?.focus(), 50);
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'none',
                border: 'none',
                color: '#d0cdc8',
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                borderBottom: '1px solid #2a2a2a',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#242424';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              Rename
            </button>
            <button
              onClick={() => {
                setShowDeleteTagConfirm(true);
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'none',
                border: 'none',
                color: '#e05555',
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#242424';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}

      {/* Rename tag dialog */}
      {showRenameTag && contextTag && (
        <>
          <div
            onClick={() => setShowRenameTag(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 300,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#141414',
              border: '1.5px solid #2a2a2a',
              borderRadius: 12,
              padding: '20px',
              zIndex: 301,
              minWidth: 280,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#6b6b6b', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                New tag name
              </label>
              <input
                ref={renameTagInputRef}
                value={renameTagInput}
                onChange={(e) => setRenameTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameTag(renameTagInput);
                  if (e.key === 'Escape') setShowRenameTag(false);
                }}
                placeholder="Enter new tag name"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#1e1e1e',
                  border: '1.5px solid #2a2a2a',
                  borderRadius: 10,
                  color: '#f0ede8',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowRenameTag(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#1e1e1e',
                  border: '1.5px solid #2a2a2a',
                  borderRadius: 10,
                  color: '#d0cdc8',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRenameTag(renameTagInput)}
                disabled={!renameTagInput.trim() || renameTagInput.trim() === contextTag}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: renameTagInput.trim() && renameTagInput.trim() !== contextTag ? 'oklch(65% 0.18 145)' : '#1e1e1e',
                  border: 'none',
                  borderRadius: 10,
                  color: renameTagInput.trim() && renameTagInput.trim() !== contextTag ? '#0a0a0a' : '#3a3a3a',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: renameTagInput.trim() && renameTagInput.trim() !== contextTag ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                }}
              >
                Rename
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete tag confirmation */}
      {showDeleteTagConfirm && contextTag && (
        <>
          <div
            onClick={() => setShowDeleteTagConfirm(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 300,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#141414',
              border: '1.5px solid #2a2a2a',
              borderRadius: 12,
              padding: '20px',
              zIndex: 301,
              minWidth: 280,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <p style={{ color: '#d0cdc8', fontSize: 14, margin: '0 0 4px 0' }}>
                Delete tag "{contextTag}"?
              </p>
              <p style={{ color: '#6b6b6b', fontSize: 12, margin: 0 }}>
                This will remove the tag from all images.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowDeleteTagConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#1e1e1e',
                  border: '1.5px solid #2a2a2a',
                  borderRadius: 10,
                  color: '#d0cdc8',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTag}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#e05555',
                  border: 'none',
                  borderRadius: 10,
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
