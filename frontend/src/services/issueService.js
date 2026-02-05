const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000/issues" : "/issues";

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

const getIssues = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_URL}?${query}` : API_URL;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch issues");
    return response.json();
};

const createIssue = async (issueData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(issueData)
    });
    if (!response.ok) throw new Error("Failed to create issue");
    return response.json();
};

const getIssue = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch issue");
    return response.json();
};

const updateIssue = async (id, issueData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(issueData)
    });
    if (!response.ok) throw new Error("Failed to update issue");
    return response.json();
};

const deleteIssue = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete issue");
    return response.json();
};

export default {
    getIssues,
    createIssue,
    getIssue,
    updateIssue,
    deleteIssue
};
