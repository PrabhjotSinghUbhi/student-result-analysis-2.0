import { http } from "../lib/http";

export async function fetchResults(params = {}) {
  const { data } = await http.get("/results", { params });
  return data;
}

export async function createResult(payload) {
  const { data } = await http.post("/results", payload);
  return data;
}
