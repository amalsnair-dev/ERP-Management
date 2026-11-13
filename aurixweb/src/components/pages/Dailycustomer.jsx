import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  existsByUsername,
  getShopCodes,
  getDefaultShopCode,
  getCrmPhoneno,
} from "../../services/ShopAPI";
import DailyCustomerAPI from "../../services/DailyCustomerApi";
import MessagePopup from "../common/MessagePopup";
import { handleShopSwitch } from "../../utils/shopSwitch";
import { getCurrentShopCode, getCountryCode, getPhoneMaxLength, getPhoneMinLength, getPhoneFixedLength } from "../../utils/session";
import ModulePageLayout from "../layout/ModulePageLayout";
import { Printer, Calendar, Edit3, Trash2, X, FileText, Download, Search, History, Ban } from "lucide-react";
import { useLookup, lookupConfigs } from "../common/LookupContext";

const normalizePhoneDigits = (value) => String(value || "").replace(/\D/g, "");

const isValidCountryPhone = (value) => {
  const digits = normalizePhoneDigits(value);
  const minLen = parseInt(getPhoneMinLength(), 10);
  const maxLen = parseInt(getPhoneMaxLength(), 10);
  const fixedLen = getPhoneFixedLength() === "true";

  if (fixedLen) {
    return digits.length === maxLen;
  } else {
    return digits.length >= minLen && digits.length <= maxLen;
  }
};

