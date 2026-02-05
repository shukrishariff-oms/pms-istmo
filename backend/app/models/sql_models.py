from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..db.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    HOD = "hod"
    STAFF = "staff"
    FINANCE = "finance"

class ProjectStatus(str, enum.Enum):
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    DELAYED = "delayed"
    COMPLETED = "completed"

class TaskStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"

class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    CLAIMED = "claimed"
    VERIFIED = "verified"
    APPROVED = "approved"
    PAID = "paid"

class PaymentType(str, enum.Enum):
    CAPEX = "capex"
    OPEX = "opex"

class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class IssueStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class IssuePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    password_hash = Column(String)
    role = Column(String) # Stored as string, validated against UserRole enum
    
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department = relationship("Department", back_populates="members")
    
    projects_owned = relationship("Project", foreign_keys="[Project.owner_id]", back_populates="owner")
    projects_assisted = relationship("Project", foreign_keys="[Project.assist_coordinator_id]", back_populates="assist_coordinator")
    tasks_assigned = relationship("Task", back_populates="assignee")
    budget_requests = relationship("BudgetRequest", foreign_keys="[BudgetRequest.requester_id]", back_populates="requester")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, unique=True) # e.g. IT, HR, FIN
    
    # Financials
    budget_opex = Column(Float, default=0.0) # Annual OPEX Budget (Accumulated from Approved Requests)
    
    members = relationship("User", back_populates="department")
    expenses = relationship("DepartmentExpense", back_populates="department", cascade="all, delete-orphan")
    budget_requests = relationship("BudgetRequest", back_populates="department", cascade="all, delete-orphan")
    category_budgets = relationship("DepartmentBudget", back_populates="department", cascade="all, delete-orphan")

class DepartmentExpense(Base):
    __tablename__ = "department_expenses"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    title = Column(String)
    amount = Column(Float)
    date = Column(DateTime(timezone=True), server_default=func.now())
    
    category = Column(String, nullable=True) # e.g. "Software License", "Travel", "Training"
    
    department = relationship("Department", back_populates="expenses")

class DepartmentBudget(Base):
    __tablename__ = "department_budgets"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    category = Column(String) # e.g. "Kitchen Supply", "Utilities"
    amount = Column(Float, default=0.0)
    year = Column(Integer, default=2024)
    
    department = relationship("Department", back_populates="category_budgets")

class BudgetRequest(Base):
    __tablename__ = "budget_requests"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    requester_id = Column(Integer, ForeignKey("users.id"))
    
    title = Column(String)
    amount = Column(Float)
    category = Column(String) # e.g. Kitchen Supply, Office Supply
    justification = Column(Text, nullable=True)
    
    status = Column(String, default=RequestStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    department = relationship("Department", back_populates="budget_requests")
    requester = relationship("User", foreign_keys=[requester_id], back_populates="budget_requests")
    approver = relationship("User", foreign_keys=[approved_by_id])

class FinanceCategory(Base):
    __tablename__ = "finance_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    parent_id = Column(Integer, ForeignKey("finance_categories.id"), nullable=True)

    parent = relationship("FinanceCategory", remote_side=[id], back_populates="children")
    children = relationship("FinanceCategory", back_populates="parent", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    
    # Financials
    budget_capex = Column(Float, default=0.0)
    budget_opex_allocation = Column(Float, default=0.0)
    
    # Governance
    status = Column(String, default=ProjectStatus.ON_TRACK)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", foreign_keys=[owner_id], back_populates="projects_owned")
    
    assist_coordinator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assist_coordinator = relationship("User", foreign_keys=[assist_coordinator_id], back_populates="projects_assisted")
    
    wbs_items = relationship("WBS", back_populates="project", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("DocumentTracker", back_populates="project")

class WBS(Base):
    __tablename__ = "wbs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    parent_id = Column(Integer, ForeignKey("wbs.id"), nullable=True)
    name = Column(String)
    
    project = relationship("Project", back_populates="wbs_items")
    parent = relationship("WBS", remote_side=[id], back_populates="children")
    children = relationship("WBS", back_populates="parent", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="wbs_item", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    wbs_id = Column(Integer, ForeignKey("wbs.id"))
    parent_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    status = Column(String, default=TaskStatus.NOT_STARTED)
    
    # Scheduling
    planned_start = Column(DateTime(timezone=True), nullable=True)
    planned_end = Column(DateTime(timezone=True), nullable=True)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=False) # Mandatory due date
    
    wbs_item = relationship("WBS", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks_assigned")
    
    parent = relationship("Task", remote_side=[id], back_populates="sub_tasks")
    sub_tasks = relationship("Task", back_populates="parent", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    title = Column(String)
    vendor_name = Column(String)
    
    amount = Column(Float, default=0.0)
    payment_type = Column(String) # CAPEX or OPEX
    
    status = Column(String, default=PaymentStatus.UNPAID)
    
    planned_date = Column(DateTime(timezone=True))
    actual_date = Column(DateTime(timezone=True), nullable=True)
    
    milestone_ref = Column(String, nullable=True)
    invoice_ref = Column(String, nullable=True)
    
    project = relationship("Project", back_populates="payments")

class DocumentTracker(Base):
    __tablename__ = "document_trackers"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    ref_number = Column(String, unique=True, index=True, nullable=True)
    description = Column(Text, nullable=True)
    
    current_holder = Column(String) # e.g. "Ahmad (Finance)", "Director Office"
    status = Column(String, default="pending") # pending, in_progress, completed
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    project = relationship("Project", back_populates="documents")
    
    logs = relationship("DocumentLog", back_populates="document", cascade="all, delete-orphan")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class DocumentLog(Base):
    __tablename__ = "document_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("document_trackers.id"))
    
    from_holder = Column(String, nullable=True)
    to_holder = Column(String)
    status = Column(String)
    note = Column(Text, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    signed_at = Column(DateTime(timezone=True), nullable=True)
    
    document = relationship("DocumentTracker", back_populates="logs")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String)
    details = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    color = Column(String, default="#ffffff") # Hex color for the note
    is_pinned = Column(Boolean, default=False)
    reminder_date = Column(DateTime(timezone=True), nullable=True)
    is_completed = Column(Boolean, default=False)
    
    author_id = Column(Integer, ForeignKey("users.id"))
    author = relationship("User")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    category = Column(String) # Bug, Feature Request, Support, General
    priority = Column(String, default=IssuePriority.MEDIUM)
    status = Column(String, default=IssueStatus.OPEN)
    
    reporter_id = Column(Integer, ForeignKey("users.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    reporter = relationship("User", foreign_keys=[reporter_id])
    assignee = relationship("User", foreign_keys=[assignee_id])
    project = relationship("Project")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
