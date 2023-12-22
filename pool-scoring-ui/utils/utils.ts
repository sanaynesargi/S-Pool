const prod = process.env.NODE_ENV === "production";

export const apiUrl = prod ? "35.88.136.43/api" : "localhost:8000/api";
