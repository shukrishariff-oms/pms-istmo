from app.db.database import SessionLocal
from app.models import sql_models

def recalculate_budgets():
    db = SessionLocal()
    try:
        print("Starting Budget Pot Recalculation...")
        
        # 1. Get all departments
        departments = db.query(sql_models.Department).all()
        
        for dept in departments:
            print(f"Recalculating for Department: {dept.code}")
            
            # 2. Get all APPROVED budget requests for this department
            all_requests = db.query(sql_models.BudgetRequest).filter(
                sql_models.BudgetRequest.department_id == dept.id
            ).all()
            print(f"  Found {len(all_requests)} total requests for {dept.code}")
            for r in all_requests:
                print(f"    - ID: {r.id}, Title: {r.title}, Category: {r.category}, Status: {r.status}, Amount: {r.amount}")
                
            approved_requests = [r for r in all_requests if r.status.lower() == "approved"]
            
            # 3. Aggregate by category
            category_totals = {}
            for req in approved_requests:
                category_totals[req.category] = category_totals.get(req.category, 0.0) + req.amount
                
            # 4. Update or Create DepartmentBudget entries
            # First, zero out existing budgets for this dept to ensure accuracy
            db.query(sql_models.DepartmentBudget).filter(
                sql_models.DepartmentBudget.department_id == dept.id
            ).update({"amount": 0.0})
            
            for category, total in category_totals.items():
                budget_entry = db.query(sql_models.DepartmentBudget).filter(
                    sql_models.DepartmentBudget.department_id == dept.id,
                    sql_models.DepartmentBudget.category == category
                ).first()
                
                if budget_entry:
                    budget_entry.amount = total
                    print(f"  - Updated {category}: RM {total}")
                else:
                    new_budget = sql_models.DepartmentBudget(
                        department_id=dept.id,
                        category=category,
                        amount=total
                    )
                    db.add(new_budget)
                    print(f"  - Created {category}: RM {total}")
            
        db.commit()
        print("Budget recalculation completed successfully.")
    except Exception as e:
        print(f"Error during recalculation: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    recalculate_budgets()
