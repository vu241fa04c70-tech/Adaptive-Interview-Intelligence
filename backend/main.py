import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
from routes import resume, interviews, recruiter, system

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ProofHire AI - Realistic Adaptive Interview Intelligence Platform",
    description="Production-style AI technical interviewing platform for Google Student Club Welcome Hackathon 2026",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(resume.router)
app.include_router(interviews.router)
app.include_router(recruiter.router)
app.include_router(system.router)

# Mount frontend static files if built
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
else:
    @app.get("/")
    def root():
        return {
            "message": "ProofHire AI Backend API is running!",
            "docs": "/docs",
            "status": "/api/system/status"
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
