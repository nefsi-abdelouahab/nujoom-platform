import { Router } from "express";
import { bootstrapAdmin, login, selectCommittee, getMe } from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/bootstrap-admin", bootstrapAdmin);
router.post("/login", login);
router.post("/select-committee", authenticate, selectCommittee);
router.get("/me", authenticate, getMe);

export default router;