import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const collections = useCollections();

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
          {images.map((imagePath) => (
            <button
              key={imagePath}
              onClick={() => setPreviewImage(imagePath)}
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

      {/* Image preview dialog */}
      <Dialog.Root open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              zIndex: 50,
            }}
          />
          <Dialog.Content
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#141414',
              borderRadius: '16px',
              padding: '20px',
              zIndex: 50,
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {previewImage && (
              <>
                <img
                  src={apiClient.getGalleryImageUrl(previewImage)}
                  alt={previewImage}
                  style={{
                    maxWidth: '80vw',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#6b6b6b', textAlign: 'center' }}>
                  {previewImage.split('/').pop()}
                </div>
              </>
            )}
            <Dialog.Close asChild>
              <button
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  color: '#6b6b6b',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  lineHeight: 1,
                }}
              >
                <X size={24} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
