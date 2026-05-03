import json
from pathlib import Path
from typing import Optional, List, Dict
from pydantic import BaseModel


class Collection(BaseModel):
    folder: str
    name: str
    emoji: str = "📁"
    image_count: int = 0


def get_metadata_file(collections_dir: Path) -> Path:
    """Get path to the metadata JSON file in collections_dir."""
    return collections_dir / ".metadata.json"


def read_all_metadata(collections_dir: Path) -> Dict[str, str]:
    """Read all collection metadata from .metadata.json. Returns {folder: emoji, ...}."""
    metadata_file = get_metadata_file(collections_dir)
    if metadata_file.exists():
        try:
            with open(metadata_file, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def write_all_metadata(collections_dir: Path, metadata: Dict[str, str]) -> None:
    """Write all collection metadata to .metadata.json."""
    collections_dir.mkdir(parents=True, exist_ok=True)
    metadata_file = get_metadata_file(collections_dir)
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)


def count_images(collections_dir: Path, folder: str) -> int:
    """Count image files in a collection folder."""
    folder_path = collections_dir / folder
    if not folder_path.exists():
        return 0

    image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
    count = 0
    try:
        for item in folder_path.iterdir():
            if item.is_file() and item.suffix.lower() in image_extensions:
                count += 1
    except Exception:
        pass
    return count


def get_collection(collections_dir: Path, folder: str) -> Optional[Collection]:
    """Get a single collection with metadata and image count."""
    folder_path = collections_dir / folder
    if not folder_path.exists():
        return None

    metadata = read_all_metadata(collections_dir)
    emoji = metadata.get(folder, "📁")
    image_count = count_images(collections_dir, folder)

    return Collection(
        folder=folder,
        name=folder,
        emoji=emoji,
        image_count=image_count,
    )


def get_all_collections(collections_dir: Path) -> List[Collection]:
    """Get all collections with metadata."""
    if not collections_dir.exists():
        return []

    collections = []
    for folder_path in sorted(collections_dir.iterdir()):
        if folder_path.is_dir() and not folder_path.name.startswith('.'):
            collection = get_collection(collections_dir, folder_path.name)
            if collection:
                collections.append(collection)

    return collections


def update_collection_metadata(
    collections_dir: Path,
    folder: str,
    name: Optional[str] = None,
    emoji: Optional[str] = None,
    description: Optional[str] = None,
) -> Optional[Collection]:
    """Update metadata for a collection and return the updated collection."""
    folder_path = collections_dir / folder
    if not folder_path.exists():
        return None

    # Read existing metadata
    metadata = read_all_metadata(collections_dir)

    # Update emoji if provided
    if emoji is not None:
        metadata[folder] = emoji

    # Write updated metadata
    write_all_metadata(collections_dir, metadata)

    # Return updated collection
    return get_collection(collections_dir, folder)
