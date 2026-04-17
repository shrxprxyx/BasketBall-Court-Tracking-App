import React from "react";
import { Routes, Route } from "react-router-dom";
import SignIn from "./SignIn";
import AdminDashboard from "./Admin/admindashboard";
import HomePage from "./homepage";
import AdminCourts from "./Admin/courts";
import DashboardLayout from "./User/DashBoardLayout";
import UserDashboard from "./User/userdashboard";
import BookingsPage from "./User/BookingsPage";
import ProfilePage from "./User/ProfilePage";
import AdminUsersPage from "./Admin/UserPage";

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<SignIn />} />

      {/* User area — DashboardLayout renders <Outlet /> for children */}
      <Route element={<DashboardLayout />}>
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/bookings"       element={<BookingsPage />} />
        <Route path="/profile"        element={<ProfilePage />} />
      </Route>

      {/* Admin area */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin/courts"    element={<AdminCourts />} />
      <Route path="/admin/UserPage" element={<AdminUsersPage />} />
    </Routes>
  );
};

export default App;
