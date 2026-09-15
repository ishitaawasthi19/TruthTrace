from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ==================================================
# CASE SCHEMAS
# ==================================================

class CaseCreate(BaseModel):
    case_name: str
    description: Optional[str] = None


class CaseStatusUpdate(BaseModel):
    status: str


class CaseResponse(BaseModel):
    id: int
    case_name: str
    description: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================================================
# EVIDENCE SCHEMAS
# ==================================================

class EvidenceResponse(BaseModel):
    id: int
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    sha256_hash: str
    uploaded_at: datetime
    case_id: int

    class Config:
        from_attributes = True


# ==================================================
# CASE DETAILS
# ==================================================

class CaseDetailsResponse(BaseModel):
    id: int
    case_name: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    evidence: list[EvidenceResponse]

    class Config:
        from_attributes = True