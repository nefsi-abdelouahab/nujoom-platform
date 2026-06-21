import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { requireActiveCommittee } from "../middleware/committeeAccess";
import * as headCtrl from "../controllers/headController";
import * as resultCtrl from "../controllers/resultController";
import * as reportCtrl from "../controllers/reportController";


const router = Router();

router.use(authenticate, authorize("head"), requireActiveCommittee);

router.get("/overview", headCtrl.getOverview);
router.get("/participants", headCtrl.getParticipants);
router.get("/review", headCtrl.getReviewMatrix);
router.patch("/participants/:id/qualify", headCtrl.setQualified);
router.post("/advance-qualified", headCtrl.advanceQualified);
router.post("/scores", headCtrl.saveOwnScore);
router.post("/scores/:scoreId/approve", headCtrl.approveScore);
router.post("/scores/approve-many", headCtrl.approveMany);
router.get("/results", resultCtrl.getOwnCommitteeResults);
router.get("/report.docx", reportCtrl.downloadOwnCommitteeReport);


export default router;