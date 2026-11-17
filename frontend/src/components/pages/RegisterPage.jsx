import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstanceNoHeader } from "../../services/axiosConfig";
import ModulePageLayout from "../layout/ModulePageLayout";
import { logSystemDetails } from "../../services/SystemDetailsApi";
import { UserPlus, User, Lock, Shield, Layout, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "",
    selectedFrames: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [frames, setFrames] = useState([]);
  const [framesLoading, setFramesLoading] = useState(true);

  const navigate = useNavigate();

  // Dynamically load all frames from the database
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const response = await axiosInstanceNoHeader.get("/user/allframes");
        if (Array.isArray(response.data) && response.data.length > 0) {
          setFrames(response.data.map((f) => f.toUpperCase()));
        }
      } catch (err) {
        console.error("Failed to load frames from DB:", err);
        // Fallback to default frames if API fails
        setFrames([
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
    };
    fetchFrames();
  }, []);

  const roles = [
    { value: "ROLE_SUPERADMIN", label: "Super Admin" },
    { value: "ROLE_SUPERUSER", label: "Super User" },
    { value: "ROLE_ADMIN", label: "Admin" },
    { value: "ROLE_USER", label: "User" },
  ];

  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "username" ? value.toUpperCase() : value,
    }));

    if (name === "username") {
      setUsernameAvailable(null);
      setError("");
    }
  };

  const checkUsernameExists = async () => {
    const username = formData.username.trim();
    if (!username) {
      setUsernameAvailable(null);
      return;
    }
    try {
      const response = await axiosInstanceNoHeader.get("/user/existsByUsername", {
        params: { username },
      });
      setUsernameAvailable(!response.data);
      if (response.data) {
        setError("Username already exists. Pick another.");
      } else {
        setError("");
      }
    } catch (err) {
      console.error("❌ Username check failed:", err.response?.data || err);
      setUsernameAvailable(null);
      setError("Could not verify username availability. Try again.");
    }
  };

  const handleFrameChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      selectedFrames: checked
        ? [...prev.selectedFrames, value]
        : prev.selectedFrames.filter((f) => f !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.role) {
      return setError("Please select a role.");
    }

    if (formData.selectedFrames.length === 0) {
      return setError("Please select at least one frame.");
    }

    const payload = {
      username: formData.username,
      password: formData.password,
      role: { role: formData.role },
      frame: formData.selectedFrames.map((f) => ({ framename: f })),
    };

    try {
      setLoading(true);
      const checkRes = await axiosInstanceNoHeader.get("/user/existsByUsername", {
        params: { username: formData.username.trim() },
      });
      if (checkRes.data) {
        setError("Username already exists. Choose another username.");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("❌ Username check failed:", err.response?.data || err);
      setError("Could not verify username. Try again.");
      setLoading(false);
      return;
    }

    try {
      await axiosInstanceNoHeader.post("/user/register", payload);
      
      // Record system access log for user registration
      logSystemDetails(
        {
          framename: "USER REGISTER",
          operation: "REGISTER_USER",
          description: `Registered new user '${formData.username}' with role '${formData.role}'`,
        },
        true
      );

      setError("");
      navigate("/signin");
    } catch (err) {
      console.error("❌ Registration error:", err.response?.data);
      setError(err.response?.data || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModulePageLayout title="User Register" navigate={navigate}>
      <div className="w-full mx-auto max-w-2xl px-4 py-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Create Account</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Register a new user to the system</p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-2xl mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}



          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 px-1 uppercase tracking-wider">
                <User className="w-4 h-4" /> Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={checkUsernameExists}
                placeholder="Enter username"
                required
                className="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-[#eef5f0] dark:bg-emerald-900/10 px-4 py-3.5 font-bold uppercase focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
              {usernameAvailable === true && (
                <p className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 px-1 uppercase letter-spacing-widest">
                  <CheckCircle className="w-3.5 h-3.5" /> Username is available
                </p>
              )}
              {usernameAvailable === false && (
                <p className="mt-2 text-[11px] text-rose-600 font-bold flex items-center gap-1.5 px-1 uppercase letter-spacing-widest">
                  <AlertCircle className="w-3.5 h-3.5" /> Username already exists
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 px-1 uppercase tracking-wider">
                <Lock className="w-4 h-4" /> Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter secure password"
                required
                className="w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 px-1 uppercase tracking-wider">
                <Shield className="w-4 h-4" /> Assign Role
              </label>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                {roles.map((r) => (
                  <label key={r.value} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer group ${formData.role === r.value ? "bg-slate-600 border-slate-600 text-white shadow-lg shadow-slate-500/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 text-slate-600 dark:text-slate-400"}`}>
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={formData.role === r.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-sm font-bold tracking-tight">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 px-1 uppercase tracking-wider">
                <Layout className="w-4 h-4" /> Allowed Modules
              </label>
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {framesLoading ? (
                  <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                    <span className="text-sm font-medium">Loading modules from database...</span>
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="modern-table-header">
                      <tr>
                        <th className="px-6 py-4 text-left">Access</th>
                        <th className="px-6 py-4 text-left">Module Name</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900">
                      {frames.map((frame, idx) => (
                        <tr key={idx} className="modern-table-row hover:bg-slate-100/30 dark:hover:bg-slate-500/5 transition-colors cursor-pointer" onClick={() => {
                          const checked = formData.selectedFrames.includes(frame);
                          handleFrameChange({ target: { value: frame, checked: !checked } });
                        }}>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              readOnly
                              checked={formData.selectedFrames.includes(frame)}
                              className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 text-slate-600 focus:ring-slate-500 pointer-events-none"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{frame}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-slate-600 to-slate-500 text-white rounded-2xl font-bold shadow-xl shadow-slate-500/25 hover:from-slate-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" strokeWidth={3} />
                    Register Account
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Already have an account?</p>
            <button
              onClick={() => navigate("/signin")}
              className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-slate-500 active:scale-95 transition-all py-2 px-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-500/5"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Login
            </button>
          </div>
        </div>
      </div>
    </ModulePageLayout>
  );
};

export default RegisterPage;
