const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : "";

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

// Basic fetch wrapper
export const getProjects = async (ownerId = null) => {
    let url = `${API_URL}/projects`;
    if (ownerId) url += `?owner_id=${ownerId}`;

    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch projects");
    return response.json();
};

export const createProject = async (data) => {
    const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to create project");
    return response.json();
};

export const getProjectDetails = async (id) => {
    const response = await fetch(`${API_URL}/projects/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch project details");
    return response.json();
};

export const getProjectWBS = async (id) => {
    const response = await fetch(`${API_URL}/projects/${id}/wbs`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch WBS");
    return response.json();
};

export const getProjectPayments = async (id) => {
    const response = await fetch(`${API_URL}/projects/${id}/payments`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch payments");
    return response.json();
};

export const createProjectWBS = async (id, data) => {
    const response = await fetch(`${API_URL}/projects/${id}/wbs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to create WBS phase");
    return response.json();
};

export const createProjectTask = async (id, data) => {
    const response = await fetch(`${API_URL}/projects/${id}/tasks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to create task");
    return response.json();
};

export const createProjectPayment = async (id, data) => {
    const response = await fetch(`${API_URL}/projects/${id}/payments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to create payment");
    return response.json();
};

export const updateProjectPayment = async (paymentId, data) => {
    const response = await fetch(`${API_URL}/payments/${paymentId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to update payment");
    return response.json();
};

export const deleteProjectPayment = async (paymentId) => {
    const response = await fetch(`${API_URL}/payments/${paymentId}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete payment");
    return response.json();
};

export const deleteProject = async (id) => {
    const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete project");
    return response.json();
};

export const updateProject = async (id, data) => {
    const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to update project");
    return response.json();
};

export const deleteProjectWBS = async (wbsId) => {
    const response = await fetch(`${API_URL}/wbs/${wbsId}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete phase");
    return response.json();
};

export const deleteProjectTask = async (taskId) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete task");
    return response.json();
};

export const bulkDeleteProjectTasks = async (taskIds) => {
    const response = await fetch(`${API_URL}/tasks/bulk-delete`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(taskIds)
    });
    if (!response.ok) throw new Error("Failed to delete tasks");
    return response.json();
};

export const updateProjectWBS = async (wbsId, data) => {
    const response = await fetch(`${API_URL}/wbs/${wbsId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to update phase");
    return response.json();
};

export const updateProjectTask = async (taskId, data) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to update task");
    return response.json();
};

export const downloadWBSTemplate = async () => {
    const response = await fetch(`${API_URL}/tasks/template`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) throw new Error("Failed to download template");
    return response.blob();
};

export const importWBSTasks = async (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/projects/${projectId}/tasks/import`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to import tasks");
    }
    return response.json();
};

export const moveProjectTask = async (taskId, direction) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}/move`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ direction })
    });
    if (!response.ok) throw new Error("Failed to move task");
    return response.json();
};
