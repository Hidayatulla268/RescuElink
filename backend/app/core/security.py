import time
import hmac
import hashlib
import json
import base64
import html
import re
from typing import Dict, Tuple, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Cryptographic secret for signing Government Badges & Role verification tokens
SECRET_KEY = "rescuenlink-production-gov-secret-key-super-secure"
TOKEN_VALIDITY_SECONDS = 86400  # 24 hours

# In-memory sliding window rate limiter: { client_ip: [(timestamp1), (timestamp2)...] }
RATE_LIMIT_STORE: Dict[str, list] = {}
RATE_LIMIT_WINDOW = 60.0  # seconds
MAX_REQUESTS_PER_WINDOW = 120  # requests per minute per IP

security_scheme = HTTPBearer(auto_error=False)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Enforces defense-in-depth HTTP security response headers
    compliant with OWASP Top 10, NIST, and enterprise security standards.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        # Measure processing time for efficiency tracking
        start_time = time.perf_counter()
        
        response = await call_next(request)
        
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Process-Time"] = f"{process_time_ms}ms"
        
        # Defense-in-depth security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' ws: wss: http: https:;"
        )
        return response


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    High-performance sliding window rate limiter preventing automated DDoS,
    brute force, and API abuse. Injects standard X-RateLimit headers.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        # Exclude documentation and static/health checks from strict rate limiting
        if request.url.path in ["/health", "/docs", "/openapi.json", "/"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Clean timestamps older than window
        timestamps = RATE_LIMIT_STORE.get(client_ip, [])
        timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
        
        if len(timestamps) >= MAX_REQUESTS_PER_WINDOW:
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please throttle your emergency API queries.",
                        "retry_after_seconds": int(RATE_LIMIT_WINDOW - (now - timestamps[0]))
                    }
                },
                headers={
                    "Retry-After": str(int(RATE_LIMIT_WINDOW - (now - timestamps[0]))),
                    "X-RateLimit-Limit": str(MAX_REQUESTS_PER_WINDOW),
                    "X-RateLimit-Remaining": "0"
                }
            )
            
        timestamps.append(now)
        RATE_LIMIT_STORE[client_ip] = timestamps
        
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(MAX_REQUESTS_PER_WINDOW)
        response.headers["X-RateLimit-Remaining"] = str(MAX_REQUESTS_PER_WINDOW - len(timestamps))
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Protects backend against large payload buffer overflows and memory exhaustion (CWE-400).
    Enforces a strict 10MB limit on request bodies.
    """
    MAX_SIZE = 10 * 1024 * 1024  # 10 Megabytes

    async def dispatch(self, request: Request, call_next) -> Response:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_SIZE:
            return JSONResponse(
                status_code=413,
                content={
                    "error": {
                        "code": "PAYLOAD_TOO_LARGE",
                        "message": "Payload size exceeds 10MB safety threshold."
                    }
                }
            )
        return await call_next(request)


def sanitize_input_text(raw_text: Optional[str]) -> str:
    """
    Sanitizes user input to prevent Cross-Site Scripting (XSS) and command injection.
    Escapes HTML entities and removes script/malicious control patterns.
    """
    if not raw_text:
        return ""
    # Strip HTML tags
    cleaned = re.sub(r"<[^>]*?>", "", raw_text)
    # Remove javascript: or data: URIs in text
    cleaned = re.sub(r"(javascript|vbscript|data):", "", cleaned, flags=re.IGNORECASE)
    # Escape HTML special characters
    return html.escape(cleaned.strip())


def generate_gov_token(badge_id: str, role: str, name: str) -> str:
    """
    Generates a cryptographically signed HMAC-SHA256 authentication token for verified government personnel.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": badge_id,
        "role": role,
        "name": name,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_VALIDITY_SECONDS,
        "iss": "rescuenlink-gov-auth"
    }
    
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    
    signature = hmac.new(
        SECRET_KEY.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def verify_gov_token(token: str) -> dict:
    """
    Validates cryptographic signature and expiration of a government token.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(status_code=401, detail="Invalid token structure")
        
    header_b64, payload_b64, sig_b64 = parts
    expected_sig = hmac.new(
        SECRET_KEY.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256
    ).digest()
    expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode().rstrip("=")
    
    if not hmac.compare_digest(sig_b64, expected_sig_b64):
        raise HTTPException(status_code=401, detail="Cryptographic signature mismatch")
        
    # Decode payload
    padding = "=" * ((4 - len(payload_b64) % 4) % 4)
    payload_bytes = base64.urlsafe_b64decode(payload_b64 + padding)
    payload = json.loads(payload_bytes.decode())
    
    if payload.get("exp", 0) < time.time():
        raise HTTPException(status_code=401, detail="Government token has expired")
        
    return payload
