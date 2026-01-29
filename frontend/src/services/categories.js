const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : "";

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

export const getCategories = async () => {
    const response = await fetch(`${API_URL}/categories/`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
};

export const createCategory = async (data) => {
    const response = await fetch(`${API_URL}/categories/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create category");
    }
    return response.json();
};

export const updateCategory = async (id, data) => {
    const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update category");
    }
    return response.json();
};

export const deleteCategory = async (id) => {
    const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to delete category");
    }
    return response.json();
};
