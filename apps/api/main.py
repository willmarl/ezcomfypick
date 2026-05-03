import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
from pathlib import Path
from typing import Optional
import shutil

from collection_manager import (
    get_all_collections,
    get_collection,
    update_collection_metadata,
    Collection,
)

app = FastAPI()

IMAGE_DIR = Path(os.environ.get("IMAGE_DIR", "/home/cat/Pictures/test/"))
OUTPUT_DIR = IMAGE_DIR / "output"
COLLECTIONS_DIR = IMAGE_DIR / "good-output"
TRASH_DIR = IMAGE_DIR / "trash-output"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def ensure_dirs():
    """Create required directories if they don't exist."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    COLLECTIONS_DIR.mkdir(parents=True, exist_ok=True)
    TRASH_DIR.mkdir(parents=True, exist_ok=True)

    # Ensure metadata file exists
    from collection_manager import read_all_metadata, write_all_metadata
    metadata = read_all_metadata(COLLECTIONS_DIR)
    write_all_metadata(COLLECTIONS_DIR, metadata)


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
            if Path(file).suffix.lower() in IMAGE_EXTENSIONS:
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
        return FileResponse(file_path, media_type="image/*")
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


@app.post("/api/swipe/keep")
def swipe_keep(req: SwipeKeepRequest):
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


# Mount static files (frontend)
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
