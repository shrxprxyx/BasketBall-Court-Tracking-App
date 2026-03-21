import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#0d0d1a]">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;