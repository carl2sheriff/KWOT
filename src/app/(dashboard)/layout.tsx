import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="flex min-h-screen bg-surface">
          <Sidebar />
          <main className="ml-[240px] flex-1 min-h-screen">
            {children}
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
