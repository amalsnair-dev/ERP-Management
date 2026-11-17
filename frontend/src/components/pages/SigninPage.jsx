import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstanceNoHeader } from "../../services/axiosConfig";
import { getDefaultShopCode } from "../../services/ShopAPI";
import MessagePopup from "../common/MessagePopup";
import { User, Lock } from "lucide-react";
import {
  clearAuthSession,
  getAllowedModulePaths,
  getCurrentShopCode,
  getFrameForPath,
  getPreferredModulePath,
  normalizeFrames,
  setAuthSession,
} from "../../utils/session";
import { APP_VERSION } from "../../config/version";
import companyApi from "../../services/CompanyAPI";
import { logSystemDetails } from "../../services/SystemDetailsApi";

const SigninPage = ({ setIsLoggedIn }) => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [defaultShopCode, setDefaultShopCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [companyName, setCompanyName] = useState("");
  const navigate = useNavigate();

  const showPopupMessage = (message) => {
    setPopupMessage(String(message || "").trim());
  };

  useEffect(() => {
    const loadDefaultShopCode = async () => {
      const pendingShopCode = sessionStorage.getItem("pendingShopCode");
      const currentShopCode = getCurrentShopCode();
      const pendingSigninMessage = sessionStorage.getItem("pendingSigninMessage");

      if (pendingSigninMessage) {
        setPopupMessage(pendingSigninMessage);
        sessionStorage.removeItem("pendingSigninMessage");
      }

      if (pendingShopCode) {
        setDefaultShopCode(String(pendingShopCode).trim().toUpperCase());
        return;
      }

      if (currentShopCode) {
        setDefaultShopCode(String(currentShopCode).trim().toUpperCase());
        return;
      }

      sessionStorage.removeItem("pendingShopSwitch");
      sessionStorage.removeItem("pendingShopCode");
      sessionStorage.clear();
      try {
        const code = await getDefaultShopCode();
        if (code) {
          setDefaultShopCode(String(code).trim().toUpperCase());
        }
      } catch (error) {
        showPopupMessage(error.message || "Connection error");
      }
    };

    loadDefaultShopCode();
  }, []);

  useEffect(() => {
    if (defaultShopCode) {
      const fetchCompany = async () => {
        try {
          const data = await companyApi().getCompanyDetails(defaultShopCode);
          if (Array.isArray(data)) {
            const nameObj = data.find((item) => item.key === "a");
            if (nameObj) {
              setCompanyName(nameObj.value);
            }
          }
        } catch (error) {
          console.error("Failed to fetch company name", error);
        }
      };
      fetchCompany();
    }
  }, [defaultShopCode]);

  const handleSignin = async (e) => {
    e.preventDefault();
    const normalizedUsername = username.trim().toUpperCase();
    const normalizedPassword = password.trim();
    const normalizedShopCode = defaultShopCode.trim().toUpperCase();

    if (!normalizedShopCode || !normalizedUsername || !normalizedPassword) {
      showPopupMessage("Please enter shop code, username and password");
      return;
    }

    setLoading(true);
    const payload = {
      username: normalizedUsername,
      password: normalizedPassword,
    };

    try {

        // Debug login details
  console.log("========== SIGN IN DETAILS ==========");
  console.log("Shop Code:", normalizedShopCode);
  console.log("Username:", normalizedUsername);
  console.log("Password:", normalizedPassword);
  console.log("=====================================");

      const response = await axiosInstanceNoHeader.post("/user/login", payload, {
        params: { shopcode: normalizedShopCode },
      });
      const userData = response.data;
      const frames = normalizeFrames(userData?.frames);
      const userId =
        userData?.id ?? userData?.userid ?? userData?.user_id ?? userData?.userId ?? null;

      const storageData = {
        ...userData,
        id: userId,
        userid: userId,
        user_id: userId,
        username: normalizedUsername,
        password: normalizedPassword,
        shopcode: normalizedShopCode,
        roles: userData?.roles,
        frames,
      };

      setAuthSession(storageData);
      setIsLoggedIn(true);

      // Log system access on login
      logSystemDetails({
        userid: userId,
        framename: "SIGNIN",
        operation: "LOGIN",
        description: `User ${normalizedUsername} logged in successfully`,
        shopcode: normalizedShopCode,
      });
      const pendingReturnPath = sessionStorage.getItem("pendingReturnPath");
      const allowedPaths = getAllowedModulePaths(storageData);
      const allowedPreferredPath = getPreferredModulePath(storageData);

      if (pendingReturnPath && !allowedPaths.includes(pendingReturnPath)) {
        const deniedFrame = getFrameForPath(pendingReturnPath) || "this frame";
        clearAuthSession({ preserveCurrentModule: true });
        setIsLoggedIn(false);
        showPopupMessage(`This user is not allowed to access ${deniedFrame}.`);
        return;
      }

      sessionStorage.removeItem("pendingShopSwitch");
      sessionStorage.removeItem("pendingShopCode");
      sessionStorage.removeItem("pendingSigninMessage");
      sessionStorage.removeItem("pendingReturnPath");

      const preferredPath =
        pendingReturnPath && pendingReturnPath === allowedPreferredPath
          ? pendingReturnPath
          : allowedPreferredPath;

      if (preferredPath) {
        navigate(preferredPath, { replace: true });
      } else {
        clearAuthSession();
        setIsLoggedIn(false);
        showPopupMessage("You do not have access to any module.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Login failed";
      showPopupMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const resetSigninState = () => {
    setPopupMessage("");
    setIsRightPanelActive(false);
    setLoading(false);
    setDefaultShopCode("");
    setUsername("");
    setPassword("");
    setIsLoggedIn(false);
    clearAuthSession({ preserveCurrentModule: false });
    sessionStorage.clear();
    localStorage.clear();
  };

  const isPwaInstalled = () => {
    if (typeof window === "undefined") {
      return false;
    }

    const displayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const displayModeFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
    const displayModeMinimalUi = window.matchMedia("(display-mode: minimal-ui)").matches;
    const isNavigatorStandalone = window.navigator.standalone === true;
    const isAndroidAppReferrer = String(window.document.referrer || "").startsWith("android-app://");

    return (
      displayModeStandalone ||
      displayModeFullscreen ||
      displayModeMinimalUi ||
      isNavigatorStandalone ||
      isAndroidAppReferrer
    );
  };

  const handleClose = () => {
    setPopupMessage("");
    setIsRightPanelActive(false);
    setLoading(false);
    resetSigninState();
    
    if (isPwaInstalled()) {
      try {
        window.close();
        setTimeout(() => {
          try {
            window.open('', '_self');
            window.close();
          } catch (e) {
            console.warn(e);
          }
        }, 100);
      }
      catch (error) {
        console.warn("close attempt failed:\n", error);
      }
    } else {
      try {
        window.location.reload();
      } catch {
        // ignore
      }
    }
  };

  return (
    <>
      <style>{`
.signin-container {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border border-slate-200 dark:border-slate-700/60: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
  width: 720px;
  max-width: 95%;
  min-height: 420px;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .signin-container {
  background: rgba(15, 23, 42, 0.7);
  border border-slate-200 dark:border-slate-700/60: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 15px 35px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.2);
}

.form-container {
  position: absolute;
  top: 0;
  height: 100%;
  width: 50%;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sign-in-container {
  left: 0;
  z-index: 2;
  opacity: 1;
  transform: translateX(0);
}

.about-container {
  left: 50%;
  opacity: 0;
  z-index: 1;
  transform: translateX(0);
}

.signin-container.right-panel-active .sign-in-container {
  transform: translateX(-100%);
  opacity: 0;
  z-index: 1;
}

.signin-container.right-panel-active .about-container {
  transform: translateX(0%);
  opacity: 1;
  z-index: 2;
}

.overlay-container {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;
}

.signin-container.right-panel-active .overlay-container {
  transform: translateX(-100%);
}

.overlay {
  background: #334155;
  color: white;
  position: relative;
  left: -100%;
  height: 100%;
  width: 200%;
  display: flex;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .overlay {
  background: #1e293b;
}

.signin-container.right-panel-active .overlay {
  transform: translateX(50%);
}

.overlay-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 40px;
  width: 50%;
  transition: transform 0.6s ease-in-out;
}

.overlay-left {
  transform: translateX(-20%);
}

.signin-container.right-panel-active .overlay-left {
  transform: translateX(0);
}

.overlay-right {
  transform: translateX(0);
}

.signin-container.right-panel-active .overlay-right {
  transform: translateX(20%);
}

@media (max-width: 767px) {
  .signin-container {
    width: 100%;
    max-width: 28rem;
    min-height: auto;
    display: block;
  }

  .form-container,
  .overlay-container {
    position: static;
    width: 100%;
    height: auto;
    transform: none !important;
    opacity: 1;
  }

  .sign-in-container,
  .about-container {
    left: auto;
  }

  .about-container {
    display: none;
  }

  .signin-container.right-panel-active .sign-in-container {
    display: none;
  }

  .signin-container.right-panel-active .about-container {
    display: flex;
  }

  .overlay-container {
    order: -1;
  }

  .overlay {
    left: 0;
    width: 100%;
    min-height: 10rem;
    border-radius: 0 0 16px 16px;
    transform: none !important;
  }

  .overlay-panel {
    width: 100%;
    padding: 24px 20px;
    transform: none !important;
  }

  .overlay-left {
    display: none;
  }

  .signin-container.right-panel-active .overlay-left {
    display: flex;
  }

  .signin-container.right-panel-active .overlay-right {
    display: none;
  }
}
      `}</style>

      <div className="min-h-screen min-h-dvh flex items-center justify-center px-4 py-6 relative bg-slate-50 dark:bg-slate-950 transition-colors duration-500">

        {/* Abstract Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-slate-500/10 dark:bg-slate-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div
          className={`signin-container ${isRightPanelActive ? "right-panel-active" : ""} flex justify-center items-center mx-auto my-10`}
        >
          <div className="form-container sign-in-container flex justify-center items-center">
            <div className="w-4/5 py-8 text-center px-4">
              <h2 className="text-3xl font-extrabold mb-8 text-slate-700 dark:text-white tracking-tight">Sign In</h2>
             <form
  onSubmit={handleSignin}
  autoComplete="off"
  className="space-y-4 text-left"
>
                <input
                  type="hidden"
                  name="shopcode"
                  value={defaultShopCode}
                />
                {/* Username */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    name="username"
                    autoComplete="off"
                    placeholder="USERNAME"
                    value={username}
                    inputMode="text"
                    onChange={(e) => { setUsername(e.target.value.toUpperCase()); setPassword(""); }}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-[#eef5f0] dark:bg-slate-800/50 pl-10 pr-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 transition-all uppercase"
                  />
                </div>
                {/* Password */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    name="password"
                    placeholder="PASSWORD"
                    autoComplete="new-password"
                    value={password}
                    inputMode="text"
                    
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full lowercase-field rounded-lg border border-slate-200 dark:border-slate-700 bg-[#eef5f0] dark:bg-slate-800/50 pl-10 pr-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 transition-all"
                    required
                  />
                </div>
                {/* Buttons */}
                <div className="flex justify-center gap-4 mt-6 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold uppercase tracking-widest rounded-full px-8 py-3 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 min-w-[110px] text-sm"
                  >SIGN IN
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold uppercase tracking-widest rounded-full px-8 py-3 shadow-md hover:shadow-lg transition-all active:scale-95 min-w-[110px] text-sm"
                  >
                    CLOSE
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="form-container about-container flex justify-center items-center">
            <div className="w-4/5 text-center">
              <h2 className="text-3xl font-extrabold mb-4 text-slate-800 dark:text-white tracking-tight">About Us</h2>
              <h3 className="text-lg font-bold text-sky-600 dark:text-sky-400 mb-3">
                Blogtec Software LLP
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                62/3708, Iyyattil Ln, Kochi, Kerala, India. <br />
                <span className="inline-block mt-2 font-medium">Contact: +91 9995120097</span> <br />
                blogtecsoftware@gmail.com <br />
                <a
                  href="https://www.blogtec.co.in"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold transition-colors decoration-2 hover:underline underline-offset-4"
                >
                  www.blogtec.co.in
                </a>
              </p>
              <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">
                  {companyName ? `${companyName} • ` : ""}App Version {APP_VERSION}
                </span>
              </div>
            </div>
          </div>

          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h2 className="text-4xl font-extrabold mb-3 tracking-tight text-white drop-shadow-md">AURIX</h2>
                <p className="mb-8 text-sm font-medium text-sky-100">Start Journey With Us</p>
                <button
                  className="border-2 border-white/80 bg-white/10 backdrop-blur-sm px-8 py-2.5 rounded-xl hover:bg-white hover:text-sky-700 dark:hover:bg-white dark:hover:text-sky-700 transition-all font-bold tracking-wider text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-white"
                  onClick={() => setIsRightPanelActive(false)}
                >
                  SIGN IN
                </button>
              </div>

              <div className="overlay-panel overlay-right">
                <h2 className="text-4xl font-extrabold mb-3 tracking-tight text-white drop-shadow-md">Welcome</h2>
                <p className="mb-8 text-sm font-medium text-sky-100 leading-relaxed max-w-xs">
                  Keep connected with us.<br />Login with your user info.
                </p>
                <button
                  className="border-2 border-white/80 bg-white/10 backdrop-blur-sm px-8 py-2.5 rounded-xl hover:bg-white hover:text-sky-700 dark:hover:bg-white dark:hover:text-sky-700 transition-all font-bold tracking-wider text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-white"
                  onClick={() => setIsRightPanelActive(true)}
                >
                  ABOUT US
                </button>
              </div>
            </div>
          </div>
        </div>

        <MessagePopup
          open={!!popupMessage}
          message={popupMessage}
          onClose={() => setPopupMessage("")}
        />


      </div>
    </>
  );
};

export default SigninPage;
