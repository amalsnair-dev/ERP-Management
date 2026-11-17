import React, { createContext, useContext, useState, useCallback } from 'react';
import { SalesService } from '../../services/SalesEntryApi';
import { getAllCustomers } from '../../services/ShopAPI';

const LookupContext = createContext();

export const useLookup = () => {
    const context = useContext(LookupContext);
    if (!context) {
        throw new Error('useLookup must be used within a LookupProvider');
    }
    return context;
};

export const LookupProvider = ({ children }) => {
    const [lookupConfig, setLookupConfig] = useState({
        isOpen: false,
        title: '',
        apiFunction: null,
        columns: [],
        mapData: null,
        onSelect: null,
        onClose: null,
        size: 'lg'
    });

    const showLookup = useCallback((config) => {
        setLookupConfig({
            ...config,
            isOpen: true
        });
    }, []);

    const hideLookup = useCallback(() => {
        setLookupConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    const value = {
        lookupConfig,
        showLookup,
        hideLookup
    };

    return (
        <LookupContext.Provider value={value}>
            {children}
        </LookupContext.Provider>
    );
};

// --- PREDEFINED LOOKUP CONSTRUCTIONS ---

export const lookupConfigs = {
    estno: (onSelect, type, shopcode) => ({
        title: `Estimate Lookup (${type})`,
        size: 'lg',
        apiFunction: () => SalesService.searchEstimatesByMetal(type === 'SILVER' ? 'S' : 'G', shopcode),
        columns: [
            { key: 'estNo', label: 'Est No' },
            { key: 'estCunm', label: 'Customer Name' },
            { key: 'estAdd1', label: 'Address' },
            { key: 'estPhone', label: 'Phone' },
            { key: 'estSman1', label: 'Salesman' }
        ],
        mapData: (d) => {
            const get = (obj, ...keys) => {
                for (let k of keys) {
                    if (obj[k] !== undefined) return obj[k];
                    // Also check uppercase and lowercase versions
                    if (obj[k.toUpperCase()] !== undefined) return obj[k.toUpperCase()];
                    if (obj[k.toLowerCase()] !== undefined) return obj[k.toLowerCase()];
                }
                return '';
            };
            return {
                estNo: get(d, 'estNo', 'est_no'),
                estCunm: get(d, 'estCunm', 'est_cunm'),
                estAdd1: get(d, 'estAdd1', 'est_add1'),
                estPhone: get(d, 'estPhone', 'est_phone', 'estMob', 'est_mob'),
                estSman1: get(d, 'estSman1', 'est_sman1')
            };
        },
        onSelect
    }),

    // 2. Customer
    customer: (onSelect, shopcode) => ({
        title: "Customer Lookup",
        size: 'xl',
        apiFunction: () => getAllCustomers(shopcode),
        columns: [
            { key: 'name', label: 'Cust Name' },
            { key: 'add1', label: 'Address 1' },
            { key: 'add2', label: 'Address 2' },
            { key: 'place', label: 'Place' },
            { key: 'pincode', label: 'Pin' },
            { key: 'mob', label: 'Phone' },
            { key: 'code', label: 'Cust ID' },
            { key: 'crmid', label: 'ID' }
        ],
        mapData: (d) => {
            const get = (obj, ...keys) => {
                for (let k of keys) {
                    if (obj[k] !== undefined) return obj[k];
                    if (obj[k.toUpperCase()] !== undefined) return obj[k.toUpperCase()];
                    if (obj[k.toLowerCase()] !== undefined) return obj[k.toLowerCase()];
                }
                return '';
            };
            return {
                name: get(d, 'name', 'custName', 'estCunm'),
                add1: get(d, 'add1', 'address1', 'estAdd1'),
                add2: get(d, 'add2', 'address2', 'estAdd2'),
                place: get(d, 'place', 'add3', 'estAdd3'),
                pincode: get(d, 'pincode', 'estPin'),
                mob: get(d, 'mob', 'phone', 'estPhone'),
                code: get(d, 'custid', 'custId', 'code'),
                crmid: get(d, 'Id', 'id', 'crmId'),
                gstNo: get(d, 'gstin', 'gstno', 'gstNo'),
                panNo: get(d, 'panno', 'pan', 'panNo'),
                aadhar: get(d, 'aadharno', 'aadhar', 'aadhar_no'),
                email: get(d, 'email')

            };
        },
        onSelect
    }),

    // 3. Care-Of
    careof: (onSelect, shopcode) => ({
        title: "Care-Of Lookup",
        size: 'md',
        apiFunction: () => SalesService.getAllCareOf(shopcode),
        columns: [
            { key: 'careofname', label: 'Name' },
            { key: 'addr', label: 'Address' },
            { key: 'place', label: 'Place' },
            { key: 'phoneno', label: 'Phone' },
            { key: 'careofcode', label: 'Code' }
        ],
        mapData: (r) => ({
            ...r,
            addr: r.addr || '-'
        }),
        onSelect
    }),

    // 4. Item Details
    itemdetails: (onSelect, metalType, shopCode) => ({
        title: `Item Lookup (${metalType})`,
        size: 'md',
        sortBy: 'itemDesc',
        apiFunction: async () => {
            const res = await SalesService.getItems(metalType, shopCode);
            if (Array.isArray(res?.data)) {
                res.data.sort((a, b) => {
                    const descA = String(a.itemDesc || a.item_desc || a.itdesc || '').toLowerCase();
                    const descB = String(b.itemDesc || b.item_desc || b.itdesc || '').toLowerCase();
                    return descA.localeCompare(descB);
                });
            }
            return res;
        },
        columns: [
             { key: 'itemDesc', label: 'Description' },
             { key: 'itemCode', label: 'Item Code' }
           
        ],
        mapData: (item) => {
            const get = (obj, ...keys) => {
                for (let k of keys) {
                    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
                    if (obj[k.toUpperCase()] !== undefined && obj[k.toUpperCase()] !== null) return obj[k.toUpperCase()];
                    if (obj[k.toLowerCase()] !== undefined && obj[k.toLowerCase()] !== null) return obj[k.toLowerCase()];
                }
                return '';
            };
            return {
                ...item,
                itemDesc: get(item, 'itemDesc', 'item_desc', 'itdesc', 'est_itdesc'),
                itemCode: get(item, 'itemCode', 'item_code', 'icode', 'est_icode'),
                cntr: get(item, 'counter', 'cntr', 'est_cntr'),
                vaPer: get(item, 'va', 'vaPer', 'va_per', 'vaper', 'vaPercent', 'va_percent'),
                unit: get(item, 'unit'),
                billType: get(item, 'billType', 'bill_type', 'billtype', 'bType', 'btype'),
            };
        },
        onSelect
    }),

    // 5. Salesman
    salesman: (onSelect, shopcode) => ({
        title: "Select Salesman",
        size: 'sm',
        apiFunction: () => SalesService.getAllSalesmen(shopcode),
        columns: [
            { key: 'salesman_name', label: 'Name' },
            { key: 'salesman_code', label: 'Code' }
        ],
        mapData: (sm) => {
            const get = (obj, ...keys) => {
                for (let k of keys) {
                    if (obj[k] !== undefined) return obj[k];
                    if (obj[k.toUpperCase()] !== undefined) return obj[k.toUpperCase()];
                    if (obj[k.toLowerCase()] !== undefined) return obj[k.toLowerCase()];
                }
                return '';
            };
            return {
                salesman_name: get(sm, 'salesman_name', 'smName', 'smanName'),
                salesman_code: get(sm, 'salesman_code', 'smCode', 'smanCode')
            };
        },
        onSelect
    }),

    // 6. stones
    stone: (onSelect, shopcode) => ({
        title: "Select Stone",
        size: 'md',
        apiFunction: () => SalesService.getStones(shopcode),
        columns: [
            { key: 'sDesc', label: 'Stone Description' },
            { key: 'sCode', label: 'Stone Code' }
        ],
        mapData: (s) => {
            const get = (obj, ...keys) => {
                for (let k of keys) {
                    if (obj[k] !== undefined) return obj[k];
                    if (obj[k.toUpperCase()] !== undefined) return obj[k.toUpperCase()];
                    if (obj[k.toLowerCase()] !== undefined) return obj[k.toLowerCase()];
                }
                return '';
            };
            return {
                ...s,
                sDesc: get(s, 'sDesc', 'sdesc', 'stoneDesc'),
                sCode: get(s, 'sCode', 'scode', 'stoneCode')
            };
        },
        onSelect
    })
};









