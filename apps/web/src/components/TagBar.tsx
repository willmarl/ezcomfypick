import { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { apiClient } from "../api/client";

interface TagBarProps {
  imagePath: string | null;
  selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
  onAddTag: (tag: string) => void;
}

export const TagBar: React.FC<TagBarProps> = ({
  imagePath,
  selectedTags,
  onToggleTag,
  onAddTag,
}) => {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [imageTags, setImageTags] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        const tags = await apiClient.getAllTags();
        setAllTags(tags);
      } catch (err) {
        console.error("Failed to fetch all tags:", err);
      }
    };

    fetchAllTags();
  }, []);

  useEffect(() => {
    if (!imagePath) {
      setImageTags([]);
      return;
    }

    const fetchImageTags = async () => {
      try {
        const tags = await apiClient.getTags(imagePath);
        setImageTags(tags);
      } catch (err) {
        console.error("Failed to fetch image tags:", err);
      }
    };

    fetchImageTags();
  }, [imagePath]);

  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;

    onAddTag(trimmed);
    setNewTagInput("");
    setPopoverOpen(false);

    // Add to all tags if not already there
    if (!allTags.includes(trimmed)) {
      setAllTags([...allTags, trimmed].sort());
    }
  };

  if (!imagePath) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "12px 16px",
        background: "#0a0a0a",
        borderTop: "1px solid #1a1a1a",
        flexShrink: 0,
        marginTop: "24px",
      }}
    >
      {/* Image tags */}
      {imageTags.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              fontSize: "11px",
              color: "#6b6b6b",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Image Tags
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {imageTags.map((tag) => (
              <div
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 12px",
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "16px",
                  fontSize: "13px",
                  color: "#b0b0b0",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All tags + add button */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#6b6b6b",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Tags
          </div>
          <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
            <Popover.Trigger asChild>
              <button
                style={{
                  padding: "4px 8px",
                  background: "oklch(65% 0.18 145)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#0a0a0a",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                + Add
              </button>
            </Popover.Trigger>
            <Popover.Content
              side="top"
              align="end"
              style={{
                background: "#141414",
                border: "1px solid #2a2a2a",
                borderRadius: "12px",
                padding: "16px",
                zIndex: 500,
                boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  width: "200px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#f0ede8",
                  }}
                >
                  Add Custom Tag
                </div>
                <input
                  autoFocus
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCustomTag();
                  }}
                  placeholder="Tag name..."
                  style={{
                    padding: "10px 12px",
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                    color: "#f0ede8",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleAddCustomTag}
                  disabled={!newTagInput.trim()}
                  style={{
                    padding: "10px",
                    background: newTagInput.trim()
                      ? "oklch(65% 0.18 145)"
                      : "#1a1a1a",
                    border: "none",
                    borderRadius: "8px",
                    color: newTagInput.trim() ? "#0a0a0a" : "#6b6b6b",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: newTagInput.trim() ? "pointer" : "default",
                    transition: "all 0.2s",
                  }}
                >
                  Add Tag
                </button>
              </div>
              <Popover.Arrow
                style={{
                  fill: "#141414",
                  stroke: "#2a2a2a",
                  strokeWidth: 1,
                }}
              />
            </Popover.Content>
          </Popover.Root>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {allTags.map((tag) => {
            const isSelected = selectedTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                style={{
                  padding: "6px 12px",
                  background: isSelected
                    ? "oklch(65% 0.18 145 / 0.2)"
                    : "#1a1a1a",
                  border: `1px solid ${isSelected ? "oklch(65% 0.18 145 / 0.6)" : "#2a2a2a"}`,
                  borderRadius: "16px",
                  fontSize: "13px",
                  color: isSelected ? "oklch(65% 0.18 145)" : "#b0b0b0",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "inherit",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
