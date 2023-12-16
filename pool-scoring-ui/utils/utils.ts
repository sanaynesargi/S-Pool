const prod = process.env.NODE_ENV === "production";

export const apiUrl = prod ? "34.216.190.181/api" : "localhost:8000";
