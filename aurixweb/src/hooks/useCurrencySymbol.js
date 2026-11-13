import { useState, useEffect } from "react";
import { getCurrencySymbol } from "../utils/session";

/**
 * Returns the active currency symbol (e.g. '₹', '$', '€') from session storage.
 * Automatically re-renders any component using this hook whenever the user
 * changes the country/currency via CurrencySelector (listens to the
 * 'regionalSettingsChanged' window event).
 */
export const useCurrencySymbol = () => {
  const [symbol, setSymbol] = useState(() => getCurrencySymbol());

  useEffect(() => {
    const handler = () => setSymbol(getCurrencySymbol());
    window.addEventListener("regionalSettingsChanged", handler);
    return () => window.removeEventListener("regionalSettingsChanged", handler);
  }, []);

  return symbol;
};
