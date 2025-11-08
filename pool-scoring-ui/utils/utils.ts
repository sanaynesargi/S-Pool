const prod = process.env.NODE_ENV === "production";

export const apiUrl = prod 
  ? (process.env.NEXT_PUBLIC_API_URL || "https://your-railway-url.railway.app") + "/api"
  : "http://localhost:8000/api";
