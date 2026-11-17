import React, { useState, useEffect } from "react";
import { Image, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBarcodeDetails, getImageByBarcode } from "../../services/BarcodeAPI";
import ModulePageLayout from "../layout/ModulePageLayout";
import {
  existsByUsername,
  getShopCodes,
  getDefaultShopCode,
} from "../../services/ShopAPI";
import { handleShopSwitch } from "../../utils/shopSwitch";
import { getCurrentShopCode } from "../../utils/session";
import DynamicQueryService from "../../services/DynamicQueryApi";
import BarcodeScanner from "../common/BarcodeScanner";

const ITEM_FIELDS = [
  { key: "barcode", label: "Barcode" },
  { key: "date", label: "Date" },
  { key: "partyName", label: "Party Name" },
  { key: "designName", label: "Design Name" },
  { key: "itemCode", label: "Item Code" },
  { key: "itemName", label: "Item Name" },
  { key: "purity", label: "Purity" },
  { key: "itemCounter", label: "Item Counter" },
  { key: "grossWeight", label: "Gross Weight" },
  { key: "stoneWeight", label: "Stone Weight" },
  { key: "netWeight", label: "Net Weight" },
  { key: "dcode", label: "Design Code" },
  { key: "designCode", label: "Sub Design Code" },
  { key: "rate", label: "Rate" },
  { key: "metalAmount", label: "Metal Amount" },
  { key: "vaPercent", label: "VA Percent" },
  { key: "vaAmount", label: "VA Amount" },
  { key: "stoneCharge", label: "Stone Charge" },
  { key: "taxableAmount", label: "Taxable Amount" },
  { key: "gstPercent", label: "GST Percent" },
  { key: "gstAmount", label: "GST Amount" },
  { key: "netAmount", label: "Net Amount" },
];

const STONE_FIELDS = [
  { key: "slno", label: "Sl No" },
  { key: "stonecode", label: "Stone Code" },
  { key: "stonename", label: "Stone Name" },
  { key: "stonerate", label: "Stone Rate" },
  { key: "stno", label: "Stone No" },
  { key: "grmwt", label: "Gram Weight" },
  { key: "crwt", label: "Carat Weight" },
  { key: "stonevalue", label: "Stone Value" },
];

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return value;
};

const LEGACY_ITEM_FIELD_MAP = {
  barcode: "barcode",
  date: "date",
  partyname: "partyName",
  designname: "designName",
  itemcode: "itemCode",
  itemname: "itemName",
  purity: "purity",
  itemcounter: "itemCounter",
  "grossweight": "grossWeight",
  "stoneweight": "stoneWeight",
  "netweight": "netWeight",
  designcode: "designCode",
  dcode: "dcode",
  rate: "rate",
  metalamount: "metalAmount",
  "va%": "vaPercent",
  "vapercent": "vaPercent",
  vaamount: "vaAmount",
  stonecharge: "stoneCharge",
  taxableamount: "taxableAmount",
  "gst%": "gstPercent",
  "gstpercent": "gstPercent",
  gstamount: "gstAmount",
  netamount: "netAmount",
};

const normalizeLegacyKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9%]/g, "");

const isLegacyDetailRow = (row) =>
  !!row &&
  typeof row === "object" &&
  Object.prototype.hasOwnProperty.call(row, "decrp") &&
  Object.prototype.hasOwnProperty.call(row, "value");

const normalizeItemDetails = (payload) => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    if (payload.every(isLegacyDetailRow)) {
      const mergedItem = payload.reduce((acc, row) => {
        const mappedKey = LEGACY_ITEM_FIELD_MAP[normalizeLegacyKey(row.decrp)];
        if (mappedKey) {
          acc[mappedKey] = row.value;
        }
        return acc;
      }, {});

      return Object.keys(mergedItem).length > 0 ? [mergedItem] : [];
    }

    return payload;
  }

  return [payload];
};

const normalizeStoneDetails = (payload) => {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : [payload];
};

