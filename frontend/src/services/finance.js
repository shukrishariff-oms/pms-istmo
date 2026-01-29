const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : "";

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

export const getDepartmentStats = async () => {
    const response = await fetch(`${API_URL}/finance/my-department`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch department stats");
    return response.json();
};

export const createDepartmentExpense = async (data) => {
    const response = await fetch(`${API_URL}/finance/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to create expense");
    return response.json();
};

export const updateDepartmentBudget = async (deptId, budgets) => {
    const response = await fetch(`${API_URL}/finance/departments/${deptId}/budget`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ budgets })
    });
    if (!response.ok) throw new Error("Failed to update budget");
    return response.json();
};

// Budget Requests

export const getBudgetRequests = async () => {
    const response = await fetch(`${API_URL}/finance/budget-requests`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch requests");
    return response.json();
};

export const createBudgetRequest = async (data) => {
    const response = await fetch(`${API_URL}/finance/budget-requests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to create request");
    return response.json();
};

export const approveBudgetRequest = async (id) => {
    const response = await fetch(`${API_URL}/finance/budget-requests/${id}/approve`, {
        method: 'PUT',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to approve request");
    return response.json();
};

export const rejectBudgetRequest = async (id) => {
    const response = await fetch(`${API_URL}/finance/budget-requests/${id}/reject`, {
        method: 'PUT',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to reject request");
    return response.json();
};

export const deleteDepartmentExpense = async (id) => {
    const response = await fetch(`${API_URL}/finance/expenses/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete expense");
    return response.json();
};

export const deleteBudgetRequest = async (id) => {
    const response = await fetch(`${API_URL}/finance/budget-requests/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete request");
    return response.json();
};

export const updateDepartmentExpense = async (id, data) => {
    const response = await fetch(`${API_URL}/finance/expenses/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to update expense");
    return response.json();
};

export const updateBudgetRequest = async (id, data) => {
    const response = await fetch(`${API_URL}/finance/budget-requests/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to update request");
    return response.json();
};
