import { http } from "../lib/http";

export async function fetchStudents() {
  const { data } = await http.get("/students");
  return data;
}

export async function createStudent(payload) {
  const { data } = await http.post("/students", payload);
  return data;
}

export async function updateStudent(id, payload) {
  const { data } = await http.put(`/students/${id}`, payload);
  return data;
}

export async function deleteStudent(id) {
  await http.delete(`/students/${id}`);
}

export async function fetchStudentById(id) {
  const { data } = await http.get(`/students/${id}`);
  return data;
}
