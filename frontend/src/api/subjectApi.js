import { http } from "../lib/http";

export async function fetchSubjects() {
  const { data } = await http.get("/subjects");
  return data;
}

export async function createSubject(payload) {
  const { data } = await http.post("/subjects", payload);
  return data;
}

export async function updateSubject(id, payload) {
  const { data } = await http.put(`/subjects/${id}`, payload);
  return data;
}

export async function deleteSubject(id) {
  await http.delete(`/subjects/${id}`);
}
