import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "RescuELINK: Smart City AI Emergency Dispatch & Urban Resilience Command System (India Edition)"
    VERSION: str = "2.5.0"
    API_V1_STR: str = "/api/v1"
    
    # Gemini Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Production & Security Configuration
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "rescuenlink-production-gov-secret-key-super-secure")
    
    # Path to pre-built React frontend dist directory
    FRONTEND_DIST_DIR: str = os.getenv(
        "FRONTEND_DIST_DIR",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
    )
    
    # Production Hardened CORS (Specific trusted development and production domains)
    BACKEND_CORS_ORIGINS: List[str] = [
        origin.strip() for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000,*"
        ).split(",") if origin.strip()
    ]


settings = Settings()
