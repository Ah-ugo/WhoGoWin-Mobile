import axios from "axios";

const BASE_URL = "https://whogowin.onrender.com/api/v1";

export const apiService = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiService.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase();
    const url = `${config.baseURL}${config.url}`;
    console.log(`📤 ${method} request to ${url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error.message);
    return Promise.reject(error);
  }
);

// Response interceptor
apiService.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("❌ API Response Error:", {
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      console.error("❌ Network or Timeout Error:", error.message);
    }
    return Promise.reject(error);
  }
);
