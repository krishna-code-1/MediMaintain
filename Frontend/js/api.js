
const API_BASE_URL =
    window.MEDIMAINTAIN_API_BASE_URL ||
    (
        ["localhost", "127.0.0.1"].includes(window.location.hostname)
            ? `${window.location.protocol}//${window.location.hostname}:5000/api`
            : "https://medimaintain-bz7a.onrender.com/api"
    );

const apiRequest = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                `Invalid server response (HTTP ${response.status}).`
            );
        }

        if (!response.ok) {
            throw new Error(
                data?.message || `Request failed (HTTP ${response.status}).`
            );
        }

        if (data?.success === false) {
            throw new Error(data.message || "Something went wrong.");
        }

        return data;

    } catch (error) {
        const apiError = error instanceof TypeError
            ? new Error(
                `Cannot connect to backend: ${API_BASE_URL}. Check backend availability and CORS settings.`
            )
            : error;

        console.error("API Error:", apiError.message);
        throw apiError;
    }
};

const getAPI = (endpoint) => apiRequest(endpoint);

const postAPI = (endpoint, data) => apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data)
});

const putAPI = (endpoint, data) => apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(data)
});

const deleteAPI = (endpoint) => apiRequest(endpoint, {
    method: "DELETE"
});

window.apiRequest = apiRequest;
window.getAPI = getAPI;
window.postAPI = postAPI;
window.putAPI = putAPI;
window.deleteAPI = deleteAPI;
