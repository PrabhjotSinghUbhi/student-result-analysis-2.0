import axios from "axios";

function normalizeApiBaseUrl(url) {
	const trimmed = String(url || "").trim().replace(/\/+$/, "");
	if (!trimmed) {
		return "http://localhost:5000/api";
	}

	return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const baseURL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const http = axios.create({ baseURL });
