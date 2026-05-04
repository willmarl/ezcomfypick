import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from pathlib import Path
from typing import Optional
import shutil
from sqlalchemy import select, update, delete

from collection_manager import (
    get_all_collections,
    get_collection,
    update_collection_metadata,
    Collection,
)
from database import init_db, get_session, ImageTag

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMAGE_DIR = Path(os.environ.get("IMAGE_DIR", "/home/cat/Pictures/test/"))
OUTPUT_DIR = IMAGE_DIR / "output"
COLLECTIONS_DIR = IMAGE_DIR / "good-output"
TRASH_DIR = IMAGE_DIR / "trash-output"
MEDIA_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov"}

MIME_TYPES = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
    ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
}

def get_mime_type(path: Path) -> str:
    return MIME_TYPES.get(path.suffix.lower(), "application/octet-stream")


def ensure_dirs():
    """Create required directories if they don't exist."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    COLLECTIONS_DIR.mkdir(parents=True, exist_ok=True)
    TRASH_DIR.mkdir(parents=True, exist_ok=True)

    # Create default collection if it doesn't exist
    default_collection = COLLECTIONS_DIR / "default"
    default_collection.mkdir(parents=True, exist_ok=True)

    # Ensure metadata file exists
    from collection_manager import read_all_metadata, write_all_metadata
    metadata = read_all_metadata(COLLECTIONS_DIR)

    # Ensure "default" collection is in metadata (metadata format is {folder: emoji})
    if "default" not in metadata:
        metadata["default"] = "⭐"

    write_all_metadata(COLLECTIONS_DIR, metadata)

    # Initialize database
    init_db(COLLECTIONS_DIR / "ezcomfypick.db")


def validate_image_path(image_path: str) -> Path:
    """Validate and return a safe path within OUTPUT_DIR. Prevents path traversal attacks."""
    try:
        safe_path = (OUTPUT_DIR / image_path).resolve()
        if not str(safe_path).startswith(str(OUTPUT_DIR.resolve())):
            raise HTTPException(status_code=400, detail="Invalid path")
        if not safe_path.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        return safe_path
    except (ValueError, RuntimeError):
        raise HTTPException(status_code=400, detail="Invalid path")


def get_all_images() -> list[str]:
    """Recursively get all image paths relative to OUTPUT_DIR."""
    if not OUTPUT_DIR.exists():
        return []

    images = []
    for root, _, files in os.walk(OUTPUT_DIR):
        for file in files:
            if Path(file).suffix.lower() in MEDIA_EXTENSIONS:
                full_path = Path(root) / file
                relative_path = full_path.relative_to(OUTPUT_DIR)
                images.append(str(relative_path))

    return sorted(images)


# Pydantic models
class SwipeKeepRequest(BaseModel):
    image_path: str
    collection: str


class SwipeTrashRequest(BaseModel):
    image_path: str


class UndoRequest(BaseModel):
    image_path: str
    action: str  # "keep" or "trash"
    collection: Optional[str] = None


# Ensure directories exist on startup
ensure_dirs()


class SwipeResponse(BaseModel):
    ok: bool
    error: Optional[str] = None
    undo: Optional[dict] = None


class CollectionCreateRequest(BaseModel):
    name: str


# Routes
@app.get("/api/hello")
def read_root():
    return {"message": "Hello!"}


@app.get("/api/images")
def list_images():
    """Return all image paths relative to OUTPUT_DIR."""
    try:
        images = get_all_images()
        return {"images": images}
    except Exception as e:
        return {"images": [], "error": str(e)}


@app.get("/api/image-file/{path:path}")
def get_image_file(path: str):
    """Serve the actual image file."""
    try:
        file_path = validate_image_path(path)
        return FileResponse(file_path, media_type=get_mime_type(file_path))
    except HTTPException:
        raise


@app.get("/api/collections")
def list_collections():
    """List all collections with metadata."""
    try:
        collections = get_all_collections(COLLECTIONS_DIR)
        return {"collections": collections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/collections")
def create_collection(req: CollectionCreateRequest):
    """Create a new collection folder."""
    try:
        collection_path = COLLECTIONS_DIR / req.name
        collection_path.mkdir(parents=True, exist_ok=True)
        collection = get_collection(COLLECTIONS_DIR, req.name)
        return {"ok": True, "collection": collection}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/collections/{folder}")
def get_collection_detail(folder: str):
    """Get a specific collection with metadata."""
    try:
        collection = get_collection(COLLECTIONS_DIR, folder)
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        return collection
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UpdateCollectionRequest(BaseModel):
    name: Optional[str] = None
    emoji: Optional[str] = None
    description: Optional[str] = None


class RenameCollectionRequest(BaseModel):
    new_name: str


class AddTagRequest(BaseModel):
    tag: str


@app.put("/api/collections/{folder}")
def update_collection(folder: str, req: UpdateCollectionRequest):
    """Update a collection's metadata (name, emoji, description)."""
    try:
        collection = update_collection_metadata(
            COLLECTIONS_DIR,
            folder,
            name=req.name,
            emoji=req.emoji,
            description=req.description,
        )
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        return collection
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/collections/{folder}/rename")
def rename_collection_endpoint(folder: str, req: RenameCollectionRequest, session = Depends(get_session)):
    """Rename a collection folder and re-key all image tags."""
    try:
        new_name = req.new_name.strip()
        if not new_name:
            raise HTTPException(status_code=400, detail="Name cannot be empty")

        old_path = COLLECTIONS_DIR / folder
        new_path = COLLECTIONS_DIR / new_name
        if not old_path.exists():
            raise HTTPException(status_code=404, detail="Collection not found")
        if new_path.exists():
            raise HTTPException(status_code=409, detail="A collection with that name already exists")

        # Re-key DB tags first (before folder rename)
        rows = session.exec(select(ImageTag).where(ImageTag.image_path.startswith(f"{folder}/"))).all()
        for row in rows:
            row.image_path = f"{new_name}/{row.image_path[len(folder)+1:]}"
        session.commit()

        # Rename folder and re-key metadata
        old_path.rename(new_path)
        from collection_manager import read_all_metadata, write_all_metadata
        metadata = read_all_metadata(COLLECTIONS_DIR)
        old_emoji = metadata.pop(folder, "📁")
        metadata[new_name] = old_emoji
        write_all_metadata(COLLECTIONS_DIR, metadata)

        collection = get_collection(COLLECTIONS_DIR, new_name)
        return collection
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/collections/{folder}")
def delete_collection_endpoint(folder: str, session = Depends(get_session)):
    """Delete a collection and move all media back to the output queue."""
    try:
        folder_path = COLLECTIONS_DIR / folder
        if not folder_path.exists():
            raise HTTPException(status_code=404, detail="Collection not found")

        # Move all media files back to OUTPUT_DIR
        moved = 0
        for file in list(folder_path.iterdir()):
            if file.is_file():
                dest = OUTPUT_DIR / file.name
                if dest.exists():
                    stem, suffix, counter = dest.stem, dest.suffix, 1
                    while dest.exists():
                        dest = OUTPUT_DIR / f"{stem}_{counter}{suffix}"
                        counter += 1
                shutil.move(str(file), str(dest))
                moved += 1

        folder_path.rmdir()

        # Remove from metadata
        from collection_manager import read_all_metadata, write_all_metadata
        metadata = read_all_metadata(COLLECTIONS_DIR)
        metadata.pop(folder, None)
        write_all_metadata(COLLECTIONS_DIR, metadata)

        # Delete all tags for this collection
        session.exec(delete(ImageTag).where(ImageTag.image_path.startswith(f"{folder}/")))
        session.commit()

        return {"ok": True, "moved": moved}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/{path:path}/tags")
