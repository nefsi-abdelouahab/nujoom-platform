import Sidebar from "@/components/layout/Sidebar";
import RoleGuard from "@/components/layout/RoleGuard";

const adminLinks = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/phases", label: "المراحل والفئات" },
  { href: "/admin/circles", label: "الدوائر والمراكز" },
  { href: "/admin/committees", label: "اللجان" },
  { href: "/admin/judges", label: "المحكّمون" },
  { href: "/admin/criteria", label: "المعايير والمؤشرات" },
  { href: "/admin/participants", label: "المشاركون" },
  { href: "/admin/results", label: "النتائج والترتيب" },
  { href: "/admin/reports", label: "التقارير" },
  { href: "/admin/settings", label: "الإعدادات" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="admin">
      <div className="flex min-h-screen">
        <Sidebar title="لوحة مدير النظام" links={adminLinks} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </RoleGuard>
  );
}