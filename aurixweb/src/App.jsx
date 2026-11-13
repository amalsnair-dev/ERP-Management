import React, { useEffect, useState, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

// ─── Eagerly loaded (always needed immediately) ───────────────────────────────
import SigninPage from "./components/pages/SigninPage";
import ProtectedRoute from "./components/pages/ProtectedRoute";
import MessagePopup from "./components/common/MessagePopup";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { LookupProvider } from "./components/common/LookupContext";
import UniversalLookupPopup from "./components/common/UniversalLookupPopup";
import PWAInstallPrompt from "./components/common/PWAInstallPrompt";
import CrashMonitoringService from "./services/CrashMonitoringService";
import { getIdleTimeoutMinutes } from "./services/DiscountDetailsAPI";
import {
  clearAuthSession,
  getPreferredModulePath,
  isAuthenticated,
} from "./utils/session";
import  Stone from "./components/pages/sales/Stone";

// ─── Lazily loaded (only downloaded when route is visited) ────────────────────
const DocumentationPage  = lazy(() => import("./components/pages/DocumentationPage"));
const RegisterPage       = lazy(() => import("./components/pages/RegisterPage"));
const UpdateUserPage     = lazy(() => import("./components/pages/UpdateUserPage"));
const UpdateUserFrames   = lazy(() => import("./components/pages/UpdateUserFrames"));
const ChangePassword     = lazy(() => import("./components/pages/ChangePassword"));
const DeleteUserPage     = lazy(() => import("./components/pages/DeleteUserPage"));
const ItemDetails        = lazy(() => import("./components/pages/ItemDetails"));
const ItemDetailsEntry   = lazy(() => import("./components/pages/ItemDetailsEntry"));
const EasyTotal          = lazy(() => import("./components/pages/EasyTotal"));
const Dailycustomer      = lazy(() => import("./components/pages/Dailycustomer"));
const CashMarking        = lazy(() => import("./components/pages/sales/CashMarking"));
const SalesEntry         = lazy(() => import("./components/pages/sales/SalesEntry"));
const Advance            = lazy(() => import("./components/pages/sales/Advance"));
const CreditSales        = lazy(() => import("./components/pages/sales/CreditSales"));
const Purchase           = lazy(() => import("./components/pages/sales/Purchase"));
const GoldHeating        = lazy(() => import("./components/pages/GoldHeating"));
const ReceiptGoldHeating = lazy(() => import("./components/pages/ReceiptGoldHeating"));

// ─── Loading fallback shown while a lazy chunk is downloading ─────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">
        Loading...
      </span>
    </div>
  </div>
);

const ENV_IDLE_TIMEOUT_MINUTES = Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES);
const FALLBACK_IDLE_TIMEOUT_MINUTES =
  Number.isFinite(ENV_IDLE_TIMEOUT_MINUTES) ? ENV_IDLE_TIMEOUT_MINUTES : null;
const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
  "touchmove",
  "pointerdown",
  "pointermove",
];

const FOCUS_SCROLL_SELECTOR =
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select, [contenteditable="true"]';

const AuthEntry = ({ setIsLoggedIn }) => {
  const preferredPath = getPreferredModulePath();

  if (isAuthenticated() && preferredPath) {
    return <Navigate to={preferredPath} replace />;
  }

  return <SigninPage setIsLoggedIn={setIsLoggedIn} />;
};