def get_image_tags(path: str, session = Depends(get_session)):
    """Get all tags for an image."""
    try:
        validate_image_path(path)
        stmt = select(ImageTag.tag).where(ImageTag.image_path == path)
        tags = [row[0] for row in session.exec(stmt).all()]
        return {"tags": tags}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/images/{path:path}/tags")
def add_image_tag(path: str, req: AddTagRequest, session = Depends(get_session)):
    """Add a tag to an image."""
    try:
        validate_image_path(path)
        tag = req.tag.strip()
        if not tag:
            raise HTTPException(status_code=400, detail="Tag cannot be empty")

        existing = session.exec(
            select(ImageTag).where(
                (ImageTag.image_path == path) & (ImageTag.tag == tag)
            )
        ).first()
        if existing:
            return {"ok": True}

        new_tag = ImageTag(image_path=path, tag=tag)
        session.add(new_tag)
        session.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/images/{path:path}/tags/{tag}")
def remove_image_tag(path: str, tag: str, session = Depends(get_session)):
    """Remove a tag from an image."""
    try:
        validate_image_path(path)
        tag = tag.strip()
        if not tag:
            raise HTTPException(status_code=400, detail="Tag cannot be empty")

        session.exec(
            delete(ImageTag).where(
                (ImageTag.image_path == path) & (ImageTag.tag == tag)
            )
        )
        session.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tags")
