"""
FastAPI application entry point.

Endpoints:
- POST /api/auth/register    register a new user account
- POST /api/auth/login       log in with email and password -> returns JWT token
- GET  /api/auth/me          get profile of the currently logged-in user
- GET  /api/output-types     list the output types the dashboard can offer
- POST /api/generate         submit source content + chosen outputs -> get generated content
- GET  /api/history          list previous generations for the current user
- GET  /api/history/{id}     view one previous generation in full
"""

from typing import Optional, List
import uuid

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app import models
from app.output_schemas import OUTPUT_TYPES
from app.file_extractor import extract_text_from_upload, get_image_media_type
from app import ai_service
from app import auth

# Create the database tables on startup if they don't exist yet.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gen AI Content Transformation Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Schemas for Auth ---

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: str


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user account."""
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    if not req.full_name.strip():
        raise HTTPException(status_code=400, detail="Please enter your name.")

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")

    hashed_pw = auth.hash_password(req.password)
    new_user = models.User(
        email=email,
        full_name=req.full_name.strip(),
        hashed_password=hashed_pw,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth.create_access_token(user_id=str(new_user.id), email=new_user.email)
    return {
        "token": token,
        "user": {
            "id": str(new_user.id),
            "email": new_user.email,
            "full_name": new_user.full_name,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else "",
        },
    }


@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Logs in an existing user and returns a JWT token."""
    email = req.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password. Please try again.")

    token = auth.create_access_token(user_id=str(user.id), email=user.email)
    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at.isoformat() if user.created_at else "",
        },
    }


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    """Returns profile information for the authenticated user."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else "",
    }


# --- Generation & Deliverables Endpoints ---

@app.get("/api/output-types")
def list_output_types():
    """Tells the frontend which checkboxes to show on the dashboard."""
    return [{"key": key, "label": value["label"]} for key, value in OUTPUT_TYPES.items()]


@app.post("/api/generate")
async def generate(
    output_types: str = Form(..., description="Comma-separated output type keys, e.g. 'linkedin_post,advisory'"),
    audience: str = Form("General Audience"),
    tone: str = Form("Professional"),
    language: str = Form("English"),
    detail_level: str = Form("Medium"),
    objective: str = Form("Awareness"),
    extra_instructions: str = Form(""),
    source_text: str = Form(""),
    file: Optional[UploadFile] = File(None),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: Session = Depends(get_db),
):
    selected_types = [t.strip() for t in output_types.split(",") if t.strip()]

    unknown_types = [t for t in selected_types if t not in OUTPUT_TYPES]
    if unknown_types:
        raise HTTPException(400, f"Unknown output type(s): {unknown_types}")
    if not selected_types:
        raise HTTPException(400, "Select at least one output type.")

    parameters = {
        "audience": audience,
        "tone": tone,
        "language": language,
        "detail_level": detail_level,
        "objective": objective,
        "extra_instructions": extra_instructions or None,
    }

    source_type = "text"
    file_name = None

    try:
        if file is not None:
            file_name = file.filename
            file_bytes = await file.read()
            image_media_type = get_image_media_type(file.filename)

            if image_media_type:
                source_type = "image"
                results = ai_service.generate_outputs_from_image(
                    file_bytes, image_media_type, selected_types, parameters
                )
                preview_text = f"[Image: {file.filename}]"
            else:
                source_type = "file"
                extracted_text = extract_text_from_upload(file.filename, file_bytes)
                if not extracted_text.strip():
                    raise HTTPException(400, "No readable text could be extracted from that file.")
                results = ai_service.generate_outputs(extracted_text, selected_types, parameters)
                preview_text = extracted_text[:500]
        else:
            if not source_text.strip():
                raise HTTPException(400, "Provide source text or upload a file.")
            results = ai_service.generate_outputs(source_text, selected_types, parameters)
            preview_text = source_text[:500]

    except ValueError as e:
        raise HTTPException(400, str(e))

    # Save this generation attached to the logged-in user
    record = models.Generation(
        user_id=current_user.id if current_user else None,
        source_type=source_type,
        source_preview=preview_text,
        file_name=file_name,
        output_types=selected_types,
        parameters=parameters,
        results=results,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": str(record.id),
        "created_at": record.created_at.isoformat(),
        "output_types": selected_types,
        "parameters": parameters,
        "results": results,
    }


@app.get("/api/history")
def get_history(
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: Session = Depends(get_db),
):
    """Returns previous generations for the currently authenticated user only."""
    if not current_user:
        return []

    records = (
        db.query(models.Generation)
        .filter(models.Generation.user_id == current_user.id)
        .order_by(models.Generation.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(r.id),
            "created_at": r.created_at.isoformat(),
            "source_preview": r.source_preview,
            "output_types": r.output_types,
        }
        for r in records
    ]


@app.get("/api/history/{generation_id}")
def get_history_item(
    generation_id: str,
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: Session = Depends(get_db),
):
    """Retrieves a single generation record, ensuring user access permissions."""
    try:
        gen_uuid = uuid.UUID(generation_id)
    except ValueError:
        raise HTTPException(400, "Invalid generation ID.")

    query = db.query(models.Generation).filter(models.Generation.id == gen_uuid)
    
    if current_user:
        query = query.filter((models.Generation.user_id == current_user.id) | (models.Generation.user_id == None))
    
    record = query.first()
    if not record:
        raise HTTPException(404, "Generation not found or access denied.")

    return {
        "id": str(record.id),
        "created_at": record.created_at.isoformat(),
        "output_types": record.output_types,
        "parameters": record.parameters,
        "results": record.results,
    }

