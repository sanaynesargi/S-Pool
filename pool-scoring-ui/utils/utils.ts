const prod = process.env.NODE_ENV === "production";

export const apiUrl = prod ? "44.226.227.51/api" : "localhost:8000/api";