def get_all_tags(session = Depends(get_session)):
    """Get all unique tags."""
    try:
        stmt = select(ImageTag.tag).distinct()
        tags = [row[0] for row in session.exec(stmt).all()]
        return {"tags": sorted(tags)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/gallery/images")
def get_gallery_images(
    collection: Optional[str] = None,
    tags: Optional[str] = None,
    offset: int = 0,
    limit: int = 30,
    session = Depends(get_session),
):
    """Get images from collections, optionally filtered by collection and/or tags."""
    try:
        images = []

        # Determine which collections to walk
        if collection:
            collections_to_walk = [COLLECTIONS_DIR / collection]
        else:
            collections_to_walk = [d for d in COLLECTIONS_DIR.iterdir() if d.is_dir()]

        # Walk collections and gather image paths
        for col_path in collections_to_walk:
            if not col_path.exists():
                continue
            col_name = col_path.name
            for file in sorted(col_path.iterdir()):
                if file.suffix.lower() in MEDIA_EXTENSIONS:
                    rel_path = f"{col_name}/{file.name}"
                    images.append(rel_path)

        # Filter by tags if provided
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            if tag_list:
                filtered = []
                for img_path in images:
                    stmt = select(ImageTag.tag).where(ImageTag.image_path == img_path)
                    img_tags = {row[0] for row in session.exec(stmt).all()}
                    # Include image only if it has ALL the requested tags
                    if all(tag in img_tags for tag in tag_list):
                        filtered.append(img_path)
                images = filtered

        # Paginate
        has_more = len(images) > offset + limit
        paginated = images[offset : offset + limit]

        return {"images": paginated, "has_more": has_more}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def validate_gallery_image_path(path: str) -> Path:
    """Validate and return a safe path within COLLECTIONS_DIR."""
    try:
        safe_path = (COLLECTIONS_DIR / path).resolve()
        if not str(safe_path).startswith(str(COLLECTIONS_DIR.resolve())):
            raise HTTPException(status_code=400, detail="Invalid path")
        if not safe_path.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        return safe_path
    except (ValueError, RuntimeError):
        raise HTTPException(status_code=400, detail="Invalid path")


def validate_trash_path(path: str) -> Path:
    """Validate and return a safe path within TRASH_DIR."""
    try:
        safe_path = (TRASH_DIR / path).resolve()
        if not str(safe_path).startswith(str(TRASH_DIR.resolve())):
            raise HTTPException(status_code=400, detail="Invalid path")
        if not safe_path.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        return safe_path
    except (ValueError, RuntimeError):
        raise HTTPException(status_code=400, detail="Invalid path")


@app.get("/api/gallery/images/{path:path}/tags")
def get_gallery_image_tags(path: str, session = Depends(get_session)):
    """Get all tags for a gallery image."""
    try:
        validate_gallery_image_path(path)
        stmt = select(ImageTag.tag).where(ImageTag.image_path == path)
        tags = [row[0] for row in session.exec(stmt).all()]
        return {"tags": tags}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/gallery/images/{path:path}/tags")
def add_gallery_image_tag(path: str, req: AddTagRequest, session = Depends(get_session)):
    """Add a tag to a gallery image."""
    try:
        validate_gallery_image_path(path)
        tag = req.tag.strip()
        if not tag:
            raise HTTPException(status_code=400, detail="Tag cannot be empty")

        existing = session.exec(
            select(ImageTag).where(
                (ImageTag.image_path == path) & (ImageTag.tag == tag)
            )
        ).first()
        if existing:
            return {"ok": True}

        new_tag = ImageTag(image_path=path, tag=tag)
        session.add(new_tag)
        session.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/gallery/images/{path:path}/tags/{tag}")
def remove_gallery_image_tag(path: str, tag: str, session = Depends(get_session)):
    """Remove a tag from a gallery image."""
    try:
        validate_gallery_image_path(path)
        tag = tag.strip()
        if not tag:
            raise HTTPException(status_code=400, detail="Tag cannot be empty")

        session.exec(
            delete(ImageTag).where(
                (ImageTag.image_path == path) & (ImageTag.tag == tag)
            )
        )
        session.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RenameTagRequest(BaseModel):
    new_tag: str


@app.patch("/api/tags/{old_tag}/rename")
def rename_tag(old_tag: str, req: RenameTagRequest, session = Depends(get_session)):
    """Rename a tag globally across all images."""
    try:
        old_tag = old_tag.strip()
        new_tag = req.new_tag.strip()

        if not old_tag:
            raise HTTPException(status_code=400, detail="Old tag cannot be empty")
        if not new_tag:
            raise HTTPException(status_code=400, detail="New tag cannot be empty")
        if old_tag == new_tag:
            raise HTTPException(status_code=400, detail="New tag must be different from old tag")

        # Check if new_tag already exists
        existing = session.exec(
            select(ImageTag).where(ImageTag.tag == new_tag)
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="New tag already exists")

        # Rename all occurrences of old_tag to new_tag
        session.exec(
            update(ImageTag)
            .where(ImageTag.tag == old_tag)
            .values(tag=new_tag)
        )
        session.commit()
        return {"ok": True, "old_tag": old_tag, "new_tag": new_tag}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/tags/{tag}")
def delete_tag(tag: str, session = Depends(get_session)):
    """Delete a tag from all images."""
    try:
        tag = tag.strip()
        if not tag:
            raise HTTPException(status_code=400, detail="Tag cannot be empty")

        # Delete all occurrences of the tag
        session.exec(
            delete(ImageTag).where(ImageTag.tag == tag)
        )
        session.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class GalleryMoveRequest(BaseModel):
    from_path: str
    to_collection: str


class GalleryPathRequest(BaseModel):
    path: str


@app.post("/api/gallery/move")
def gallery_move(req: GalleryMoveRequest, session = Depends(get_session)):
    """Move a gallery image to a different collection."""
    try:
        source_path = validate_gallery_image_path(req.from_path)

        dest_dir = COLLECTIONS_DIR / req.to_collection
        dest_dir.mkdir(parents=True, exist_ok=True)

        dest_path = dest_dir / source_path.name
        if dest_path.exists():
            stem = dest_path.stem
            suffix = dest_path.suffix
            counter = 1
            while dest_path.exists():
                dest_path = dest_dir / f"{stem}_{counter}{suffix}"
                counter += 1

        shutil.move(str(source_path), str(dest_path))

        new_image_path = f"{req.to_collection}/{dest_path.name}"
        session.exec(
            update(ImageTag)
            .where(ImageTag.image_path == req.from_path)
            .values(image_path=new_image_path)
        )
        session.commit()

        return {"ok": True, "new_path": new_image_path}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/gallery/trash")
def gallery_trash(req: GalleryPathRequest, session = Depends(get_session)):
    """Move a gallery image to trash."""
    try:
        source_path = validate_gallery_image_path(req.path)

        dest_path = TRASH_DIR / source_path.name
        if dest_path.exists():
            stem = dest_path.stem
            suffix = dest_path.suffix
            counter = 1
            while dest_path.exists():
                dest_path = TRASH_DIR / f"{stem}_{counter}{suffix}"
                counter += 1

        shutil.move(str(source_path), str(dest_path))

        session.exec(delete(ImageTag).where(ImageTag.image_path == req.path))
        session.commit()

        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/gallery/readd")
def gallery_readd(req: GalleryPathRequest, session = Depends(get_session)):
    """Move a gallery image back to the output queue."""
    try:
        source_path = validate_gallery_image_path(req.path)

        dest_path = OUTPUT_DIR / source_path.name
        if dest_path.exists():
            stem = dest_path.stem
            suffix = dest_path.suffix
            counter = 1
            while dest_path.exists():
                dest_path = OUTPUT_DIR / f"{stem}_{counter}{suffix}"
                counter += 1

        shutil.move(str(source_path), str(dest_path))

        session.exec(delete(ImageTag).where(ImageTag.image_path == req.path))
        session.commit()

        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/gallery/image/{path:path}")
def get_gallery_image_file(path: str):
    """Serve image files from collections directory."""
    try:
        # Validate path is within COLLECTIONS_DIR
        file_path = (COLLECTIONS_DIR / path).resolve()
        if not str(file_path).startswith(str(COLLECTIONS_DIR.resolve())):
            raise HTTPException(status_code=400, detail="Invalid path")
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        return FileResponse(file_path, media_type=get_mime_type(file_path))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/swipe/keep")
def swipe_keep(req: SwipeKeepRequest, session = Depends(get_session)):
    """Move image from output to a collection."""
    try:
        source_path = validate_image_path(req.image_path)

        # Create collection if it doesn't exist
        collection_path = COLLECTIONS_DIR / req.collection
        collection_path.mkdir(parents=True, exist_ok=True)

        # Destination: just the filename (strip subdirs like 20260503/)
        dest_path = collection_path / source_path.name

        # Handle name collision
        if dest_path.exists():
            stem = dest_path.stem
            suffix = dest_path.suffix
            counter = 1
            while dest_path.exists():
                dest_path = collection_path / f"{stem}_{counter}{suffix}"
                counter += 1

        # Move the file
        shutil.move(str(source_path), str(dest_path))

        # Re-key any existing tags from OUTPUT_DIR path to gallery path
        new_image_path = f"{req.collection}/{dest_path.name}"
        session.exec(
            update(ImageTag)
            .where(ImageTag.image_path == req.image_path)
            .values(image_path=new_image_path)
        )
        session.commit()

        undo_descriptor = {
            "image_path": req.image_path,
            "action": "keep",
            "collection": req.collection,
        }

        return SwipeResponse(ok=True, undo=undo_descriptor)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/swipe/trash")
def swipe_trash(req: SwipeTrashRequest):
    """Move image from output to trash."""
    try:
        source_path = validate_image_path(req.image_path)

        dest_path = TRASH_DIR / source_path.name

        # Handle name collision
        if dest_path.exists():
            stem = dest_path.stem
            suffix = dest_path.suffix
            counter = 1
            while dest_path.exists():
                dest_path = TRASH_DIR / f"{stem}_{counter}{suffix}"
                counter += 1

        # Move the file
        shutil.move(str(source_path), str(dest_path))

        undo_descriptor = {
            "image_path": req.image_path,
            "action": "trash",
        }

        return SwipeResponse(ok=True, undo=undo_descriptor)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/swipe/undo")
def swipe_undo(req: UndoRequest):
    """Move image back to output folder at its original subdirectory."""
    try:
        if req.action == "keep":
            if not req.collection:
                raise HTTPException(status_code=400, detail="collection required for keep undo")
            # File is in collections/{collection}/filename
            source_path = COLLECTIONS_DIR / req.collection / Path(req.image_path).name
        elif req.action == "trash":
            # File is in trash/{filename}
            source_path = TRASH_DIR / Path(req.image_path).name
        else:
            raise HTTPException(status_code=400, detail="Invalid action")

        if not source_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        # Recreate the original subdirectory in output if needed
        dest_path = OUTPUT_DIR / req.image_path
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        # Handle collision
        if dest_path.exists():
            stem = dest_path.stem
            suffix = dest_path.suffix
            parent = dest_path.parent
            counter = 1
            while dest_path.exists():
                dest_path = parent / f"{stem}_{counter}{suffix}"
                counter += 1

        shutil.move(str(source_path), str(dest_path))

        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trash/images")
def get_trash_images(offset: int = 0, limit: int = 30):
    """Get images from trash directory."""
    try:
        if not TRASH_DIR.exists():
            return {"images": [], "has_more": False}

        images = []
        for file in sorted(TRASH_DIR.iterdir()):
            if file.is_file() and file.suffix.lower() in MEDIA_EXTENSIONS:
                images.append(file.name)

        has_more = len(images) > offset + limit
        paginated = images[offset : offset + limit]

        return {"images": paginated, "has_more": has_more}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trash/image/{path:path}")
def get_trash_image_file(path: str):
    """Serve image files from trash directory."""
    try:
        file_path = validate_trash_path(path)
        return FileResponse(file_path, media_type=get_mime_type(file_path))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TrashPathRequest(BaseModel):
    path: str


@app.post("/api/trash/readd")
def trash_readd(req: TrashPathRequest):
    """Move a trashed item back to the output queue."""
    try:
        source_path = validate_trash_path(req.path)

        dest_path = OUTPUT_DIR / source_path.name
        if dest_path.exists():
            stem = dest_path.stem
            suffix = dest_path.suffix
            counter = 1
            while dest_path.exists():
                dest_path = OUTPUT_DIR / f"{stem}_{counter}{suffix}"
                counter += 1

        shutil.move(str(source_path), str(dest_path))

        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/trash/image/{path:path}")
def trash_delete(path: str):
    """Permanently delete a trashed item."""
    try:
        file_path = validate_trash_path(path)
        file_path.unlink()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/trash/empty")
def trash_empty():
    """Delete all items from trash."""
    try:
        if not TRASH_DIR.exists():
            return {"ok": True, "deleted": 0}

        deleted = 0
        for file in TRASH_DIR.iterdir():
            if file.is_file():
                file.unlink()
                deleted += 1

        return {"ok": True, "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/queue/images")
def get_queue_images(offset: int = 0, limit: int = 30):
    """Get images from queue (output directory)."""
    try:
        if not OUTPUT_DIR.exists():
            return {"images": [], "has_more": False}

        images = []
        for root, _, files in os.walk(OUTPUT_DIR):
            for file in files:
                if Path(file).suffix.lower() in MEDIA_EXTENSIONS:
                    full_path = Path(root) / file
                    relative_path = full_path.relative_to(OUTPUT_DIR)
                    images.append(str(relative_path))

        images = sorted(images)
        has_more = len(images) > offset + limit
        paginated = images[offset : offset + limit]

        return {"images": paginated, "has_more": has_more}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/queue/move")
def queue_move(req: GalleryMoveRequest, session = Depends(get_session)):
    """Move a queue image to a collection."""
    try:
        source_path = validate_image_path(req.from_path)

        dest_dir = COLLECTIONS_DIR / req.to_collection
        dest_dir.mkdir(parents=True, exist_ok=True)

        dest_path = dest_dir / source_path.name
        if dest_path.exists():
            stem = dest_path.stem
            suffix = dest_path.suffix
            counter = 1
            while dest_path.exists():
                dest_path = dest_dir / f"{stem}_{counter}{suffix}"
                counter += 1

        shutil.move(str(source_path), str(dest_path))

        new_image_path = f"{req.to_collection}/{dest_path.name}"
        session.exec(
            update(ImageTag)
            .where(ImageTag.image_path == req.from_path)
            .values(image_path=new_image_path)
        )
        session.commit()

        return {"ok": True, "new_path": new_image_path}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Mount static files (frontend)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
