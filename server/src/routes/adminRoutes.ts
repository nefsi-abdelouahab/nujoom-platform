import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as phaseCtrl from "../controllers/phaseController";
import * as categoryCtrl from "../controllers/categoryController";
import * as circleCtrl from "../controllers/circleController";
import * as criterionCtrl from "../controllers/criterionController";
import * as committeeCtrl from "../controllers/committeeController";
import * as userCtrl from "../controllers/userController";
import * as participantCtrl from "../controllers/participantController";
import * as resultCtrl from "../controllers/resultController";
import * as reportCtrl from "../controllers/reportController";

const router = Router();

router.use(authenticate, authorize("admin"));

// ---- المراحل ----
router.get("/phases", phaseCtrl.listPhases);
router.post("/phases", phaseCtrl.createPhase);
router.put("/phases/:id", phaseCtrl.updatePhase);
router.delete("/phases/:id", phaseCtrl.deletePhase);

// ---- الفئات ----
router.get("/categories", categoryCtrl.listCategories);
router.post("/categories", categoryCtrl.createCategory);
router.put("/categories/:id", categoryCtrl.updateCategory);
router.delete("/categories/:id", categoryCtrl.deleteCategory);

// ---- الدوائر/المراكز ----
router.get("/circles", circleCtrl.listCircles);
router.post("/circles", circleCtrl.createCircle);
router.put("/circles/:id", circleCtrl.updateCircle);
router.delete("/circles/:id", circleCtrl.deleteCircle);

// ---- المعايير ----
router.get("/criteria", criterionCtrl.listCriteria);
router.post("/criteria", criterionCtrl.createCriterion);
router.put("/criteria/:id", criterionCtrl.updateCriterion);
router.delete("/criteria/:id", criterionCtrl.deleteCriterion);

// ---- المؤشرات (Embedded داخل معيار) ----
router.post("/criteria/:criterionId/indicators", criterionCtrl.addIndicator);
router.put("/criteria/:criterionId/indicators/:indicatorId", criterionCtrl.updateIndicator);
router.delete("/criteria/:criterionId/indicators/:indicatorId", criterionCtrl.deleteIndicator);

// ---- اللجان ----
router.get("/committees", committeeCtrl.listCommittees);
router.post("/committees", committeeCtrl.createCommittee);
router.put("/committees/:id", committeeCtrl.updateCommittee);
router.delete("/committees/:id", committeeCtrl.deleteCommittee);

// ---- تعيينات اللجنة/المعيار/المحكّم ----
router.get("/committees/:id/assignments", committeeCtrl.getCommitteeAssignments);
router.post("/committees/:id/assignments", committeeCtrl.addAssignment);
router.delete("/committees/:id/assignments/:assignmentId", committeeCtrl.deleteAssignment);

// ---- المستخدمون/المحكّمون ----
router.get("/users", userCtrl.listUsers);
router.post("/users", userCtrl.addJudge);
router.put("/users/:id", userCtrl.updateUser);
router.delete("/users/:id", userCtrl.deleteUser);

// ---- المشاركون ----
router.get("/participants", participantCtrl.listParticipants);
router.post("/participants", participantCtrl.createParticipants);
router.put("/participants/:id", participantCtrl.updateParticipant);
router.delete("/participants/:id", participantCtrl.deleteParticipant);

// ---- الترحيل بين المراحل (admin يمكنه أيضًا تشغيله لأي لجنة) ----
router.post("/committees/:id/advance-qualified", participantCtrl.advanceQualifiedParticipants);

// ---- النتائج والترتيب ----
router.get("/committees/:id/results", resultCtrl.getCommitteeResultsAdmin);

// ---- التقارير ----
router.get("/committees/:id/report.docx", reportCtrl.downloadCommitteeReportAdmin);



export default router;