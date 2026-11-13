import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstanceNoHeader } from "../../services/axiosConfig";
import ModulePageLayout from "../layout/ModulePageLayout";
import { logSystemDetails } from "../../services/SystemDetailsApi";

const ChangePassword = () => {
  const navigate = useNavigate();
  const [changePasswordData, setChangePasswordData] = useState({ oldPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}") || {};
  const currentUsername = (currentUser.username || "").toUpperCase();

  const handleChangePasswordData = (e) => {
    const { name, value } = e.target;
    setChangePasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentUsername) {
      return setError("No logged-in user found. Please sign in first.");
    }

    const { oldPassword, newPassword } = changePasswordData;
    if (!oldPassword.trim() || !newPassword.trim()) {
      return setError("Please fill all fields.");
    }

    // Optional enforcement
    if (oldPassword === newPassword) {
      return setError("New password must be different from old password.");
    }

    try {
      setLoading(true);
      await axiosInstanceNoHeader.post("/user/changePassword", null, {
        params: {
          username: currentUsername,
          oldPassword,
          newPassword,
        },
      });

      logSystemDetails({
        framename: "USER SETTINGS",
        operation: "CHANGE_PASSWORD",
        description: `User '${currentUsername}' changed password`,
      });

      setSuccess("Password changed successfully.");
      setChangePasswordData({ oldPassword: "", newPassword: "" });
    } catch (err) {
      console.error("❌ Change password error:", err.response?.data);
      setError(err.response?.data || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModulePageLayout title="Change Password" navigate={navigate}>
      <div className="w-full mx-auto bg-white dark:bg-slate-900 shadow-2xl rounded-xl p-6 border border-slate-200 dark:border-slate-700/60 border-slate-100 dark:border-slate-700/60">
        <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Username (current)</label>
              <input
                type="text"
                value={currentUsername}
                disabled
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700/60 rounded bg-slate-100 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Old Password</label>
              <input
                type="password"
                name="oldPassword"
                value={changePasswordData.oldPassword}
                onChange={handleChangePasswordData}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700/60 rounded"
                placeholder="Current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={changePasswordData.newPassword}
                onChange={handleChangePasswordData}
                className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700/60 rounded"
                placeholder="New password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-teal-600 text-white rounded hover:bg-teal-500"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </ModulePageLayout>
  );
};

export default ChangePassword;

