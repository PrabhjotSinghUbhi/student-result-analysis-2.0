import { http } from "../lib/http";

export async function uploadResults(file) {
  const form = new FormData();
  form.append("file", file);

  const { data } = await http.post("/upload/results", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}
