import hashlib
import os
import shutil

from fastapi import (
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas
from .analysis_service import analyze_file
from .database import SessionLocal, engine


# ==================================================
# CREATE DATABASE TABLES
# ==================================================

models.Base.metadata.create_all(bind=engine)


# ==================================================
# FASTAPI APP
# ==================================================

app = FastAPI(
    title="TruthTrace API",
    version="1.0.0",
)


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://frontend-psi-one-iqiofsvhvm.vercel.app",
        "https://frontend-projectwork1.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# HOME / HEALTH CHECK
# ==================================================

@app.get("/")
def home():
    return {
        "message": "TruthTrace API is running successfully 🚀"
    }


# ==================================================
# DATABASE DEPENDENCY
# ==================================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ==================================================
# UPLOAD FOLDER
# ==================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "evidence_files"
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


# ==================================================
# SHA-256 CALCULATION
# ==================================================

def calculate_sha256(file_path: str) -> str:

    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:

        while True:

            data = file.read(4096)

            if not data:
                break

            sha256.update(data)

    return sha256.hexdigest()


# ==================================================
# GET ALL CASES
# ==================================================

@app.get(
    "/cases",
    response_model=list[schemas.CaseResponse]
)
def get_cases(
    db: Session = Depends(get_db)
):

    cases = (
        db.query(models.Case)
        .order_by(models.Case.id.desc())
        .all()
    )

    return cases


# ==================================================
# CREATE CASE
# ==================================================

@app.post(
    "/cases",
    response_model=schemas.CaseResponse
)
def create_case(
    case: schemas.CaseCreate,
    db: Session = Depends(get_db)
):

    new_case = models.Case(

        case_name=case.case_name,

        description=case.description,

        status="Active",

    )

    db.add(new_case)

    db.commit()

    db.refresh(new_case)

    return new_case


# ==================================================
# GET CASE DETAILS
# ==================================================

@app.get(
    "/cases/{case_id}",
    response_model=schemas.CaseDetailsResponse
)
def get_case(
    case_id: int,
    db: Session = Depends(get_db)
):

    case = (
        db.query(models.Case)
        .filter(models.Case.id == case_id)
        .first()
    )

    if not case:

        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    return case


# ==================================================
# UPDATE CASE STATUS
# ==================================================

@app.put(
    "/cases/{case_id}/status",
    response_model=schemas.CaseResponse
)
def update_case_status(

    case_id: int,

    status_data: schemas.CaseStatusUpdate,

    db: Session = Depends(get_db)

):

    case = (
        db.query(models.Case)
        .filter(models.Case.id == case_id)
        .first()
    )

    if not case:

        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    allowed_statuses = {
        "Active",
        "Analyzed",
        "Closed",
    }

    if status_data.status not in allowed_statuses:

        raise HTTPException(

            status_code=400,

            detail=(
                "Invalid status. "
                "Allowed values: "
                "Active, Analyzed, Closed"
            ),

        )

    case.status = status_data.status

    db.commit()

    db.refresh(case)

    return case


# ==================================================
# UPLOAD EVIDENCE
# ==================================================

@app.post("/evidence")
async def upload_evidence(

    case_id: int = Form(...),

    file: UploadFile = File(...),

    db: Session = Depends(get_db),

):

    case = (
        db.query(models.Case)
        .filter(models.Case.id == case_id)
        .first()
    )

    if not case:

        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    original_file_name = (
        file.filename
        or "unnamed_file"
    )

    # Safe unique filename
    file_name = (
        f"{case_id}_{original_file_name}"
    )

    file_location = os.path.join(
        UPLOAD_FOLDER,
        file_name
    )

    try:

        with open(
            file_location,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Could not save file: {str(error)}"
        )

    sha256_hash = calculate_sha256(
        file_location
    )

    file_size = os.path.getsize(
        file_location
    )

    evidence = models.Evidence(

        file_name=original_file_name,

        file_path=file_location,

        file_type=file.content_type or "application/octet-stream",

        file_size=file_size,

        sha256_hash=sha256_hash,

        case_id=case_id,

    )

    db.add(evidence)

    db.commit()

    db.refresh(evidence)

    return {

        "message":
            "Evidence uploaded successfully",

        "evidence_id":
            evidence.id,

        "file_name":
            evidence.file_name,

        "file_type":
            evidence.file_type,

        "file_size":
            evidence.file_size,

        "sha256_hash":
            evidence.sha256_hash,

        "case_id":
            evidence.case_id,

    }


# ==================================================
# GET ALL EVIDENCE
# ==================================================

@app.get(
    "/evidence",
    response_model=list[schemas.EvidenceResponse]
)
def get_evidence(

    db: Session = Depends(get_db)

):

    evidence = (
        db.query(models.Evidence)
        .order_by(models.Evidence.id.desc())
        .all()
    )

    return evidence


# ==================================================
# GET EVIDENCE BY CASE
# ==================================================

@app.get(
    "/evidence/case/{case_id}",
    response_model=list[schemas.EvidenceResponse]
)
def get_case_evidence(

    case_id: int,

    db: Session = Depends(get_db)

):

    case = (
        db.query(models.Case)
        .filter(models.Case.id == case_id)
        .first()
    )

    if not case:

        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )

    evidence = (
        db.query(models.Evidence)
        .filter(models.Evidence.case_id == case_id)
        .order_by(models.Evidence.id.desc())
        .all()
    )

    return evidence


# ==================================================
# ANALYZE EVIDENCE
# ==================================================

@app.post(
    "/evidence/{evidence_id}/analyze"
)
def analyze_evidence(

    evidence_id: int,

    db: Session = Depends(get_db)

):

    evidence = (
        db.query(models.Evidence)
        .filter(models.Evidence.id == evidence_id)
        .first()
    )

    if not evidence:

        raise HTTPException(
            status_code=404,
            detail="Evidence not found"
        )

    analysis_result = analyze_file(

        file_path=evidence.file_path,

        original_hash=evidence.sha256_hash,

        file_name=evidence.file_name,

        file_type=evidence.file_type,

        file_size=evidence.file_size,

    )

    return {

        "evidence_id":
            evidence.id,

        "case_id":
            evidence.case_id,

        "file_name":
            evidence.file_name,

        "analysis":
            analysis_result,

    }