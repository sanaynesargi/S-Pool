const prod = process.env.NODE_ENV === "production";

export const apiUrl = prod ? "3.95.92.109/api" : "localhost:8000/api";
