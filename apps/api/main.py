import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()


@app.get("/api/hello")
def read_root():
    return {"message": "Hello!"}


# Mount static files (frontend)
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
