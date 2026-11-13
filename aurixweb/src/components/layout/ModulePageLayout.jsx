import React, { useState } from "react";
import MainPageFrame from "./MainPageFrame";
import HamburgerMenu from "../pages/HamBurger";
import { Menu, ArrowLeft } from "lucide-react";

/**
 * @param {Object} props
 * @param {string} [props.title]
 * @param {Function} [props.navigate]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.panelClassName]
 * @param {string} [props.contentClassName]
 * @param {boolean} [props.hideHeader]
 * @param {string|null} [props.backPath]
 * @param {React.ReactNode} [props.extraHeaderActions]
 */
const ModulePageLayout = ({
  title,
  navigate,
  children,
  panelClassName = "",
  contentClassName = "",
  hideHeader = false,
  backPath = null,
  extraHeaderActions = null,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <MainPageFrame panelClassName={panelClassName}>
      <div className="w-full min-w-0 flex flex-col min-h-full relative">
        {!hideHeader && (
          <div className="sticky top-0 z-40 glass-header rounded-2xl mb-3 flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-2 gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => backPath ? navigate(backPath) : setIsMenuOpen(true)}
                className="text-white bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/30 rounded-xl p-2.5 sm:p-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-90 flex-shrink-0"
                aria-label={backPath ? "Go back" : "Open menu"}
              >
                {backPath ? (
                  <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" strokeWidth={2.5} />
                ) : (
                  <Menu className="w-6 h-6 sm:w-5 sm:h-5" strokeWidth={2.5} />
                )}
              </button>

              <h2 className="text-lg sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 uppercase tracking-widest sm:tracking-[0.2em] truncate">
                {title}
              </h2>
            </div>

            {extraHeaderActions && (
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
                {extraHeaderActions}
              </div>
            )}
          </div>
        )}

        {/* Animation only on the main content, not the header or menu */}
        <div className={`flex-1 ${contentClassName} animate-fade-in-up`}>
          {children}
        </div>

        <HamburgerMenu
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          navigate={navigate}
        />
      </div>
    </MainPageFrame>
  );
};

export default ModulePageLayout;
