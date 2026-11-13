import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstanceNoHeader } from "../../services/axiosConfig";
import ModulePageLayout from "../layout/ModulePageLayout";
import { logSystemDetails } from "../../services/SystemDetailsApi";

const UpdateUserFrames = () => {
  const navigate = useNavigate();

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}") || {};
  const currentUsername = (currentUser.username || "").toUpperCase();
  const currentUserRoles = Array.isArray(currentUser.roles) ? currentUser.roles : [];
  const normalizedRoles = currentUserRoles.map((r) => (r.role || r || "").toUpperCase());
  const isSuperAdmin = normalizedRoles.includes("ROLE_SUPERADMIN");
  const isSuperUser = normalizedRoles.includes("ROLE_SUPERUSER");
  const canUpdateFrames = isSuperAdmin || isSuperUser;

  // For SuperAdmin, default to their own username; SuperUser always sees their own
  const [updateUsername, setUpdateUsername] = useState(currentUsername);
  const [updateFrames, setUpdateFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUserFrames, setLoadingUserFrames] = useState(false);
  const [error, setError] = useState("");
  const [frameOptions, setFrameOptions] = useState([]);
  const [framesLoading, setFramesLoading] = useState(true);
  const [usernameStatus, setUsernameStatus] = useState(null); // null | "checking" | "found" | "notfound"
  const debounceRef = useRef(null);

  // ✅ Load user's already-assigned frames (pre-checks the checkboxes)
  const loadAssignedFrames = useCallback(async (usernameToLoad) => {
    if (!usernameToLoad || !usernameToLoad.trim()) {
      setUpdateFrames([]);
      return;
    }
    setLoadingUserFrames(true);
    setError("");
    try {
      const response = await axiosInstanceNoHeader.get(
        `/user/frames/${encodeURIComponent(usernameToLoad.trim())}`
      );
      if (Array.isArray(response.data)) {
        setUpdateFrames(response.data.map((f) => f.toUpperCase()));
      } else {
        setUpdateFrames([]);
      }
    } catch (err) {
      const isNotFound = err.response?.status === 404;
      setError(
        isNotFound
          ? "Username does not exist."
          : "Failed to load assigned frames."
      );
      setUpdateFrames([]);
    } finally {
      setLoadingUserFrames(false);
    }
  }, []);

  // ✅ On mount: fetch all available frame options AND the current user's assigned frames together
  useEffect(() => {
    const init = async () => {
      // Load all frame options from DB
      try {
        const res = await axiosInstanceNoHeader.get("/user/allframes");
        if (Array.isArray(res.data) && res.data.length > 0) {
          setFrameOptions(res.data.map((f) => f.toUpperCase()));
        }
      } catch (err) {
        console.error("Failed to load frames from DB:", err);
        setFrameOptions([
          "CASH MARKING",
          "DAILY VISITING CUSTOMER",
          "EASY TOTAL",
          "GOLD HEATING DETAILS",
          "ITEM DETAILS",
          "ITEM DETAILS ENTRY",
          "SALES ENTRY",
          "USER REGISTER",
        ]);
      } finally {
        setFramesLoading(false);
      }

      // Pre-load already-assigned frames for the default user (currentUsername)
      if (canUpdateFrames && currentUsername) {
        await loadAssignedFrames(currentUsername);
      }
    };
    init();
  }, []); // runs once on mount

  const handleUsernameChange = (e) => {
    const nextUsername = e.target.value.toUpperCase();
    setUpdateUsername(nextUsername);
    setUsernameStatus(null);
    setUpdateFrames([]);
    setError("");

    // Clear previous debounce timer
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = nextUsername.trim();
    if (!trimmed) return;

    // Debounce: wait 500ms after user stops typing before checking
    setUsernameStatus("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axiosInstanceNoHeader.get("/user/existsByUsername", {
          params: { username: trimmed },
        });
        if (res.data === true) {
          setUsernameStatus("found");
          await loadAssignedFrames(trimmed);
        } else {
          setUsernameStatus("notfound");
          setUpdateFrames([]);
        }
      } catch (err) {
        setUsernameStatus("notfound");
        setUpdateFrames([]);
      }
    }, 500);
  };

  const handleUpdateFrameChange = (e) => {
    const { value, checked } = e.target;
    setUpdateFrames((prev) =>
      checked ? [...prev, value] : prev.filter((f) => f !== value)
    );
  };

  const checkUsernameExists = async (usernameToCheck) => {
    const response = await axiosInstanceNoHeader.get("/user/existsByUsername", {
      params: { username: usernameToCheck },
    });
    return Boolean(response.data);
  };

  const handleUpdateFramesSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!canUpdateFrames) {
      return setError("You are not authorized to update frames.");
    }

    const targetUsername = isSuperAdmin ? updateUsername.trim() : currentUsername;

    if (!targetUsername) {
      return setError("Please enter a username to update frames.");
    }

    if (
      isSuperUser &&
      updateUsername.trim() &&
      updateUsername.trim().toUpperCase() !== currentUsername
    ) {
      return setError("Super User can only update frames for their own account.");
    }

    if (updateFrames.length === 0) {
      return setError("Please select at least one frame to update.");
    }

    try {
      const exists = await checkUsernameExists(targetUsername);
      if (!exists) {
        setError("Username does not exist.");
        setUpdateFrames([]);
        return;
      }
    } catch (err) {
      const backend = err.response?.data;
      setError(backend ? backend : "Could not verify username. Please try again.");
      setUpdateFrames([]);
      return;
    }

    try {
      setLoading(true);
      await axiosInstanceNoHeader.put(
        `/user/update/${encodeURIComponent(targetUsername)}`,
        { frame: updateFrames.map((f) => ({ framename: f })) }
      );

      logSystemDetails({
        framename: "USER SETTINGS",
        operation: "UPDATE_USER_FRAMES",
        description: `Updated frames for user '${targetUsername}'`,
      });

      setError("");
      alert(`Frames updated successfully for ${targetUsername}`);
    } catch (err) {
      setError(err.response?.data || "Failed to update frames.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModulePageLayout title="Update User Frames" navigate={navigate}>
      <div className="w-full mx-auto bg-white dark:bg-slate-900 shadow-2xl rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700/60">
        {!canUpdateFrames ? (
          <div className="max-w-2xl mx-auto p-5 sm:p-8 bg-yellow-50 rounded-2xl border border-yellow-200 text-yellow-800">
            <h1 className="text-xl font-semibold">Access denied</h1>
            <p>Update frames is available only for Super Admin / Super User.</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-5 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
            {error && (
              <div className="text-red-600 bg-red-100 p-3 rounded mb-4">{error}</div>
            )}
            <form onSubmit={handleUpdateFramesSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Username
                </label>
                <input
                  type="text"
                  value={isSuperAdmin ? updateUsername : currentUsername}
                  onChange={isSuperAdmin ? handleUsernameChange : undefined}
                  placeholder="Enter username"
                  className={`w-full mt-1 px-3 py-2 border rounded bg-white dark:bg-slate-900 uppercase font-semibold transition-colors ${
                    isSuperAdmin
                      ? usernameStatus === "found"
                        ? "border-emerald-400 focus:ring-emerald-400"
                        : usernameStatus === "notfound"
                        ? "border-rose-400 focus:ring-rose-400"
                        : "border-slate-200 dark:border-slate-700/60"
                      : "border-slate-200 dark:border-slate-700/60"
                  }`}
                  disabled={!isSuperAdmin}
                />

                {/* Live username status indicator (SuperAdmin only) */}
                {isSuperAdmin && updateUsername.trim() && (
                  <p className={`mt-1.5 text-xs font-bold flex items-center gap-1.5 px-1 ${
                    usernameStatus === "checking"
                      ? "text-slate-400"
                      : usernameStatus === "found"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : usernameStatus === "notfound"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-400"
                  }`}>
                    {usernameStatus === "checking" && (
                      <><span className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin inline-block" /> Checking user...</>
                    )}
                    {usernameStatus === "found" && (
                      <><span>✔</span> User found — frames loaded below</>
                    )}
                    {usernameStatus === "notfound" && (
                      <><span>✖</span> User not found. Check the username.</>
                    )}
                  </p>
                )}

                {!isSuperAdmin && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Super User: editing only your own account
                  </p>
                )}
              </div>

              {/* Frames Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Frames
                    {updateFrames.length > 0 && (
                      <span className="ml-2 text-xs text-slate-600 font-bold bg-slate-100 dark:bg-slate-700/30 px-2 py-0.5 rounded-full">
                        {updateFrames.length} selected
                      </span>
                    )}
                  </p>
                  {(loadingUserFrames || framesLoading) && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin inline-block" />
                      {framesLoading ? "Loading modules..." : "Loading user frames..."}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {framesLoading ? (
                    <div className="col-span-2 flex items-center gap-2 py-6 text-slate-400">
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                      <span className="text-sm">Loading modules from database...</span>
                    </div>
                  ) : (
                    frameOptions.map((frame) => {
                      const isSelected = updateFrames.includes(frame);
                      return (
                        <label
                          key={frame}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? "border-slate-500 bg-slate-100 dark:bg-slate-700/20 dark:border-blue-400"
                              : "border-slate-200 dark:border-slate-700/60 hover:border-blue-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={frame}
                            checked={isSelected}
                            onChange={handleUpdateFrameChange}
                            className="h-4 w-4 shrink-0 accent-slate-600"
                          />
                          <span
                            className={`text-sm font-semibold break-words ${
                              isSelected
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {frame}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || framesLoading || loadingUserFrames}
                className="btn-primary bg-slate-600 rounded hover:bg-slate-500 w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Frames"}
              </button>
            </form>
          </div>
        )}
      </div>
    </ModulePageLayout>
  );
};

export default UpdateUserFrames;
