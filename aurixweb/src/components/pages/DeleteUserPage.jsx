import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstanceNoHeader } from "../../services/axiosConfig";
import ModulePageLayout from "../layout/ModulePageLayout";
import { logSystemDetails } from "../../services/SystemDetailsApi";

const DeleteUserPage = () => {
  const navigate = useNavigate();
  const [usernameToDelete, setUsernameToDelete] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}") || {};
  const currentUsername = (currentUser.username || "").toUpperCase();

  const normalizedRoles = Array.isArray(currentUser.roles)
    ? currentUser.roles
      .map((r) => (typeof r === "string" ? r : r.role || ""))
      .map((r) => r.toUpperCase())
      .filter(Boolean)
    : typeof currentUser.roles === "string"
      ? [currentUser.roles.toUpperCase()]
      : [];

  const hasDeleteAccess = normalizedRoles.some((role) => role !== "ROLE_USER");

  const isFailureMessage = (text) => {
    if (!text) return false;
    const normalizedText = text.toLowerCase();
    return /(not found|failed|unable|error|does not exist)/.test(normalizedText);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = usernameToDelete.trim().toUpperCase();
    if (!trimmedUsername) {
      setError("Please enter the username you want to delete.");
      return;
    }

    if (trimmedUsername === currentUsername) {
      setError("You cannot delete your own account.");
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstanceNoHeader.delete(`/user/delete/${encodeURIComponent(trimmedUsername)}`, {
        params: { loginUser: currentUsername },
      });
      const backendMessage = typeof response.data === "string" ? response.data : "";
      if (backendMessage && isFailureMessage(backendMessage)) {
        setError(backendMessage);
      } else {
        logSystemDetails({
          framename: "USER SETTINGS",
          operation: "DELETE_USER",
          description: `Deleted user '${trimmedUsername}'`,
        });
      }
      setUsernameToDelete("");
    } catch (err) {
      console.error("Delete user error:", err.response?.data || err);
      const status = err.response?.status;
      const backendMessage = err.response?.data;
      if (status === 404) {
        setError("Target user not found.");
      } else {
        setError(backendMessage || "Could not delete user. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModulePageLayout title="Delete User" navigate={navigate}>
      <div className="w-full mx-auto bg-white dark:bg-slate-900 shadow-2xl rounded-xl p-6 border border-slate-200 dark:border-slate-700/60 border-slate-100 dark:border-slate-700/60">
        {!hasDeleteAccess ? (
          <div className="max-w-3xl mx-auto mt-2 p-8 bg-yellow-50 rounded-2xl border border-slate-200 dark:border-slate-700/60 border-yellow-200 text-yellow-800">
            <h1 className="text-2xl font-semibold mb-2">Access restricted</h1>
            <p>Delete users is available only to administrative roles (non-USER accounts).</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto mt-2 px-8 py-10 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Provide the username to delete along with your current login (shown below) so the backend knows
              who is initiating the request.
            </p>
            <div className="text-sm text-slate-600 dark:text-slate-300 text-center mb-6">
              Current login: <span className="font-semibold">{currentUsername || "Unknown"}</span>
            </div>
            {error && <div className="bg-rose-50 border border-slate-200 dark:border-slate-700/60 border-rose-200 text-rose-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleDelete} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Username to delete</label>
                <input
                  type="text"
                  value={usernameToDelete}
                  onChange={(e) => setUsernameToDelete(e.target.value)}
                  placeholder="Enter username (e.g., ADMIN)"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700/60 border-slate-300 dark:border-slate-600 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-rose-600 text-white font-semibold rounded-full shadow-lg hover:bg-rose-700 transition-colors disabled:bg-slate-400 dark:bg-slate-800 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting..." : "Delete User"}
              </button>
            </form>
          </div>
        )}
      </div>
    </ModulePageLayout>
  );
};

export default DeleteUserPage;

