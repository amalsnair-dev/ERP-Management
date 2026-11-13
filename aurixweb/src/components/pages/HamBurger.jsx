import React, { useState, useEffect } from "react";
import {
    clearAuthSession,
    getCurrentUser,
    setCurrentModule,
    hasFrameAccess,
} from "../../utils/session";
import {
    X, Settings, ChevronDown, Key, Layout, UserPlus,
    UserMinus, Moon, Sun, LogOut, Users, Banknote,
    ClipboardList, PlusCircle, PieChart, ShoppingCart, Flame
} from "lucide-react";
import CurrencySelector from "../common/CurrencySelector";
import { APP_VERSION } from "../../config/version";
import companyApi from "../../services/CompanyAPI";
import { getCurrentShopCode } from "../../utils/session";

const HamburgerMenu = ({ isMenuOpen, setIsMenuOpen, navigate }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [companyName, setCompanyName] = useState("");

    const currentUser = getCurrentUser() || {};
    const shopcode = getCurrentShopCode();

    useEffect(() => {
        if (isMenuOpen && shopcode) {
            const fetchCompany = async () => {
                try {
                    const data = await companyApi().getCompanyDetails(shopcode);
                    if (Array.isArray(data)) {
                        const nameObj = data.find(item => item.key === "a");
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
    }, [isMenuOpen, shopcode]);


    const normalizedRoles = Array.isArray(currentUser.roles)
        ? currentUser.roles
            .map((r) => (typeof r === "string" ? r : r.role || ""))
            .map((r) => r.toUpperCase())
            .filter(Boolean)
        : typeof currentUser.roles === "string"
            ? [currentUser.roles.toUpperCase()]
            : [];

    const frames = currentUser.frames || [];

    const menuItems = [
        { label: "Daily Customer", path: "/dailycustomer", frame: "DAILY VISITING CUSTOMER", icon: Users },
        { label: "Cash Marking", path: "/cashmarking", frame: "CASH MARKING", icon: Banknote },
        { label: "Item Details", path: "/itemdetails", frame: "ITEM DETAILS", icon: ClipboardList },
        { label: "Item Details Entry", path: "/itemdetailsentry", frame: "ITEM DETAILS ENTRY", icon: PlusCircle },
        { label: "Easy Total", path: "/easytotal", frame: "EASY TOTAL", icon: PieChart },
        { label: "Sales Entry", path: "/salesentry", frame: "SALES ENTRY", icon: ShoppingCart },
        { label: "Gold Heating Details", path: "/goldheating", frame: "GOLD HEATING DETAILS", icon: Flame },
        { label: "Receipt Gold Heating", path: "/receiptgoldheating", frame: "RECEIPT GOLD HEATING DETAILS", icon: Flame },
    ];

    const allowedMenuItems = menuItems.filter(item => hasFrameAccess(item.frame, currentUser));
    const isSuperAdmin = normalizedRoles.includes("ROLE_SUPERADMIN");
    const canDeleteUser = normalizedRoles.some((role) => role && role !== "ROLE_USER");

    const handleNavigate = (path) => {
        setCurrentModule(path);
        navigate(path);
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        clearAuthSession();
        sessionStorage.clear();
        setIsMenuOpen(false);
        navigate("/signin", { replace: true });
        setTimeout(() => window.location.replace("/aurixapp/signin"), 100);
    };

    return (
        <div
            className={`fixed inset-0 z-50 transform ${isMenuOpen ? "translate-x-0 opacity-100 visible" : "-translate-x-full opacity-0 invisible pointer-events-none"
                } transition-all duration-300 ease-in-out`}
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/60 backdrop-blur-sm"
                onClick={() => setIsMenuOpen(false)}
            ></div>

            {/* Sidebar Menu - slides from LEFT */}
            <div className="absolute left-0 top-0 h-full w-[280px] sm:w-[320px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl p-6 sm:p-8 flex flex-col space-y-6 overflow-y-auto transition-all duration-300 border-r border-slate-200/60 dark:border-slate-800/60">
                {/* Close Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    >
                        <X className="h-8 w-8" />
                    </button>
                </div>

                {/* Menu Items */}
                <nav className="flex flex-col space-y-4">
                    {allowedMenuItems.length === 0 && (
                        <p className="text-slate-400 dark:text-slate-500 text-sm">No frames assigned</p>
                    )}

                    {allowedMenuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                            className="group flex items-center gap-3 py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-700 dark:hover:bg-slate-800 hover:text-white dark:hover:text-white rounded-xl transition-all duration-300 text-left"
                        >
                            <item.icon size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                            <span className="text-xs uppercase tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User Settings Collapsible Section */}
                <div className="flex flex-col pt-4 border-t border-slate-200 dark:border-slate-700">
                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`group flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all duration-300 ${isSettingsOpen
                            ? 'bg-slate-700 dark:bg-slate-800 text-white dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-700 dark:hover:bg-slate-800 hover:text-white dark:hover:text-white'
                            }`}
                    >
                        {/* Gear Icon */}
                        <Settings
                            size={20}
                            className={`transition-transform duration-500 ease-in-out ${isSettingsOpen ? 'rotate-[135deg] text-white' : 'group-hover:rotate-45 group-hover:text-white'}`}
                            strokeWidth={1.8}
                        />

                        <span className="text-xs font-bold uppercase tracking-widest flex-1 text-left">
                            User Settings
                        </span>

                        {/* Chevron Arrow */}
                        <ChevronDown
                            size={16}
                            className={`transition-all duration-300 ease-in-out ${isSettingsOpen ? 'rotate-180 text-white' : 'group-hover:text-white'}`}
                            strokeWidth={2.5}
                        />
                    </button>

                    {/* Animated Buttons Container */}
                    <div
                        className="overflow-hidden transition-all duration-500 ease-in-out"
                        style={{
                            maxHeight: isSettingsOpen ? '600px' : '0px',
                            opacity: isSettingsOpen ? 1 : 0,
                            transform: isSettingsOpen ? 'translateY(0)' : 'translateY(-8px)',
                            transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease, transform 0.35s ease'
                        }}
                    >
                        <div className="flex flex-col gap-2.5 pt-3 px-1">
                            {/* Change Password */}
                            <button
                                onClick={() => handleNavigate("/changepassword")}
                                style={{
                                    opacity: isSettingsOpen ? 1 : 0,
                                    transform: isSettingsOpen ? 'translateX(0)' : 'translateX(-16px)',
                                    transition: `opacity 0.3s ease ${isSettingsOpen ? '80ms' : '0ms'}, transform 0.3s ease ${isSettingsOpen ? '80ms' : '0ms'}, background-color 0.2s`
                                }}
                                className="w-full px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow hover:bg-emerald-700 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Key size={16} />
                                Change Password
                            </button>

                            {isSuperAdmin && (
                                <>
                                    {/* Update Frames */}
                                    <button
                                        onClick={() => handleNavigate("/updateframes")}
                                        style={{
                                            opacity: isSettingsOpen ? 1 : 0,
                                            transform: isSettingsOpen ? 'translateX(0)' : 'translateX(-16px)',
                                            transition: `opacity 0.3s ease ${isSettingsOpen ? '160ms' : '0ms'}, transform 0.3s ease ${isSettingsOpen ? '160ms' : '0ms'}, background-color 0.2s`
                                        }}
                                        className="w-full px-5 py-2 bg-slate-700 text-white text-sm font-semibold rounded-xl shadow hover:bg-slate-800 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <Layout size={16} />
                                        Update Frames
                                    </button>
                                    {/* User Register */}
                                    <button
                                        onClick={() => handleNavigate("/register")}
                                        style={{
                                            opacity: isSettingsOpen ? 1 : 0,
                                            transform: isSettingsOpen ? 'translateX(0)' : 'translateX(-16px)',
                                            transition: `opacity 0.3s ease ${isSettingsOpen ? '240ms' : '0ms'}, transform 0.3s ease ${isSettingsOpen ? '240ms' : '0ms'}, background-color 0.2s`
                                        }}
                                        className="w-full px-5 py-2 bg-slate-700 text-white text-sm font-semibold rounded-xl shadow hover:bg-slate-800 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <UserPlus size={16} />
                                        User Register
                                    </button>
                                </>
                            )}

                            {canDeleteUser && (
                                <button
                                    onClick={() => handleNavigate("/deleteuser")}
                                    style={{
                                        opacity: isSettingsOpen ? 1 : 0,
                                        transform: isSettingsOpen ? 'translateX(0)' : 'translateX(-16px)',
                                        transition: `opacity 0.3s ease ${isSettingsOpen ? '320ms' : '0ms'}, transform 0.3s ease ${isSettingsOpen ? '320ms' : '0ms'}, background-color 0.2s`
                                    }}
                                    className="w-full px-5 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl shadow hover:bg-rose-700 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <UserMinus size={16} />
                                    Delete User
                                </button>
                            )}

                            {/* Dark Mode Toggle inline within Settings */}
                            <button
                                onClick={() => {
                                    if (document.documentElement.classList.contains('dark')) {
                                        document.documentElement.classList.remove('dark');
                                        localStorage.setItem('theme', 'light');
                                    } else {
                                        document.documentElement.classList.add('dark');
                                        localStorage.setItem('theme', 'dark');
                                    }
                                }}
                                style={{
                                    opacity: isSettingsOpen ? 1 : 0,
                                    transform: isSettingsOpen ? 'translateX(0)' : 'translateX(-16px)',
                                    transition: `opacity 0.3s ease ${isSettingsOpen ? '360ms' : '0ms'}, transform 0.3s ease ${isSettingsOpen ? '360ms' : '0ms'}, background-color 0.2s`
                                }}
                                className="w-full px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl shadow hover:bg-slate-300 dark:hover:bg-slate-600 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Moon size={16} className="hidden dark:block text-slate-200" />
                                <Sun size={16} className="block dark:hidden text-amber-500" />
                                Toggle Theme
                            </button>

                            {/* Regional Settings Section */}
                            <div
                                className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"
                                style={{
                                    opacity: isSettingsOpen ? 1 : 0,
                                    transform: isSettingsOpen ? 'translateX(0)' : 'translateX(-16px)',
                                    transition: `opacity 0.3s ease ${isSettingsOpen ? '440ms' : '0ms'}, transform 0.3s ease ${isSettingsOpen ? '440ms' : '0ms'}`
                                }}
                            >
                                <CurrencySelector />
                            </div>
                        </div>
                    </div>

                    {/* Logout - always visible */}
                    <button
                        onClick={handleLogout}
                        className="w-full px-6 py-2.5 mt-5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>

                    {/* App Version Info */}
                    <div className="flex flex-col items-center pt-6 pb-2">
                        <div className="h-px w-12 bg-slate-200 dark:bg-slate-700 mb-4 opacity-50"></div>
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-600 tracking-[0.25em] uppercase text-center">
                            {companyName ? `${companyName} • ` : ""}v{APP_VERSION}
                        </span>
                        <span className="text-[8px] font-medium text-slate-400/60 dark:text-slate-600/60 mt-1 uppercase tracking-wider">
                            © 2025 Blogtec Software
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HamburgerMenu;

