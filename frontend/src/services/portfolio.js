const API_URL = window.location.hostname === 'localhost' ? "http://localhost:8000" : "";

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

export const getPortfolioDashboard = async () => {
    const response = await fetch(`${API_URL}/portfolio/dashboard`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch portfolio data");
    return response.json();
};
