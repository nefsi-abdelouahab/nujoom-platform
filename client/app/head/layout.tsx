import Sidebar from "@/components/layout/Sidebar";
import RoleGuard from "@/components/layout/RoleGuard";

const headLinks = [
  { href: "/head", label: "نظرة عامة" },
  { href: "/head/scoring", label: "تقييم معياري" },
  { href: "/head/review", label: "مراجعة واعتماد" },
  { href: "/head/qualifiers", label: "تحديد المتأهلين" },
  { href: "/head/reports", label: "تقرير اللجنة" },
];

export default function HeadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="head">
      <div className="flex min-h-screen">
        <Sidebar title="لوحة رئيس اللجنة" links={headLinks} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </RoleGuard>
  );
}