const AppContent = ({ isLoggedIn, setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [autoLogoutTime, setAutoLogoutTime] = useState(null);
  const [timeoutPopupMessage, setTimeoutPopupMessage] = useState("");

  useEffect(() => {
    CrashMonitoringService.init();
    let isMounted = true;

    const loadIdleTimeout = async () => {
      if (!isLoggedIn) {
        setAutoLogoutTime(null);
        setTimeoutPopupMessage("");
        return;
      }

      // getIdleTimeoutMinutes now returns a number (minutes) or null
      const timeoutMinutes = await getIdleTimeoutMinutes();
      const resolvedMinutes =
        Number.isFinite(timeoutMinutes) && timeoutMinutes !== null
          ? timeoutMinutes
          : FALLBACK_IDLE_TIMEOUT_MINUTES;
      const nextAutoLogoutTime =
        typeof resolvedMinutes === "number" && resolvedMinutes > 0
          ? resolvedMinutes * 60 * 1000
          : null;

      if (isMounted) {
        setAutoLogoutTime(nextAutoLogoutTime);
        // Show a warning if the API did not provide a value
        setTimeoutPopupMessage(
          timeoutMinutes === null
            ? `Timeout value not received from server. Using ${resolvedMinutes ?? 0} minutes.`
            : ""
        );
      }
    };

    loadIdleTimeout();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const scrollFocusedFieldIntoView = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches(FOCUS_SCROLL_SELECTOR)) return;
      if (target.dataset.noAutoScroll === "true") return;

      const scrollToTarget = () => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      };

      requestAnimationFrame(scrollToTarget);
      window.setTimeout(scrollToTarget, 120);
    };

    document.addEventListener("focusin", scrollFocusedFieldIntoView);
    return () => {
      document.removeEventListener("focusin", scrollFocusedFieldIntoView);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn || autoLogoutTime === null) return;

    let logoutTimer;

    const resetTimer = () => {
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        clearAuthSession();
        sessionStorage.clear();
        setIsLoggedIn(false);
        navigate("/", { replace: true });
      }, autoLogoutTime);
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      clearTimeout(logoutTimer);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [autoLogoutTime, isLoggedIn, navigate, setIsLoggedIn]);

  return (
    <div className="font-sans antialiased text-slate-800 dark:text-slate-200">
      <div>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
          <Route
            path="/"
            element={<AuthEntry setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route
            path="/signin"
            element={<AuthEntry setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/.docs" element={<DocumentationPage />} />
          <Route path="/stone" elemet={<Stone/>}/>
          <Route
            path="/updateuser"
            element={
              <ProtectedRoute routePath="/updateuser">
                <UpdateUserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/updateframes"
            element={
              <ProtectedRoute routePath="/updateframes">
                <UpdateUserFrames />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deleteuser"
            element={
              <ProtectedRoute routePath="/deleteuser">
                <DeleteUserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/changepassword"
            element={
              <ProtectedRoute routePath="/changepassword">
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashmarking"
            element={
              <ProtectedRoute
                routePath="/cashmarking"
                requiredFrame="CASH MARKING"
              >
                <CashMarking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itemdetails"
            element={
              <ProtectedRoute
                routePath="/itemdetails"
                requiredFrame="ITEM DETAILS"
              >
                <ItemDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itemdetailsentry"
            element={
              <ProtectedRoute
                routePath="/itemdetailsentry"
                requiredFrame="ITEM DETAILS ENTRY"
              >
                <ItemDetailsEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/easytotal"
            element={
              <ProtectedRoute
                routePath="/easytotal"
                requiredFrame="EASY TOTAL"
              >
                <EasyTotal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dailycustomer"
            element={
              <ProtectedRoute
                routePath="/dailycustomer"
                requiredFrame="DAILY VISITING CUSTOMER"
              >
                <Dailycustomer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salesentry"
            element={
              <ProtectedRoute
                routePath="/salesentry"
                requiredFrame="SALES ENTRY"
              >
                <SalesEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/advance"
            element={
              <ProtectedRoute
                routePath="/advance"
              >
                <Advance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/creditsales"
            element={
              <ProtectedRoute
                routePath="/creditsales"
              >
                <CreditSales />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase"
            element={
              <ProtectedRoute
                routePath="/purchase"
              >
                <Purchase />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goldheating"
            element={
              <ProtectedRoute
                routePath="/goldheating"
                requiredFrame="GOLD HEATING DETAILS"
              >
                <GoldHeating />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receiptgoldheating"
            element={
              <ProtectedRoute
                routePath="/receiptgoldheating"
                requiredFrame="RECEIPT GOLD HEATING DETAILS"
              >
                <ReceiptGoldHeating />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </div>
      <MessagePopup
        open={!!timeoutPopupMessage}
        title="Timeout Setting"
        message={timeoutPopupMessage}
        onClose={() => setTimeoutPopupMessage("")}
      />
    </div>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("isLoggedIn") === "true";
  });

  useEffect(() => {
    sessionStorage.setItem("isLoggedIn", isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark' || (!storedTheme && mediaQuery.matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const handleChange = () => {
      if (!localStorage.getItem('theme')) {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  // Force Fullscreen on user interaction ONLY if running as an installed PWA
  useEffect(() => {
    const isPwa =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      window.navigator.standalone === true ||
      String(window.document.referrer || "").startsWith("android-app://");

    if (!isPwa) return;

    const enableFullscreen = () => {
      if (!document.fullscreenElement) {
        const docElm = document.documentElement;
        if (docElm.requestFullscreen) {
          docElm.requestFullscreen().catch(() => {});
        } else if (docElm.webkitRequestFullscreen) {
          docElm.webkitRequestFullscreen().catch(() => {});
        } else if (docElm.msRequestFullscreen) {
          docElm.msRequestFullscreen().catch(() => {});
        }
      }
    };

    const events = ['click', 'touchstart'];
    events.forEach(event => document.addEventListener(event, enableFullscreen));

    return () => {
      events.forEach(event => document.removeEventListener(event, enableFullscreen));
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router basename="/aurixapp/">
        <LookupProvider>
          <AppContent isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
          <UniversalLookupPopup />
          <PWAInstallPrompt />
        </LookupProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
