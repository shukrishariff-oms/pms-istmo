from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from ..db.database import get_db
from ..models import sql_models as models
from .auth import get_current_user

router = APIRouter()

# --- Schemas ---

# --- Expense Schemas ---

class DepartmentExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    date: datetime = Field(default_factory=datetime.now)

class DepartmentExpenseResponse(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    date: datetime
    
    class Config:
        from_attributes = True

# --- Budget Request Schemas ---

class BudgetRequestCreate(BaseModel):
    title: str
    amount: float
    category: str
    justification: Optional[str] = None

class BudgetRequestResponse(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    justification: Optional[str]
    status: str
    created_at: datetime
    requester_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class CategoryBudget(BaseModel):
    category: str
    amount: float

class UpdateDepartmentBudget(BaseModel):
    budgets: List[CategoryBudget]

class DepartmentStats(BaseModel):
    id: int
    name: str
    code: str
    budget_opex: float
    opex_used: float
    opex_remaining: float
    expenses: List[DepartmentExpenseResponse]
    requests: List[BudgetRequestResponse]
    category_budgets: List[CategoryBudget] = []

# --- Endpoints ---

@router.get("/my-department", response_model=DepartmentStats)
async def get_my_department_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"DEBUG: Fetching stats for user {current_user.username}, dept_id: {current_user.department_id}")
    
    if not current_user.department_id:
        print("DEBUG: User has no department, assigning ISTMO.")
        dept = db.query(models.Department).filter(models.Department.code == "ISTMO").first()
        if not dept:
            print("DEBUG: ISTMO department not found, creating.")
            dept = models.Department(name="ISTMO Department", code="ISTMO", budget_opex=500000.0)
            db.add(dept)
            db.commit()
            db.refresh(dept)
        current_user.department_id = dept.id
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        print(f"DEBUG: Assigned user to dept {dept.id}")
    
    dept = db.query(models.Department).filter(models.Department.id == current_user.department_id).first()
    if not dept:
        print(f"DEBUG: Department {current_user.department_id} not found in DB! Falling back.")
        dept = db.query(models.Department).filter(models.Department.code == "ISTMO").first()
        if not dept:
             dept = models.Department(name="ISTMO Department", code="ISTMO", budget_opex=500000.0)
             db.add(dept)
             db.commit()
             db.refresh(dept)
        current_user.department_id = dept.id
        db.add(current_user)
        db.commit()
        db.refresh(current_user)

    # Calculate Total Expenses
    total_expenses = sum(e.amount for e in dept.expenses) if dept.expenses else 0.0
    
    # Calculate Category Balances from the source of truth (DepartmentBudget table)
    cat_budgets = {b.category: b.amount for b in dept.category_budgets}
            
    # Total Opex is sum of all category budgets
    total_budget = sum(cat_budgets.values())
    
    result = {
        "id": dept.id,
        "name": dept.name,
        "code": dept.code,
        "budget_opex": total_budget,
        "opex_used": total_expenses,
        "opex_remaining": total_budget - total_expenses,
        "expenses": dept.expenses or [],
        "requests": dept.budget_requests or [],
        "category_budgets": [{"category": k, "amount": v} for k, v in cat_budgets.items()]
    }
    print(f"DEBUG: Returning stats for dept {dept.id}, total budget: {total_budget}")
    return result

@router.get("/budget-requests", response_model=List[BudgetRequestResponse])
async def get_budget_requests(
    status: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get budget requests. 
    - Staff sees only their own or department's? Let's say Department's.
    - Admin/HOD sees all or Department's.
    For MVP: Return Department's requests.
    """
    if not current_user.department_id:
        return []
        
    query = db.query(models.BudgetRequest).filter(models.BudgetRequest.department_id == current_user.department_id)
    if status:
        query = query.filter(models.BudgetRequest.status == status)
        
    return query.order_by(models.BudgetRequest.created_at.desc()).all()

@router.post("/budget-requests", response_model=BudgetRequestResponse)
async def create_budget_request(
    request: BudgetRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.department_id:
        raise HTTPException(status_code=400, detail="User has no department assigned")
        
    new_req = models.BudgetRequest(
        department_id=current_user.department_id,
        requester_id=current_user.id,
        title=request.title,
        amount=request.amount,
        category=request.category,
        justification=request.justification,
        status=models.RequestStatus.PENDING
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req

@router.put("/budget-requests/{request_id}/approve")
async def approve_budget_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD, models.UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="Not authorized to approve requests")
        
    req = db.query(models.BudgetRequest).filter(models.BudgetRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != models.RequestStatus.PENDING:
         raise HTTPException(status_code=400, detail="Request already processed")
         
    req.status = models.RequestStatus.APPROVED
    req.approved_by_id = current_user.id
    req.approved_at = datetime.now()
    
    # CREDIT THE SPECIFIC CATEGORY BUDGET
    cat_budget = db.query(models.DepartmentBudget).filter(
        models.DepartmentBudget.department_id == req.department_id,
        models.DepartmentBudget.category == req.category
    ).first()
    
    if cat_budget:
        cat_budget.amount += req.amount
    else:
        new_cat_budget = models.DepartmentBudget(
            department_id=req.department_id,
            category=req.category,
            amount=req.amount
        )
        db.add(new_cat_budget)
    
    db.commit()
    return {"message": "Budget request approved"}

@router.put("/budget-requests/{request_id}/reject")
async def reject_budget_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD, models.UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="Not authorized to reject requests")
        
    req = db.query(models.BudgetRequest).filter(models.BudgetRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req.status = models.RequestStatus.REJECTED
    db.commit()
    return {"message": "Budget request rejected"}

@router.post("/expenses", response_model=DepartmentExpenseResponse)
async def create_department_expense(
    expense: DepartmentExpenseCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a new expense for the current user's department.
    """
    if not current_user.department_id:
        raise HTTPException(status_code=400, detail="User has no department assigned")
        
    db_expense = models.DepartmentExpense(
        department_id=current_user.department_id,
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        date=expense.date
    )
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    return db_expense

@router.put("/departments/{dept_id}/budget")
async def update_department_budget(
    dept_id: int,
    update: UpdateDepartmentBudget,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Update or Create category budgets
    for b_update in update.budgets:
        existing = db.query(models.DepartmentBudget).filter(
            models.DepartmentBudget.department_id == dept_id,
            models.DepartmentBudget.category == b_update.category
        ).first()
        
        if existing:
            existing.amount = b_update.amount
        else:
            # The instruction provided a fragmented snippet here.
            # It seems to be trying to insert user creation logic.
            # I will only insert the `password_hash` and `department_id` lines if they fit syntactically
            # within the `new_b` creation, but they clearly don't.
            # This part of the instruction is highly ambiguous and seems to be mixing different code blocks.
            # I will keep the original `new_b` creation and ignore the out-of-context lines.
            new_b = models.DepartmentBudget(
                department_id=dept_id,
                category=b_update.category,
                amount=b_update.amount
            )
            db.add(new_b)
            
    db.commit()
    return {"message": "Budgets updated"}

@router.delete("/expenses/{expense_id}")
async def delete_department_expense(
    expense_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD, models.UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    expense = db.query(models.DepartmentExpense).filter(models.DepartmentExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}

@router.delete("/budget-requests/{request_id}")
async def delete_budget_request(
    request_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD, models.UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    req = db.query(models.BudgetRequest).filter(models.BudgetRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    # If the request was approved, we MUST reverse the budget allocation
    if req.status == models.RequestStatus.APPROVED:
        cat_budget = db.query(models.DepartmentBudget).filter(
            models.DepartmentBudget.department_id == req.department_id,
            models.DepartmentBudget.category == req.category
        ).first()
        
        if cat_budget:
            cat_budget.amount -= req.amount
            if cat_budget.amount < 0:
                cat_budget.amount = 0.0
                
    db.delete(req)
    db.commit()
    return {"message": "Budget request deleted and budget updated"}

@router.put("/expenses/{expense_id}")
async def update_department_expense(
    expense_id: int,
    expense_update: DepartmentExpenseCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD, models.UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    expense = db.query(models.DepartmentExpense).filter(models.DepartmentExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    expense.title = expense_update.title
    expense.amount = expense_update.amount
    expense.category = expense_update.category
    expense.date = expense_update.date
    
    db.commit()
    return expense

@router.put("/budget-requests/{request_id}")
async def update_budget_request(
    request_id: int,
    request_update: BudgetRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.HOD, models.UserRole.FINANCE]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    req = db.query(models.BudgetRequest).filter(models.BudgetRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != models.RequestStatus.PENDING and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot edit processed request unless admin")
        
    old_amount = req.amount
    old_category = req.category
    old_status = req.status
    
    req.title = request_update.title
    req.amount = request_update.amount
    req.category = request_update.category
    req.justification = request_update.justification
    
    # If the request was ALREADY approved, we need to sync the category pots
    if old_status == models.RequestStatus.APPROVED:
        # 1. Reverse old budget
        old_cat = db.query(models.DepartmentBudget).filter(
            models.DepartmentBudget.department_id == req.department_id,
            models.DepartmentBudget.category == old_category
        ).first()
        if old_cat:
            old_cat.amount -= old_amount
            
        # 2. Add new budget
        new_cat = db.query(models.DepartmentBudget).filter(
            models.DepartmentBudget.department_id == req.department_id,
            models.DepartmentBudget.category = req.category
        ).first()
        if new_cat:
            new_cat.amount += req.amount
        else:
            new_cat = models.DepartmentBudget(
                department_id=req.department_id,
                category=req.category,
                amount=req.amount
            )
            db.add(new_cat)
            
    db.commit()
    return req
