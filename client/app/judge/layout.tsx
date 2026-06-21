import Sidebar from "@/components/layout/Sidebar";
import RoleGuard from "@/components/layout/RoleGuard";

const judgeLinks = [
  { href: "/judge", label: "نظرة عامة" },
  { href: "/judge/scoring", label: "شاشة التقييم" },
];

export default function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="judge">
      <div className="flex min-h-screen">
        <Sidebar title="لوحة المحكّم" links={judgeLinks} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </RoleGuard>
  );
}