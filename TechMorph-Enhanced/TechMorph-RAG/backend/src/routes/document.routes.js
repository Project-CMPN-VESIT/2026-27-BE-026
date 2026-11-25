import { Router } from "express";
import multer from "multer";
import { translateDocument } from "../controllers/document.controller.js";
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
router.post("/translate", upload.single("file"), translateDocument);
export default router;
