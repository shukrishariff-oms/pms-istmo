from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"

class PaymentType(str, Enum):
    CAPEX = "capex"
    OPEX = "opex"

class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    CLAIMED = "claimed"
    VERIFIED = "verified"
    APPROVED = "approved"
    PAID = "paid"
class ProjectCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    budget_capex: float = 0.0
    budget_opex_allocation: float = 0.0
    status: str = "on_track"
    start_date: datetime
    end_date: datetime
    owner_id: int
    assist_coordinator_id: Optional[int] = None

class ProjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    budget_capex: Optional[float] = None
    budget_opex_allocation: Optional[float] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    owner_id: Optional[int] = None
    assist_coordinator_id: Optional[int] = None

class WBSCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None

class WBSUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None

class TaskCreate(BaseModel):
    wbs_id: int
    name: str
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    status: TaskStatus = TaskStatus.NOT_STARTED
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    due_date: datetime

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[int] = None
    status: Optional[TaskStatus] = None
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    due_date: Optional[datetime] = None

# --- Payment Schemas ---

class PaymentCreate(BaseModel):
    title: str
    vendor_name: str
    amount: float
    payment_type: PaymentType
    planned_date: datetime
    status: PaymentStatus = PaymentStatus.UNPAID

class PaymentUpdate(BaseModel):
    title: Optional[str] = None
    vendor_name: Optional[str] = None
    amount: Optional[float] = None
    payment_type: Optional[PaymentType] = None
    planned_date: Optional[datetime] = None
    status: Optional[PaymentStatus] = None