const ItemDetails = () => {
  const [barcodeNo, setBarcodeNo] = useState("");
  const [itemDetails, setItemDetails] = useState([]);
  const [stoneDetails, setStoneDetails] = useState([]);
  const [imageSrc, setImageSrc] = useState(null);
  const [, setImageMessage] = useState("");
  const [, setIsImageVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [shopCode, setShopCode] = useState("");
  const [shopCodes, setShopCodes] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [isScannerEnabled, setIsScannerEnabled] = useState(false);

  const navigate = useNavigate();
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
  const username = currentUser.username || "";
  const password = currentUser.password || "";

  const roles = Array.isArray(currentUser.roles)
    ? currentUser.roles.map((r) => (typeof r === "object" ? r.role : r))
    : typeof currentUser.roles === "string"
      ? [currentUser.roles]
      : [];
  const userRole = roles[0] || "";

  const TARGET_LENGTH = 10;

  useEffect(() => {
    if (!username) return;

    const init = async () => {
      try {
        const activeShopCode = shopCode || getCurrentShopCode();
        const userExists = await existsByUsername(
          username,
          activeShopCode || undefined
        );
        if (!userExists) navigate("/signin");
      } catch {
        // console.error removed
      }
    };

    init();
  }, [username, shopCode, navigate]);

  useEffect(() => {
    const fetchShopCodes = async () => {
      try {
        const codes = await getShopCodes();
        setShopCodes(Array.isArray(codes) ? codes : []);
        const defaultCode = getCurrentShopCode() || await getDefaultShopCode();
        setShopCode(defaultCode);
      } catch (error) {
        console.error("Failed to fetch shop codes:", error);
      }
    };

    fetchShopCodes();
  }, []);

  // Check if Barcode Scanner should be enabled
  useEffect(() => {
    const checkScannerEnabled = async () => {
      if (!username || !shopCode) return;
      try {
        const query = "SELECT * FROM setdiscount WHERE details = 'BARCODE CAMERA' AND flag = true";
        const result = await DynamicQueryService.fetchList(
          query,
          {},
          { username, password },
          shopCode
        );
        setIsScannerEnabled(Array.isArray(result?.data) && result.data.length > 0);
      } catch (error) {
        console.error("Failed to check scanner availability", error);
        setIsScannerEnabled(false);
      }
    };

    checkScannerEnabled();
  }, [username, password, shopCode]);

  const handleChange = (e) => {
    let v = e.target.value.toUpperCase();
    if (v.length > TARGET_LENGTH) v = v.slice(-TARGET_LENGTH);
    setBarcodeNo(v);
  };

  const handleShopCodeChange = async (event) => {
    const nextShopCode = event.target.value;
    await handleShopSwitch({
      nextShopCode,
      username,
      currentModule: "/itemdetails",
      navigate,
      onSuccess: (code) => setShopCode(code),
    });
  };

  const addchar = (len, cr) => {
    if (len <= 0) return "";
    return new Array(len).fill(cr).join("");
  };

  const handleOkClick = async (overrideBarcode) => {
    let activeBarcode = typeof overrideBarcode === "string" ? overrideBarcode : barcodeNo;
    let processedBarcode = activeBarcode || "";
    processedBarcode = addchar(TARGET_LENGTH - processedBarcode.length, "0") + processedBarcode;
    
    if (processedBarcode !== barcodeNo) {
      setBarcodeNo(processedBarcode);
    }

    // After applying 0 values, if it is still totally empty (should not happen if mapped to 0s), proceed.

    try {
      const data = await getBarcodeDetails(
        processedBarcode,
        shopCode,
        username,
        password
      );
      const nextItemDetails = normalizeItemDetails(data.ItemDetails);
      const nextStoneDetails = normalizeStoneDetails(data.StoneDetails);
      setItemDetails(nextItemDetails);
      setStoneDetails(nextStoneDetails);

      const imgResult = await getImageByBarcode(
        processedBarcode,
        shopCode,
        username,
        password
      );

      if (!imgResult.found || !imgResult.src) {
        setImageSrc(null);
        setImageMessage("No image found");
      } else {
        setImageSrc(imgResult.src);
        setImageMessage("");
      }

      setIsImageVisible(true);
      setIsEditing(false);
    } catch {
      setItemDetails([]);
      setStoneDetails([]);
      setImageSrc(null);
      setImageMessage("No image found");
      setIsImageVisible(false);
    }
  };

  const handleCancelClick = () => {
    setBarcodeNo("");
    setItemDetails([]);
    setStoneDetails([]);
    setImageSrc(null);
    setImageMessage("");
    setIsImageVisible(false);
    setIsEditing(false);
  };

  const handleEditSave = () => {
    setIsEditing(false);
  };

  const handleScan = (scannedCode) => {
    setShowScanner(false);
    handleOkClick(scannedCode);
  };

  return (
    <ModulePageLayout title="Item Details" navigate={navigate}>
      <div className="w-full px-1 sm:px-2 py-2">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 shadow-md border border-slate-200 dark:border-slate-700 mb-4 relative">
          <div className="flex flex-col md:flex-row items-stretch md:items-start gap-6">
            <div className="flex flex-col flex-1 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700/60 border-slate-300 dark:border-slate-600 shadow-md min-w-0">
              <div className="mb-4">
                <select
                  id="shopCode"
                  value={shopCode}
                  onChange={handleShopCodeChange}
                  disabled={!(userRole.includes("ROLE_SUPERUSER") || userRole.includes("ROLE_SUPERADMIN"))}
                  className="h-10 w-full sm:max-w-xs border-2 border-slate-400 dark:border-slate-700/60 rounded-md px-2 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/30"
                >
                  {shopCodes.map((codeObj) => (
                    <option key={codeObj.Shopcode} value={codeObj.Shopcode}>
                      {codeObj.Shopcode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <input
                  id="barcode"
                  type="text"
                  value={barcodeNo}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleOkClick();
                    }
                  }}
                  placeholder="Enter barcode number"
                  className="w-full sm:max-w-sm px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700/60 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 uppercase"
                />
                {isScannerEnabled && (
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="flex items-center justify-center p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                    title="Scan Barcode"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={handleOkClick}
                  className="btn-primary bg-slate-600 shadow-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  OK
                </button>
                <button
                  onClick={handleCancelClick}
                  className="btn-secondary bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md hover:bg-slate-300 transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="flex justify-center items-center bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-700/60 border-slate-300 dark:border-slate-600 shadow-md w-full md:w-72 h-64 sm:h-72 shrink-0">
              <div className="flex justify-center items-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/60 border-slate-300 dark:border-slate-600 w-full h-full overflow-hidden">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Product View"
                    className="object-contain w-full h-full rounded-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      setImageSrc(null);
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <Image className="w-16 h-16 mb-2 opacity-70" />
                    <span className="text-sm">No image</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 lg:p-6 shadow-md border border-slate-200 dark:border-slate-700 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <DetailTable
            title="Item Details"
            data={itemDetails}
            isEditing={isEditing}
            setData={setItemDetails}
            fields={ITEM_FIELDS}
            handleEditSave={handleEditSave}
          />

          <DetailTable
            title="Stone Details"
            data={stoneDetails}
            isEditing={isEditing}
            setData={setStoneDetails}
            fields={STONE_FIELDS}
            handleEditSave={handleEditSave}
          />
        </div>
        {showScanner && (
          <BarcodeScanner 
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </ModulePageLayout>
  );
};

export default ItemDetails;

const DetailTable = ({
  title,
  data,
  isEditing,
  setData,
  fields,
  handleEditSave,
}) => (
  <div className="bg-white dark:bg-slate-900 rounded-lg p-4 lg:p-6 shadow-md border border-slate-200 dark:border-slate-700 flex-1 mb-4">
    <div className="flex justify-between items-center mb-4">
      <h5 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h5>
      {data.length > 0 && isEditing && (
        <button
          onClick={handleEditSave}
          className="btn-success bg-green-500 shadow-md hover:bg-green-600 transition-colors"
        >
          Save
        </button>
      )}
    </div>

    {data.length > 0 ? (
      <div className="overflow-y-auto overflow-x-auto max-h-64 border border-slate-200 dark:border-slate-700/60 rounded-md">
        <table className="min-w-full border-collapse">
          <tbody>
            {data.map((row, idx) => (
              fields.map((field) => (
                <tr className="border-b border-slate-200 dark:border-slate-700/60" key={`${idx}-${field.key}`}>
                  <td className="py-2 px-4 text-slate-700 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-800/50 w-1/3">
                    {field.label}
                  </td>
                  <td className="py-2 px-4 text-slate-600 dark:text-slate-300">
                    {isEditing ? (
                      <input
                        type="text"
                        value={row[field.key] ?? ""}
                        onChange={(e) => {
                          const newData = [...data];
                          newData[idx][field.key] = e.target.value;
                          setData(newData);
                        }}
                        className="w-full rounded-md border-slate-300 dark:border-slate-600"
                      />
                    ) : (
                      formatValue(row[field.key])
                    )}
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-slate-500 dark:text-slate-400 text-center">
        No {title.toLowerCase()} found.
      </p>
    )}
  </div>
);