const VisitHistoryPopup = ({ name, visits, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 dark:bg-slate-800 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl max-w-lg w-full border-t-4 border-sky-500">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xl font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <History className="w-5 h-5 text-sky-500" /> Visit History for {name}
          </h4>
          <button
            onClick={onClose}
            className="btn-secondary text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 text-2xl p-1 rounded-full hover:bg-slate-100 transition"
          >

            &times;
          </button>
        </div>

        <div className="overflow-y-auto max-h-80 border border-slate-200 dark:border-slate-700/60 rounded-lg shadow-inner">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="modern-table-header sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit, index) => (
                <tr
                  key={index}
                  className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/60 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition"
                >
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                    {visit.date}
                  </td>
                  <td className="px-4 py-2">{visit.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          This customer has {visits.length} previous visit
          {visits.length !== 1 ? "s" : ""} recorded.
        </p>
      </div>
    </div>
  );
};

// Delete Confirmation Pop-up Component (omitted for brevity)
const DeleteConfirmationPopup = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 dark:bg-slate-800 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center border-t-4 border-red-500">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-red-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856a2 2 0 001.789-2.89l-6.927-11.72a2 2 0 00-3.578 0L3.102 18.11A2 2 0 004.894 21z"
            />
          </svg>
        </div>
        <h4 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
          Are you sure?
        </h4>
        <p className="text-slate-600 dark:text-slate-300 mb-6">This action cannot be undone.</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="btn-secondary rounded-full text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 transition shadow-md flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger rounded-full dark:bg-rose-500 dark:hover:bg-rose-600 shadow-md transition hover:shadow-lg flex-1"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Salesman Table Pop-up Component (omitted for brevity)
const SalesmanTablePopup = ({ salesmen, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 dark:bg-slate-800 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl max-w-sm w-full border-t-4 border-sky-500">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200">Select Salesman</h4>
          <button
            onClick={onClose}
            className="btn-secondary text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 text-2xl p-1 rounded-full hover:bg-slate-100 transition"
          >
            &times;
          </button>
        </div>
        <div className="overflow-y-auto max-h-80 border border-slate-200 dark:border-slate-700/60 rounded-lg">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="modern-table-header sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(salesmen).map(([code, name]) => (
                <tr
                  key={code}
                  className="hover:bg-sky-50 dark:hover:bg-sky-950/30 cursor-pointer transition border-b border-slate-200 dark:border-slate-700/60 last:border-b border-slate-200 dark:border-slate-700/60-0"
                  onClick={() => onSelect(code)}
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {code}
                  </td>
                  <td className="px-4 py-3">{name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// New pop-up for Modify/Delete actions (omitted for brevity)
const EntryActionsPopup = ({ onModify, onDelete, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 dark:bg-slate-800 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center border-t-4 border-slate-400 dark:border-slate-700/60">
        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Choose an action
        </h4>
        <div className="flex flex-col space-y-3">
          <button
            onClick={onModify}
            className="btn-primary rounded-full dark:bg-sky-500 dark:hover:bg-sky-600 shadow-md shadow-sky-500/20 transition w-full"
          >
            <Edit3 className="w-5 h-5" /> Modify
          </button>
          <button
            onClick={onDelete}
            className="btn-danger rounded-full dark:bg-rose-500 dark:hover:bg-rose-600 shadow-md transition w-full"
          >
            <Trash2 className="w-5 h-5" /> Delete
          </button>
          <button
            onClick={onClose}
            className="btn-secondary rounded-full text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 transition shadow-md w-full"
          >
            <Ban className="w-5 h-5" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for printing report functionality using frontend PDF generation
// Hook for printing report functionality using frontend PDF generation
const usePrintReport = (api, branch) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [filename, setFilename] = useState("report.pdf");

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handlePrintPDF = async (date) => {
    try {
      if (!api) throw new Error("API instance not provided");

      // Fetch the raw data instead of calling the slow PDF endpoint
      const response = await api.findByDate(date);
      const data = response?.data || [];

      if (!data || data.length === 0) {
        alert("No entries found for the selected date.");
        return;
      }

      // Initialize jsPDF in landscape (because we added more columns)
      const doc = new jsPDF('l', 'mm', 'a4');

      // Configure Header
      doc.setFontSize(10);
      doc.setTextColor(20);

      const headerText = `DAILY VISITING CUSTOMER REPORT - ${date} / ${branch || "UNKNOWN SHOP"}`;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.text(headerText, pageWidth / 2, 22, { align: 'center' });

      const columns = ["Slno", "SMCode", "Phone No", "Name", "Place", "Time", "Remarks"];
      const rows = [];

      data.forEach(item => {
        rows.push([
          item.entryno || "",
          item.smCode || "",
          item.phoneNo || "",
          item.name || "",
          item.place || "",
          item.time || "",
          item.remarks || ""
        ]);
      });

      // Generate Table
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 28,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8 },
        headStyles: { fillColor: [2, 132, 199], fontSize: 9 }, // Sky-600 color to match the UI scheme
      });

      // Output as Blob
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);

      setPdfUrl(url);
      setFilename(`DailyCustomerReport_${date}.pdf`);

    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF locally. Check console for details.");
    }
  };

  return { pdfUrl, filename, setPdfUrl, handlePrintPDF };
};



// PDF Viewer Component
const PdfViewer = ({ pdfUrl, filename, onClose }) => {
  const iframeRef = useRef(null);

  if (!pdfUrl) return null;

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 dark:bg-slate-800 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl max-w-4xl w-full h-5/6 flex flex-col border-t-4 border-sky-600">
        <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-700/60 pb-3">
          <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" /> PDF Viewer: {filename}
          </h4>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="btn-success rounded-md transition"
              title="Print PDF"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleDownload}
              className="btn-primary rounded-md transition"
              title="Download PDF"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={onClose}
              className="btn-secondary text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 text-2xl p-1 rounded-full hover:bg-slate-100 transition ml-2"
              title="Close Viewer"
            >
              &times;
            </button>
          </div>
        </div>
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          title={filename}
          className="flex-grow border-0 rounded-lg bg-slate-100 dark:bg-slate-800"
        ></iframe>
      </div>
    </div>
  );
};

const inputClass = "premium-input";





