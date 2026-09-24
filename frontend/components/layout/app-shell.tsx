"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { TimeSeriesModal } from "@/components/grid-inspector/time-series-modal";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#F3F8FC] text-navy font-sans antialiased">
      {/* Persistent Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <TimeSeriesModal />
    </div>
  );
};
