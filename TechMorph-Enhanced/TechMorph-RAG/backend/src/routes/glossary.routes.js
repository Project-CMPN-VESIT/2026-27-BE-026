import { Router } from "express";
import { getGlossary, createGlossaryEntry, removeGlossaryEntry } from "../controllers/glossary.controller.js";
const router = Router();
router.get("/", getGlossary);
router.post("/", createGlossaryEntry);
router.delete("/:id", removeGlossaryEntry);
export default router;