// Main component
export default function DailyCustomer() {
  const navigate = useNavigate();
  const { showLookup } = useLookup();
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
  const username = currentUser.username || "";
  const password = currentUser.password || "";
  let roles = [];

  if (Array.isArray(currentUser.roles)) {
    roles = currentUser.roles.map((r) => (typeof r === "object" ? r.role : r));
  } else if (typeof currentUser.roles === "string") {
    roles = [currentUser.roles];
  }
  const userRole = roles[0] || "";

  // -------- State ----------
  const [branch, setBranch] = useState("");
  const [branchs, setBranchs] = useState([]);
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    phoneNo: "",
    name: "",
    place: "",
    smCode: "",
    remarks: "",
    entryno: null, // NEW: entry number for display in form
  });

  const [editingEntryNo, setEditingEntryNo] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [showActionsPopup, setShowActionsPopup] = useState(false);
  const [customerToActOn, setCustomerToActOn] = useState(null);
  const [, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("Daily Customer");
  const [popupType, setPopupType] = useState("info");
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [historyData, _setHistoryData] = useState({ name: "", visits: [] });
  const [salesmen, setSalesmen] = useState({});
  const [, _setPhoneNo] = useState("");

  const phoneRef = useRef();
  const nameRef = useRef();
  const placeRef = useRef();
  const smCodeRef = useRef();
  const tableRef = useRef();
  const remarks = useRef();

  const isToday = date === new Date().toISOString().split("T")[0];
  // const { pdfUrl, filename, setPdfUrl, handlePrintPDF } = usePrintReport();

  const api = React.useMemo(
    () => DailyCustomerAPI(branch, username, password),
    [branch, username, password]
  );

  const isFetchingRef = useRef(false);
  const { pdfUrl, filename, setPdfUrl, handlePrintPDF } = usePrintReport(api, branch);

  /////////////////////////salesman

  useEffect(() => {
    const loadSalesmen = async () => {
      try {
        const response = await api.salesman.findAll(branch); // fetch all salesmen for branch
        if (Array.isArray(response.data)) {
          const salesObj = {};
          response.data.forEach((s) => {
            // Use the correct API field names
            salesObj[s.salesman_code] = s.salesman_name;
          });
          setSalesmen(salesObj);
        }
      } catch (err) {
        console.error("Failed to load salesmen:", err);
      }
    };

    if (branch) loadSalesmen();
  }, [branch, api]);

  const _handleSalesmanCodeChange = async (code) => {
    const upperCode = code.toUpperCase();
    setForm((prev) => ({ ...prev, smCode: upperCode }));

    if (!upperCode) return;

    try {
      const res = await api.salesman.existsBySmCode(upperCode);
      if (res.data && res.data.salesmanName) {
        // Optionally show the name somewhere in the form
      }
    } catch (err) {
      console.error("Salesman code lookup failed:", err);
    }
  };

  // -------- Helper Functions --------
  const handleMessage = (text, type = "info") => {
    setPopupMessage(text);
    setPopupType(type);
    setPopupTitle(type === "success" ? "Success" : type === "error" ? "Error" : "Info");
  };

  const handleCloseHistoryPopup = () => {
    setShowHistoryPopup(false);
    setTimeout(() => smCodeRef.current?.focus(), 0);
  };

  // Focus the first row in the customer table, if present
  const focusFirstRow = () => {
    const tableEl = tableRef.current;
    if (!tableEl) return;
    const firstRow = tableEl.querySelector("tbody tr");
    if (firstRow && typeof firstRow.focus === "function") {
      firstRow.focus();
    }
  };

  // -------- Load Customers --------
  const loadCustomers = useCallback(async () => {
    if (!branch) {
      handleMessage("Select a branch first!", "error");
      setCustomers([]); // ensure empty if no branch
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      // If your DailyCustomerAPI uses axios, consider passing a cancel token here.
      const response = await api.findByDate(date);
      const customerArray = Array.isArray(response?.data) ? response.data : [];
      setCustomers(customerArray);
    } catch (error) {
      console.error("loadCustomers error:", error);
      // If network error like ERR_INSUFFICIENT_RESOURCES shows up frequently,
      // consider adding retry/backoff or checking server availability.
      setCustomers([]);
      handleMessage("Failed to load customer data.", "error");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [branch, date, api]); // api is memoized so won't change unless branch/credentials change

  useEffect(() => {
    // do not call until branch is set
    if (!branch) return;

    // small debounce to avoid double-triggering rapidly (e.g., if multiple state updates fire)
    const t = setTimeout(() => {
      loadCustomers();
    }, 120); // 120ms debounce; adjust if needed

    return () => clearTimeout(t);
  }, [branch, date, loadCustomers]);

  // -------- Initialize Branches --------
  useEffect(() => {
    const initBranches = async () => {
      try {
        const codes = await getShopCodes();
        if (Array.isArray(codes)) setBranchs(codes);

        const defaultCode = getCurrentShopCode() || await getDefaultShopCode();
        if (defaultCode) setBranch(defaultCode);
      } catch (error) {
        console.error("Failed to fetch branch codes:", error);
        handleMessage(error.message || "Failed to fetch branch codes.", "error");
      }
    };
    initBranches();
  }, []);

  // -------- Verify User --------
  useEffect(() => {
    if (!username) return;
    const verifyUser = async () => {
      try {
        const activeShopCode = branch || getCurrentShopCode();
        const exists = await existsByUsername(username, activeShopCode || undefined);
        if (!exists) navigate("/signin");
      } catch (error) {
        console.error("User verification error:", error);
        handleMessage("Failed to verify user.", "error");
      }
    };
    verifyUser();
  }, [username, branch, navigate]);
  const handleBranchChange = async (event) => {
    const nextShopCode = event.target.value;
    const result = await handleShopSwitch({
      nextShopCode,
      username,
      currentModule: "/dailycustomer",
      navigate,
      onSuccess: (shopCode) => setBranch(shopCode),
    });

    if (!result.requiresSignin && !result.ok) {
      handleMessage(result.message || "Unable to switch branch.", "error");
    }
  };

  // (Removed redundant reload effect; debounced effect above already handles reloads)

  // -------- Handle Phone Input --------
  // Utility to format date
  const formatDate = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  };

  // Helper to calculate next entry number for today
  const getNextEntryNo = (tableData) => {
    const today = formatDate(new Date());
    const todayEntries = tableData.filter((item) => item.date === today);
    if (todayEntries.length === 0) return 1;
    const maxEntry = Math.max(...todayEntries.map((e) => e.entryno || 0));
    return maxEntry + 1;
  };

  // handlePhoneNoChange
  const handlePhoneNoChange = async (e) => {
    // Only allow digits — strip any non-integer characters
    const phone = (e?.target?.value || "").replace(/\D/g, "");
    setForm((prev) => ({ ...prev, phoneNo: phone }));

    // ✅ Only trigger logic when phone length is valid for the selected country & not editing
    if (isValidCountryPhone(phone) && !editingEntryNo) {
      const today = formatDate(new Date());
      const existingEntry = customers.find(
        (item) => item.phoneNo === phone && item.date === today
      );

      try {
        // 🔍 Try fetching data from CRM
        const crmData = await getCrmPhoneno(phone);
        const hasCrmMatch =
          !!crmData &&
          !!(
            crmData.name ||
            crmData.place ||
            crmData.code ||
            crmData.custid ||
            crmData.custId ||
            crmData.mob
          );

        if (hasCrmMatch) {
          // ✅ Found in CRM
          setForm((prev) => ({
            ...prev,
            name: crmData.name?.toUpperCase() || "",
            place: crmData.place?.toUpperCase() || "",
            entryno: getNextEntryNo(customers),
          }));

          // Move focus to salesman code input
          smCodeRef.current?.focus();
        } else if (existingEntry) {
          // ✅ Found in today’s entries
          setForm((prev) => ({
            ...prev,
            name: existingEntry.name || "",
            place: existingEntry.place || "",
            entryno: getNextEntryNo(customers),
          }));

          // Move focus to salesman code input
          smCodeRef.current?.focus();
        } else {
          // ❌ Not found in CRM or today's entries
          setForm((prev) => ({
            ...prev,
            name: "",
            place: "",
            entryno: getNextEntryNo(customers),
          }));

          // Move focus to name input
          nameRef.current?.focus();
        }
      } catch (err) {
        console.error("CRM lookup failed:", err);
        handleMessage("CRM lookup failed!", "error");
        nameRef.current?.focus(); // fallback focus in case of error
      }
    }
  };
  // -------- Finalize Entry (Create/Update) --------
  const handleFinalizeEntry = async () => {
    try {
      if (!branch) return handleMessage("Select a branch first!", "error");
      if (!form.phoneNo?.trim() || !form.name?.trim())
        return handleMessage("Enter phone number and name!", "error");
      if (!isValidCountryPhone(form.phoneNo)) {
        const minLen = parseInt(getPhoneMinLength(), 10);
        const maxLen = parseInt(getPhoneMaxLength(), 10);
        const fixedLen = getPhoneFixedLength() === "true";
        if (fixedLen) {
          return handleMessage(`Invalid phone number! Must be exactly ${maxLen} digits.`, "error");
        } else {
          return handleMessage(`Invalid phone number! Must be between ${minLen} and ${maxLen} digits.`, "error");
        }
      }

      const today = formatDate(new Date());
      let entryNoToUse = editingEntryNo || form.entryno; // editing or new entry

      const entryData = {
        entryno: entryNoToUse,
        date: today,
        phoneNo: form.phoneNo,
        name: form.name,
        place: form.place,
        smCode: form.smCode,
        shopcode: branch,
        remarks: form.remarks || "",
      };

      if (editingEntryNo) {
        // Modification: update only selected entry
        await api.updateByDateEntry(editingEntryNo, today, entryData);
      } else {
        // New entry: always create
        await api.create(entryData);
      }

      await loadCustomers();

      // Reset form
      setForm({ phoneNo: "", name: "", place: "", smCode: "", remarks: "", entryno: null });
      setEditingEntryNo(null);
      phoneRef.current?.focus();
    } catch (err) {
      console.error("Save error:", err);
      handleMessage("Error saving entry!", "error");
    }
  };

  // -------- Delete Handlers --------
  const handleDelete = (entryno) => {
    setEntryToDelete(entryno);
    setShowDeleteConfirm(true);
    setShowActionsPopup(false);
  };
  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      await api.deleteByDateAndEntryNo(entryToDelete, date); // delete from DB
      // remove from local state
      setCustomers(customers.filter((c) => c.entryno !== entryToDelete));
    } catch (err) {
      console.error("Delete Error:", err);
      handleMessage("Failed to delete entry", "error");
    } finally {
      setEntryToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setEntryToDelete(null);
    setShowDeleteConfirm(false);
  };

  // -------- Edit / Clear --------
  const handleEdit = (customer) => {
    setForm({
      phoneNo: customer.phoneNo,
      name: customer.name,
      place: customer.place,
      smCode: customer.smCode,
      entryno: customer.entryno, // show the existing entry number
    });

    setEditingEntryNo(customer.entryno); // mark as editing
    phoneRef.current?.focus();
    setShowActionsPopup(false);
  };

  // -------- Salesman Selection --------
  const handleSelectSalesman = (code) => {
    // Update form with selected salesman code
    setForm((prev) => ({ ...prev, smCode: code }));

    // Focus the Salesman Code input for convenience
    smCodeRef.current?.focus();
  };

  // -------- Actions Popup --------
  const handleRowDoubleClick = (customer) => {
    if (isToday) {
      setCustomerToActOn(customer);
      setShowActionsPopup(true);
    }
  };
  const handleRowTap = (customer) => {
    if (isToday) {
      setCustomerToActOn(customer);
      setShowActionsPopup(true);
    }
  };
  const handleActionModify = () => {
    handleEdit(customerToActOn);
  };
  const handleActionDelete = () => {
    handleDelete(customerToActOn.entryno);
  };

  return (
    // Outer container for page background
    <ModulePageLayout title="Daily Customer Entry" navigate={navigate}>
      {/* Main centered content container */}
      <div className="w-full mx-auto bg-white dark:bg-slate-900 shadow-2xl rounded-xl">
        {/* Main Content Area */}
        <div className="p-6">
          {/* Branch & Date Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 flex-1">
              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Branch
                </label>

                <select
                  value={branch}
                  onChange={handleBranchChange}
                  disabled={
                    !(
                      userRole.includes("ROLE_SUPERUSER") ||
                      userRole.includes("ROLE_SUPERADMIN")
                    )
                  }
                  className="w-full sm:w-24 h-11 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:ring-2 focus:ring-sky-500/30 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-500 dark:text-slate-400"
                >
                  {branchs.map((item) => (
                    <option key={item.Shopcode} value={item.Shopcode}>
                      {item.Shopcode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 h-11 w-full sm:w-40 md:w-48 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-colors text-sm"
                />
              </div>
            </div>
            {/* Print Report Button */}
            <button
              onClick={() => handlePrintPDF(date)}
              className="flex flex-row md:flex-col items-center justify-center gap-2 md:gap-1 bg-sky-600 text-white rounded-2xl font-bold shadow-lg shadow-sky-200 dark:shadow-sky-900/20 hover:bg-sky-700 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 w-full md:w-auto min-w-[80px] h-12 md:h-[72px] px-6 md:px-4"
            >
              <Printer className="w-5 h-5 text-sky-50" />
              <span className="text-xs uppercase tracking-wide">Report</span>
            </button>
          </div>
          {/* Entry Form */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 border-slate-100 dark:border-slate-700/60 shadow-md mb-6">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
              {editingEntryNo
                ? `Editing Entry No: ${editingEntryNo}`
                : "New Customer Entry"}
              {!isToday && (
                <span className="text-sm font-normal text-red-500 ml-2">
                  (Read-Only: Not Today's Date)
                </span>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-4 items-center">
              {/* Phone No Input - Auto-fill, History trigger, and Focus jump here */}
              <div className="sm:col-span-1 md:col-span-1 lg:col-span-2 min-w-0">
                <input
                  ref={phoneRef}
                  placeholder="Phone No"
                  value={form.phoneNo}
                  onChange={(e) => {
                    // Strip all non-digit characters — integers only
                    const maxLen = parseInt(getPhoneMaxLength(), 10) || 10;
                    const digits = e.target.value.replace(/\D/g, "").slice(0, maxLen);
                    handlePhoneNoChange({ target: { value: digits } });
                  }}
                  type="tel"
                  maxLength={parseInt(getPhoneMaxLength(), 10) || 10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={!isToday}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const phone = form.phoneNo;
                      if (!phone) return;
                      if (!isValidCountryPhone(phone)) {
                        const minLen = parseInt(getPhoneMinLength(), 10);
                        const maxLen = parseInt(getPhoneMaxLength(), 10);
                        const fixedLen = getPhoneFixedLength() === "true";
                        if (fixedLen) {
                          handleMessage(`Phone number must be exactly ${maxLen} digits!`, "error");
                        } else {
                          handleMessage(`Phone number must be between ${minLen} and ${maxLen} digits!`, "error");
                        }
                        phoneRef.current?.focus();
                        return;
                      }
                      // Valid phone — trigger the same lookup as onChange
                      await handlePhoneNoChange({ target: { value: phone } });
                    } else if (e.key === "Escape") focusFirstRow();
                  }}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-1 md:col-span-1 lg:col-span-3 min-w-0">
                <input
                  ref={nameRef}
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value
                        .replace(/[^a-zA-Z\s]/g, "")
                        .toUpperCase(),
                    })
                  }
                  disabled={!isToday}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && form.name.trim() !== "")
                      placeRef.current.focus();
                    else if (e.key === "Escape") phoneRef.current.focus();
                  }}
                  className={inputClass}
                /></div>

              <div className="sm:col-span-1 md:col-span-1 lg:col-span-2 min-w-0">
                <input
                  ref={placeRef}
                  placeholder="Place"
                  value={form.place}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      place: e.target.value
                        .replace(/[^a-zA-Z\s]/g, "")
                        .toUpperCase(),
                    })
                  }
                  disabled={!isToday}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && form.place.trim() !== "")
                      smCodeRef.current.focus();
                    else if (e.key === "Escape") nameRef.current.focus();
                  }}
                  className={inputClass} /></div>
              <div className="relative flex min-w-0 overflow-hidden sm:col-span-1 md:col-span-1 lg:col-span-2">

                <input
                  ref={smCodeRef}
                  placeholder="Salesman Code"
                  value={form.smCode}
                  onChange={(e) =>
                    setForm({ ...form, smCode: e.target.value.toUpperCase() })
                  }
                  disabled={!isToday}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && isToday) {
                      const smCode = form.smCode?.trim().toUpperCase();
                      if (smCode) {
                        try {
                          const res = await api.salesman.existsBySmCode(smCode);
                          if (res.data) {

                            remarks.current?.focus();
                          } else {
                            handleMessage("Invalid Salesman Code!", "error");
                            smCodeRef.current?.focus();
                            smCodeRef.current?.select?.();
                          }
                        } catch (error) {
                          console.error("Error checking salesman code:", error);
                          handleMessage(
                            "Error validating Salesman Code!",
                            "error"
                          );
                        }
                      }
                    } else if (e.key === "Escape") {
                      phoneRef.current?.focus(); // Optional navigation
                    }
                  }}
                  onBlur={async (e) => {
                    // Skip re-validation if a popup message is already showing
                    if (popupMessage) return;
                    const smCode = form.smCode?.trim().toUpperCase();
                    if (!smCode || !isToday) return;
                    try {
                      const res = await api.salesman.existsBySmCode(smCode);
                      if (res.data) {
                        // Valid salesman code - do not force focus
                      } else {
                        handleMessage("Invalid Salesman Code!", "error");
                        smCodeRef.current?.select?.();
                      }
                    } catch (error) {
                      console.error("Error checking salesman code on blur:", error);
                    }
                  }}
                  className={`${inputClass} rounded-r-none min-w-0 flex-1`}
                />

                <button
                  onClick={() => {
                    showLookup(
                      lookupConfigs.salesman((selected) => {
                        handleSelectSalesman(selected.salesman_code);
                      }, branch)
                    );
                  }}
                  disabled={!isToday}
                  className="h-11 px-3 border border-slate-200 dark:border-slate-700/60 border-l-0 rounded-r-lg bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Remarks Input */}
              <div className="sm:col-span-1 md:col-span-1 lg:col-span-3 min-w-0">
                <input
                  ref={remarks}
                  placeholder="Remarks"
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value.toUpperCase() })
                  }
                  disabled={!isToday}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFinalizeEntry();
                    else if (e.key === "Escape") smCodeRef.current.focus();
                  }}
                  className={inputClass}
                />
              </div>

            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm overflow-x-auto">
            <table ref={tableRef} className="w-full text-left text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
              <thead className="modern-table-header sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Entry No</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Place</th>
                  <th className="px-4 py-3">SM Code</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.entryno}
                    tabIndex={0}
                    className="modern-table-row bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/60 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition cursor-pointer"
                    onClick={() => handleRowTap(c)}
                    onDoubleClick={() => handleRowDoubleClick(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowDoubleClick(c);
                      }
                    }}
                  >
                    <td className="px-4 py-2.5">{c.entryno}</td>
                    <td className="px-4 py-2.5">{c.phoneNo}</td>
                    <td className="px-4 py-2.5">{c.name}</td>
                    <td className="px-4 py-2.5">{c.place}</td>
                    <td className="px-4 py-2.5">{c.smCode}</td>
                    <td className="px-4 py-2.5">{c.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
            Tap or double-click a row to modify or delete (only on today's date).
          </p>
        </div>

        {/* Modals and Popups */}
        {pdfUrl && (
          <PdfViewer
            pdfUrl={pdfUrl}
            filename={filename}
            onClose={() => setPdfUrl(null)}
          />
        )}

        {showDeleteConfirm && (
          <DeleteConfirmationPopup
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        )}
        {showActionsPopup && customerToActOn && (
          <EntryActionsPopup
            onModify={handleActionModify}
            onDelete={handleActionDelete}
            onClose={() => setShowActionsPopup(false)}
          />
        )}
        {showHistoryPopup && (
          <VisitHistoryPopup
            name={historyData.name}
            visits={historyData.visits}
            onClose={handleCloseHistoryPopup}
          />
        )}
        <MessagePopup
          open={!!popupMessage}
          title={popupTitle}
          message={popupMessage}
          type={popupType}
          onClose={() => {
            setPopupMessage("");
            setTimeout(() => smCodeRef.current?.focus(), 100);
          }}
        />
      </div>
    </ModulePageLayout>
  );
}












