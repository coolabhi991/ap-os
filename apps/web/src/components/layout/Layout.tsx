import type { ReactNode } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({
  children,
}: LayoutProps) {
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-[#FAFBFD] via-[#F6F8FB] to-[#EFF3F8]">

      <div className="flex h-full w-full">

        {/* Sidebar */}

        <Sidebar />

        {/* Main */}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Header */}

          <Header />

          {/* Content */}

          <main className="flex-1 overflow-y-auto px-5 pb-5">

            {children}

          </main>

        </div>

      </div>

    </div>
  );
}