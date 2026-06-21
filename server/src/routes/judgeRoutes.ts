import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { requireActiveCommittee } from "../middleware/committeeAccess";
import * as judgeCtrl from "../controllers/judgeController";

const router = Router();

router.use(authenticate, authorize("judge"), requireActiveCommittee);

router.get("/overview", judgeCtrl.getOverview);
router.get("/participants", judgeCtrl.getParticipants);
router.post("/scores", judgeCtrl.saveScore);

export default router;