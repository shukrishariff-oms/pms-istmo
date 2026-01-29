const API_URL = "http://localhost:8000";

export const login = async (username, password) => {
    // Mock login for prototype if backend isn't fully ready with JWT
    // But we have backend setup, so let's try to hit it
    // Actually, we haven't implemented the token endpoint yet in backend/main.py
    // So let's mock it for the UI dev first, or implement backend auth.

    // Let's implement backend auth properly first?
    // User asked for "Build step-by-step: ... 3. API routes ... 4. Frontend integration"
    // I am jumping to frontend. I should probably ensure backend has a login endpoint.

    // For now, let's mock to unblock frontend work, or just hit the endpoint assuming I'll add it.

    const response = await fetch(`${API_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
    });

    if (!response.ok) {
        throw new Error("Login failed");
    }

    return response.json();
};
