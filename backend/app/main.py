from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI(
    title="Department Project & Finance Tracker (DPFT)",
    description="Internal Enterprise Project Management System",
    version="0.1.0"
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*", # Allow all for initial deployment ease
]

from app.db.database import get_db
from app.api import auth, projects, portfolio, finance, users, documents

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(portfolio.router)
app.include_router(finance.router, prefix="/finance", tags=["Finance"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])

@app.get("/")
def read_root():
    return {"system": "DPFT API", "status": "active"}

# Serve Frontend Static Files
# We mount this LAST so it doesn't interfere with API routes
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")

if os.path.exists(frontend_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # If it's an API route, let it fall through or it would have been caught above
        # For SPA, serve index.html for all other routes
        file_path = os.path.join(frontend_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_path, "index.html"))
else:
    print(f"WARNING: Frontend path not found at {frontend_path}. Static files will not be served.")
