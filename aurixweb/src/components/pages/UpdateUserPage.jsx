import React from "react";
import { useNavigate } from "react-router-dom";
import ModulePageLayout from "../layout/ModulePageLayout";

const UpdateUserPage = () => {
  const navigate = useNavigate();

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}") || {};
  const currentUserRoles = Array.isArray(currentUser.roles) ? currentUser.roles : [];
  const isSuperAdmin = currentUserRoles.some(
    (r) => (r.role || r).toUpperCase() === "ROLE_SUPERADMIN"
  );

  return (
    <ModulePageLayout title="User Settings" navigate={navigate}>
      <div className="w-full mx-auto bg-white dark:bg-slate-900 shadow-2xl rounded-xl p-6 border border-slate-200 dark:border-slate-700/60 border-slate-100 dark:border-slate-700/60">
        <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
          <h1 className="text-3xl md:text-4xl font-extrabold text-center text-slate-900 dark:text-slate-100 mb-8">
            Update User Menu
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/changepassword")}
              className="w-full py-3 px-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-500"
            >
              Change Your Password
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => navigate("/updateframes")}
                className="w-full py-3 px-4 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-700"
              >
                Update User Frames
              </button>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Quick links:
            <button
              onClick={() => navigate("/register")}
              className="ml-1 font-medium text-slate-600 hover:text-slate-500"
            >
              Register User
            </button>
          </div>
        </div>
      </div>
    </ModulePageLayout>
  );
};

export default UpdateUserPage;

