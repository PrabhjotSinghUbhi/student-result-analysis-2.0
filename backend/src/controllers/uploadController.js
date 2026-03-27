import * as uploadService from "../services/uploadService.js";

export async function uploadResults(req, res) {
  const data = await uploadService.processBulkUpload(req.file?.buffer, req.file?.originalname || "upload");
  res.json(data);
}
