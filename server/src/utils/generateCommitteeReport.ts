import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
} from "docx";

const PAGE_WIDTH = 11906;
const PAGE_MARGIN = 1134;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const cellBorders = { top: border, bottom: border, left: border, right: border };

function cell(
  text: string,
  opts: { width: number; bold?: boolean; shaded?: boolean }
) {
  return new TableCell({
    borders: cellBorders,
    width: { size: opts.width, type: WidthType.DXA },
    shading: opts.shaded ? { fill: "F2E6C9", type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text, bold: opts.bold ?? false, font: "Arial", size: 22, rightToLeft: true }),
        ],
      }),
    ],
  });
}

export interface ReportMember {
  fullName: string;
  isHead: boolean;
  criterionName?: string;
}

export interface ReportQualifiedParticipant {
  fullName: string;
  categoryName: string;
  municipality: string;
  age: number;
}

export interface CommitteeReportData {
  committeeName: string;
  phaseName?: string;
  circleName?: string;
  totalParticipants: number;
  qualifiedParticipants: ReportQualifiedParticipant[];
  members: ReportMember[];
  deliberationNotes?: string;
}

export async function generateCommitteeReport(data: CommitteeReportData): Promise<Buffer> {
  const {
    committeeName,
    phaseName,
    circleName,
    totalParticipants,
    qualifiedParticipants,
    members,
    deliberationNotes,
  } = data;

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });

  const infoRows: [string, string][] = [
    ["اسم اللجنة", committeeName],
    ["المرحلة", phaseName || "—"],
    ...(circleName ? ([["الدائرة / المركز", circleName]] as [string, string][]) : []),
    ["تاريخ إصدار التقرير", dateStr],
    ["وقت إصدار التقرير", timeStr],
    ["عدد المشاركين الإجمالي", String(totalParticipants)],
    ["عدد المتأهلين", String(qualifiedParticipants.length)],
  ];

  const infoTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH * 0.35, CONTENT_WIDTH * 0.65],
    rows: infoRows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            cell(label, { width: CONTENT_WIDTH * 0.35, bold: true, shaded: true }),
            cell(value, { width: CONTENT_WIDTH * 0.65 }),
          ],
        })
    ),
  });

  const sortedMembers = [...members].sort((a, b) => (b.isHead ? 1 : 0) - (a.isHead ? 1 : 0));

  const membersTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH * 0.55, CONTENT_WIDTH * 0.45],
    rows: [
      new TableRow({
        children: [
          cell("الاسم", { width: CONTENT_WIDTH * 0.55, bold: true, shaded: true }),
          cell("الصفة", { width: CONTENT_WIDTH * 0.45, bold: true, shaded: true }),
        ],
      }),
      ...sortedMembers.map(
        (m) =>
          new TableRow({
            children: [
              cell(m.fullName, { width: CONTENT_WIDTH * 0.55 }),
              cell(m.isHead ? "رئيس اللجنة" : `محكّم — ${m.criterionName || "—"}`, {
                width: CONTENT_WIDTH * 0.45,
              }),
            ],
          })
      ),
    ],
  });

  const qualifiersHeader = new TableRow({
    children: [
      cell("الرقم", { width: CONTENT_WIDTH * 0.1, bold: true, shaded: true }),
      cell("الاسم الكامل", { width: CONTENT_WIDTH * 0.35, bold: true, shaded: true }),
      cell("الفئة", { width: CONTENT_WIDTH * 0.2, bold: true, shaded: true }),
      cell("البلدية", { width: CONTENT_WIDTH * 0.2, bold: true, shaded: true }),
      cell("العمر", { width: CONTENT_WIDTH * 0.15, bold: true, shaded: true }),
    ],
  });

  const qualifiersRows = qualifiedParticipants.map(
    (p, idx) =>
      new TableRow({
        children: [
          cell(String(idx + 1), { width: CONTENT_WIDTH * 0.1 }),
          cell(p.fullName, { width: CONTENT_WIDTH * 0.35 }),
          cell(p.categoryName, { width: CONTENT_WIDTH * 0.2 }),
          cell(p.municipality || "—", { width: CONTENT_WIDTH * 0.2 }),
          cell(String(p.age || "—"), { width: CONTENT_WIDTH * 0.15 }),
        ],
      })
  );

  const qualifiersTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [
      CONTENT_WIDTH * 0.1,
      CONTENT_WIDTH * 0.35,
      CONTENT_WIDTH * 0.2,
      CONTENT_WIDTH * 0.2,
      CONTENT_WIDTH * 0.15,
    ],
    rows: [qualifiersHeader, ...qualifiersRows],
  });

  const heading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.RIGHT,
      spacing: { before: 320, after: 160 },
      children: [new TextRun({ text, bold: true, font: "Arial", size: 28, rightToLeft: true })],
    });

  const spacer = () => new Paragraph({ text: "" });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: 16838 },
            margin: { top: PAGE_MARGIN, right: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "مسابقة نجوم القراءة", bold: true, font: "Arial", size: 36, rightToLeft: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "C9A227", space: 4 } },
            children: [
              new TextRun({
                text: "محضر مداولات اللجنة",
                bold: true,
                font: "Arial",
                size: 28,
                color: "8A6D1F",
                rightToLeft: true,
              }),
            ],
          }),

          heading("معلومات اللجنة"),
          infoTable,
          spacer(),

          heading("أعضاء اللجنة"),
          sortedMembers.length > 0
            ? membersTable
            : new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "لا يوجد أعضاء مُسجّلون.", font: "Arial", size: 22, rightToLeft: true })],
              }),
          spacer(),

          heading(`قائمة المتأهلين (${qualifiedParticipants.length})`),
          qualifiedParticipants.length > 0
            ? qualifiersTable
            : new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "لم يتم تحديد أي متأهلين بعد في هذه اللجنة.",
                    font: "Arial",
                    size: 22,
                    rightToLeft: true,
                  }),
                ],
              }),
          spacer(),

          heading("ملخص المداولات"),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text:
                  deliberationNotes?.trim() ||
                  "اجتمعت اللجنة وراجعت درجات جميع المشاركين، واعتمدت النتائج النهائية، وحدّدت قائمة المتأهلين الموضحة أعلاه بالإجماع.",
                font: "Arial",
                size: 22,
                rightToLeft: true,
              }),
            ],
          }),

          spacer(),
          spacer(),
          heading("التوقيعات"),
          new Table({
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            columnWidths: [CONTENT_WIDTH * 0.5, CONTENT_WIDTH * 0.5],
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: CONTENT_WIDTH * 0.5, type: WidthType.DXA },
                    margins: { top: 400, bottom: 80, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 4 } },
                        children: [new TextRun({ text: "توقيع رئيس اللجنة", font: "Arial", size: 20, rightToLeft: true })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: CONTENT_WIDTH * 0.5, type: WidthType.DXA },
                    margins: { top: 400, bottom: 80, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 4 } },
                        children: [new TextRun({ text: "توقيع مدير المسابقة", font: "Arial", size: 20, rightToLeft: true })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}