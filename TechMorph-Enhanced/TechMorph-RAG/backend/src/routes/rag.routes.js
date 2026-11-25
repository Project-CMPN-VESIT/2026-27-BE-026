import { Router } from "express";
import multer from "multer";
import {
  listDocuments,
  uploadDocument,
  removeDocument,
  removeAllDocuments
} from "../controllers/rag.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get("/documents", listDocuments);
router.post("/documents", upload.single("file"), uploadDocument);
router.delete("/documents/:id", removeDocument);
router.delete("/documents", removeAllDocuments);

export default router;
