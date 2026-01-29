const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : "";

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

export const getDocuments = async (projectId = null) => {
    let url = `${API_URL}/documents/`;
    if (projectId) url += `?project_id=${projectId}`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch documents");
    }
    return response.json();
};

export const createDocument = async (data) => {
    const response = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create document");
    }
    return response.json();
};

export const updateDocument = async (id, data) => {
    const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update document");
    }
    return response.json();
};

export const deleteDocument = async (id) => {
    const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to delete document");
    }
    return response.json();
};
