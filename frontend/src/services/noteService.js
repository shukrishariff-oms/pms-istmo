const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : "";

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

export const getNotes = async () => {
    const response = await fetch(`${API_URL}/notes/`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch notes");
    return response.json();
};

export const createNote = async (data) => {
    const response = await fetch(`${API_URL}/notes/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to create note");
    return response.json();
};

export const updateNote = async (id, data) => {
    const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to update note");
    return response.json();
};

export const deleteNote = async (id) => {
    const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete note");
    return response.json();
};
