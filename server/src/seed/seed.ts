/**
 * seed.ts — سكريبت إدخال البيانات الابتدائية في MongoDB
 * يُشغَّل بأمر: npm run seed
 * يُنشئ نفس بيانات Mock الحالية في الفرونت إند بشكل حرفي،
 * بنفس كلمات المرور المعروفة لكن مُشفَّرة بـ bcrypt.
 *
 * آمن للتشغيل أكثر من مرة: يمسح البيانات القديمة أولًا ثم يُعيد الإدخال.
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { Phase } from "../models/Phase";
import { Category } from "../models/Category";
import { Circle } from "../models/Circle";
import { Committee } from "../models/Committee";
import { Criterion } from "../models/Criterion";
import { User } from "../models/User";
import { CommitteeCriterionAssignment } from "../models/CommitteeCriterionAssignment";
import { Participant } from "../models/Participant";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI غير معرّف في .env");

  await mongoose.connect(uri);
  console.log("✅ اتصال بقاعدة البيانات ناجح\n");

  // ---- 1. مسح كل البيانات القديمة (بالترتيب الصحيح لتجنب مشاكل المراجع) ----
  await CommitteeCriterionAssignment.deleteMany({});
  await Participant.deleteMany({});
  await Committee.deleteMany({});
  await Circle.deleteMany({});
  await Phase.deleteMany({});
  await Category.deleteMany({});
  await Criterion.deleteMany({});
  await User.deleteMany({});
  console.log("🗑️  تم مسح البيانات القديمة\n");

  // ---- 2. المراحل ----
  const [phaseQualifiers, phaseSemi, phaseFinal] = await Phase.insertMany([
    { name: "التصفيات",    type: "qualifiers", order: 1 },
    { name: "نصف النهائي", type: "semifinal",  order: 2 },
    { name: "النهائي",    type: "final",       order: 3 },
  ]);
  console.log("✅ المراحل (3)");

  // ---- 3. الفئات ----
  await Category.insertMany([
    { name: "الأطفال",  order: 1 },
    { name: "اليافعون", order: 2 },
    { name: "الشباب",   order: 3 },
  ]);
  console.log("✅ الفئات (3)");

  // ---- 4. الدوائر (كلها تحت مرحلة التصفيات) ----
  const [circleEast, circleWest, circleNorth, circleSouth] = await Circle.insertMany([
    { name: "الدائرة الشرقية", phaseId: phaseQualifiers._id },
    { name: "الدائرة الغربية", phaseId: phaseQualifiers._id },
    { name: "الدائرة الشمالية", phaseId: phaseQualifiers._id },
    { name: "الدائرة الجنوبية", phaseId: phaseQualifiers._id },
  ]);
  console.log("✅ الدوائر (4)");

  // ---- 5. المعايير والمؤشرات (Embedded) ----
  const [crit1, crit2, crit3, crit4] = await Criterion.insertMany([
    {
      name: "المعيار الأول",
      indicators: [
        { name: "المؤشر الأول",  maxScore: 1 },
        { name: "المؤشر الثاني", maxScore: 1 },
        { name: "المؤشر الثالث", maxScore: 1 },
      ],
    },
    {
      name: "المعيار الثاني",
      indicators: [
        { name: "المؤشر الأول",  maxScore: 1 },
        { name: "المؤشر الثاني", maxScore: 1 },
      ],
    },
    {
      name: "المعيار الثالث",
      indicators: [
        { name: "المؤشر الأول",  maxScore: 1 },
        { name: "المؤشر الثاني", maxScore: 1 },
        { name: "المؤشر الثالث", maxScore: 1 },
        { name: "المؤشر الرابع", maxScore: 1 },
      ],
    },
    {
      name: "المعيار الرابع",
      indicators: [
        { name: "المؤشر الأول",  maxScore: 1 },
        { name: "المؤشر الثاني", maxScore: 1 },
      ],
    },
  ]);
  console.log("✅ المعايير (4) مع مؤشراتها");

  // ---- 6. كلمات المرور (مُشفَّرة بـ bcrypt) ----
  const hashAdmin  = await bcrypt.hash("admin123", 10);
  const hashCommon = await bcrypt.hash("123456",   10);

  // ---- 7. المستخدمون ----
  // Admin
  const admin = await User.create({
    username:     "admin",
    passwordHash: hashAdmin,
    fullName:     "مدير النظام",
    role:         "admin",
    committeeIds: [],
  });

  // رؤساء اللجان — يُنشأون أولًا بدون committeeIds لأن اللجان لم تُنشأ بعد
  // سنُحدِّث committeeIds بعد إنشاء اللجان
  const head1 = await User.create({ username: "head1", passwordHash: hashCommon, fullName: "رئيس لجنة الدائرة الشرقية",  role: "head", committeeIds: [], criterionId: crit1._id });
  const head2 = await User.create({ username: "head2", passwordHash: hashCommon, fullName: "رئيس لجنة الدائرة الغربية",  role: "head", committeeIds: [], criterionId: crit1._id });
  const head3 = await User.create({ username: "head3", passwordHash: hashCommon, fullName: "رئيس لجنة الدائرة الشمالية", role: "head", committeeIds: [], criterionId: crit1._id });
  const head4 = await User.create({ username: "head4", passwordHash: hashCommon, fullName: "رئيس لجنة الدائرة الجنوبية", role: "head", committeeIds: [], criterionId: crit1._id });
  const head5 = await User.create({ username: "head5", passwordHash: hashCommon, fullName: "رئيس لجنة نصف النهائي",       role: "head", committeeIds: [], criterionId: crit1._id });
  const head6 = await User.create({ username: "head6", passwordHash: hashCommon, fullName: "رئيس لجنة النهائي",           role: "head", committeeIds: [], criterionId: crit1._id });

  // محكّمو لجنة الدائرة الشرقية
  const judge1 = await User.create({ username: "judge1", passwordHash: hashCommon, fullName: "المحكّم الأول - الشرقية",  role: "judge", committeeIds: [], criterionId: crit2._id });
  const judge2 = await User.create({ username: "judge2", passwordHash: hashCommon, fullName: "المحكّم الثاني - الشرقية", role: "judge", committeeIds: [], criterionId: crit3._id });
  const judge3 = await User.create({ username: "judge3", passwordHash: hashCommon, fullName: "المحكّم الثالث - الشرقية", role: "judge", committeeIds: [], criterionId: crit4._id });

  // محكّمو لجنة الدائرة الغربية
  const judge4 = await User.create({ username: "judge4", passwordHash: hashCommon, fullName: "المحكّم الأول - الغربية",  role: "judge", committeeIds: [], criterionId: crit2._id });
  const judge5 = await User.create({ username: "judge5", passwordHash: hashCommon, fullName: "المحكّم الثاني - الغربية", role: "judge", committeeIds: [], criterionId: crit3._id });
  const judge6 = await User.create({ username: "judge6", passwordHash: hashCommon, fullName: "المحكّم الثالث - الغربية", role: "judge", committeeIds: [], criterionId: crit4._id });

  console.log("✅ المستخدمون (13): admin + 6 رؤساء + 6 محكّمين");

  // ---- 8. اللجان ----
  const [comm1, comm2, comm3, comm4, comm5, comm6] = await Committee.insertMany([
    { name: "لجنة الدائرة الشرقية",  phaseId: phaseQualifiers._id, circleId: circleEast._id,  headUserId: head1._id },
    { name: "لجنة الدائرة الغربية",  phaseId: phaseQualifiers._id, circleId: circleWest._id,  headUserId: head2._id },
    { name: "لجنة الدائرة الشمالية", phaseId: phaseQualifiers._id, circleId: circleNorth._id, headUserId: head3._id },
    { name: "لجنة الدائرة الجنوبية", phaseId: phaseQualifiers._id, circleId: circleSouth._id, headUserId: head4._id },
    { name: "لجنة نصف النهائي",       phaseId: phaseSemi._id,                                  headUserId: head5._id },
    { name: "لجنة النهائي",           phaseId: phaseFinal._id,                                 headUserId: head6._id },
  ]);
  console.log("✅ اللجان (6)");

  // ---- 9. ربط committeeIds بالمستخدمين ----
  await Promise.all([
    User.findByIdAndUpdate(head1._id,  { committeeIds: [comm1._id] }),
    User.findByIdAndUpdate(head2._id,  { committeeIds: [comm2._id] }),
    User.findByIdAndUpdate(head3._id,  { committeeIds: [comm3._id] }),
    User.findByIdAndUpdate(head4._id,  { committeeIds: [comm4._id] }),
    User.findByIdAndUpdate(head5._id,  { committeeIds: [comm5._id] }),
    User.findByIdAndUpdate(head6._id,  { committeeIds: [comm6._id] }),
    User.findByIdAndUpdate(judge1._id, { committeeIds: [comm1._id] }),
    User.findByIdAndUpdate(judge2._id, { committeeIds: [comm1._id] }),
    User.findByIdAndUpdate(judge3._id, { committeeIds: [comm1._id] }),
    User.findByIdAndUpdate(judge4._id, { committeeIds: [comm2._id] }),
    User.findByIdAndUpdate(judge5._id, { committeeIds: [comm2._id] }),
    User.findByIdAndUpdate(judge6._id, { committeeIds: [comm2._id] }),
  ]);
  console.log("✅ ربط committeeIds بالمستخدمين");

  // ---- 10. تعيينات المعايير (8 تعيينات: 4 للجنة الشرقية + 4 للغربية فقط) ----
  await CommitteeCriterionAssignment.insertMany([
    // لجنة الدائرة الشرقية
    { committeeId: comm1._id, criterionId: crit1._id, judgeUserId: head1._id  },
    { committeeId: comm1._id, criterionId: crit2._id, judgeUserId: judge1._id },
    { committeeId: comm1._id, criterionId: crit3._id, judgeUserId: judge2._id },
    { committeeId: comm1._id, criterionId: crit4._id, judgeUserId: judge3._id },
    // لجنة الدائرة الغربية
    { committeeId: comm2._id, criterionId: crit1._id, judgeUserId: head2._id  },
    { committeeId: comm2._id, criterionId: crit2._id, judgeUserId: judge4._id },
    { committeeId: comm2._id, criterionId: crit3._id, judgeUserId: judge5._id },
    { committeeId: comm2._id, criterionId: crit4._id, judgeUserId: judge6._id },
  ]);
  console.log("✅ التعيينات (8)");

  // ---- 11. المشاركون التجريبيون (5 مشاركين) ----
  // نحتاج categoryIds من قاعدة البيانات
  const [catChild, catYouth, catAdult] = await (async () => {
    const cats = await Category.find().sort({ order: 1 });
    return cats;
  })();

  await Participant.insertMany([
    {
      fullName:    "أحمد بلحاج",
      birthDate:   new Date("2014-03-12"),
      age:         12,
      categoryId:  catChild._id,
      circleId:    circleEast._id,
      municipality: "بني ونيف",
      phaseId:     phaseQualifiers._id,
      qualified:   false,
      advanced:    false,
    },
    {
      fullName:    "ياسمين قاسمي",
      birthDate:   new Date("2010-07-22"),
      age:         16,
      categoryId:  catYouth._id,
      circleId:    circleEast._id,
      municipality: "بشار",
      phaseId:     phaseQualifiers._id,
      qualified:   false,
      advanced:    false,
    },
    {
      fullName:    "محمد أمين زروقي",
      birthDate:   new Date("2005-01-09"),
      age:         21,
      categoryId:  catAdult._id,
      circleId:    circleEast._id,
      municipality: "كنادسة",
      phaseId:     phaseQualifiers._id,
      qualified:   false,
      advanced:    false,
    },
    {
      fullName:    "نور الهدى مرابط",
      birthDate:   new Date("2013-11-02"),
      age:         13,
      categoryId:  catChild._id,
      circleId:    circleWest._id,
      municipality: "تبلبالة",
      phaseId:     phaseQualifiers._id,
      qualified:   false,
      advanced:    false,
    },
    {
      fullName:    "عبد الرحمن حمادي",
      birthDate:   new Date("2009-05-15"),
      age:         17,
      categoryId:  catYouth._id,
      circleId:    circleWest._id,
      municipality: "العبادلة",
      phaseId:     phaseQualifiers._id,
      qualified:   false,
      advanced:    false,
    },
  ]);
  console.log("✅ المشاركون التجريبيون (5)\n");

  // ---- ملخص بيانات الاعتماد ----
  console.log("=".repeat(50));
  console.log("📋 بيانات الدخول للاختبار:");
  console.log("   admin   / admin123  → مدير النظام");
  console.log("   head1   / 123456    → رئيس لجنة الشرقية");
  console.log("   head2   / 123456    → رئيس لجنة الغربية");
  console.log("   judge1  / 123456    → محكّم الشرقية (المعيار الثاني)");
  console.log("   judge2  / 123456    → محكّم الشرقية (المعيار الثالث)");
  console.log("   judge3  / 123456    → محكّم الشرقية (المعيار الرابع)");
  console.log("=".repeat(50));

  await mongoose.disconnect();
  console.log("\n✅ انتهى الـ Seed بنجاح");
}

seed().catch((err) => {
  console.error("❌ خطأ في الـ Seed:", err);
  process.exit(1);
});