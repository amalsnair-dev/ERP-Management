import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLookup } from './LookupContext';

const tableTypography = {
    header: "font-semibold text-xs tracking-wider",
    cellText: "font-semibold text-xs",
    cellMono: "font-mono font-bold text-sm",
    cellAmount: "font-mono font-black text-sm",
};

const sizeClasses = {
    sm: 'max-w-md',    // For narrow popups like Salesman
    md: 'max-w-2xl',   // For medium popups like Item Details
    lg: 'max-w-4xl',   // Default size
    xl: 'max-w-6xl',   // For wide popups like Customer
    full: 'max-w-[95vw]'
};

const UniversalLookupPopup = () => {
    const { lookupConfig, hideLookup } = useLookup();

    // Internal state
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchField, setSearchField] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50; // Optimized balance between rendering speed and page count

    const inputRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const rowRefs = useRef([]);
    // Guard: ignore Enter key for a short window after the popup opens so the
    // same keystroke that triggered the popup cannot immediately select row 0.
    const readyRef = useRef(false);

    // Reset when lookup opens with new config
    useEffect(() => {
        if (lookupConfig?.isOpen) {
            // Block Enter key until the popup is fully settled (prevents the
            // opening keystroke from instantly selecting row 0)
            readyRef.current = false;
            const readyTimer = setTimeout(() => { readyRef.current = true; }, 200);

            // Dismiss active keyboard immediately to prevent popup from opening behind it on mobile
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            setSearchTerm('');
            setSelectedIndex(0);
            setData([]);
            setFilteredData([]);
            setCurrentPage(1);

            // Set default search field if provided, otherwise use first column
            if (lookupConfig.searchFields && lookupConfig.searchFields.length > 0) {
                setSearchField(lookupConfig.searchFields[0]);
            } else if (lookupConfig.columns && lookupConfig.columns.length > 0) {
                setSearchField(lookupConfig.columns[0].key);
            }

            fetchData();
            // Auto-focus on desktop/laptop, keep keyboard closed on mobile/iPad
            const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            if (!isMobile) {
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
            }

            return () => clearTimeout(readyTimer);
        }
    }, [lookupConfig?.isOpen, lookupConfig?.apiFunction]);

    const fetchData = useCallback(async () => {
        if (!lookupConfig?.apiFunction) return;

        setLoading(true);
        try {
            const response = await lookupConfig.apiFunction();
            let rawData = [];
            if (Array.isArray(response?.data)) {
                rawData = response.data;
            } else if (Array.isArray(response?.data?.data)) {
                rawData = response.data.data;
            } else if (Array.isArray(response)) {
                rawData = response;
            }

            // Apply normalization if provided
            if (lookupConfig.mapData) {
                rawData = rawData.map(lookupConfig.mapData);
            }

            if (lookupConfig.sortBy) {
                const sortKey = lookupConfig.sortBy;
                rawData.sort((a, b) => {
                    const valA = String(a[sortKey] || '').toLowerCase();
                    const valB = String(b[sortKey] || '').toLowerCase();
                    return valA.localeCompare(valB);
                });
            }

            setData(rawData);
            setFilteredData(rawData);
        } catch (error) {
            console.error('Lookup fetch error:', error);
            setData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    }, [lookupConfig]);

    // Filtering logic
    useEffect(() => {
        if (!data) return;

        const filtered = searchTerm.trim()
            ? data.filter(item => {
                const value = String(item[searchField] || '').toLowerCase();
                return value.includes(searchTerm.toLowerCase());
            })
            : data;

        setFilteredData(filtered);
        setSelectedIndex(0);
        setCurrentPage(1);
    }, [searchTerm, data, searchField]);

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const visibleData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handleClose = useCallback(() => {
        if (lookupConfig?.onClose) {
            lookupConfig.onClose();
        }
        hideLookup();
    }, [lookupConfig?.onClose, hideLookup]);

    const handleSelect = useCallback((item) => {
        if (lookupConfig?.onSelect) {
            lookupConfig.onSelect(item);
        }
        handleClose();
    }, [lookupConfig?.onSelect, handleClose]);

    // Global keyboard handling when lookup is open
    useEffect(() => {
        if (!lookupConfig?.isOpen) return;

        const handleGlobalKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => {
                    if (prev < visibleData.length - 1) return prev + 1;
                    // Move to next page if at bottom and next page exists
                    if (currentPage < totalPages) {
                        setCurrentPage(p => p + 1);
                        return 0;
                    }
                    return prev;
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => {
                    if (prev > 0) return prev - 1;
                    // Move to previous page if at top
                    if (currentPage > 1) {
                        setCurrentPage(p => p - 1);
                        return itemsPerPage - 1;
                    }
                    return prev;
                });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                // Guard: skip if popup is not yet "ready" (prevents the opening
                // keystroke from instantly auto-selecting the highlighted row)
                if (!readyRef.current) return;
                if (visibleData[selectedIndex]) {
                    handleSelect(visibleData[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [lookupConfig?.isOpen, visibleData, selectedIndex, currentPage, totalPages, handleSelect, handleClose]);

    // Auto-scroll selected row into view
    useEffect(() => {
        if (rowRefs.current[selectedIndex]) {
            rowRefs.current[selectedIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }, [selectedIndex]);

    if (!lookupConfig?.isOpen) return null;

    const columns = lookupConfig.columns || [];

    // Get the width class based on config, default to 'lg' (4xl)
    const maxWidthClass = sizeClasses[lookupConfig?.size] || sizeClasses.lg;

    // Calculate adjacent page numbers for display
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center px-4 pb-4 pt-[4vh] z-[9999] animate-in fade-in duration-200">
            <div
                className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full ${maxWidthClass} max-h-[55vh] lg:max-h-[80vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-300`}
            >
                {/* Header */}
                <div className="bg-slate-700 dark:bg-slate-800 px-6 py-4 flex justify-between items-center text-white shrink-0 shadow-md">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">{lookupConfig.title || 'Lookup'}</h2>
                        <p className="text-slate-100 dark:text-slate-400 text-xs mt-0.5">Use arrow keys to navigate, Enter to select</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-2xl font-light"
                    >
                        ×
                    </button>
                </div>

                {/* Sub-header / Search */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={`Search by ${columns.find(c => c.key === searchField)?.label || 'Value'}...`}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute left-3 top-2.5 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {columns.length > 1 && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Search in:</span>
                                <select
                                    className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-500 transition-all cursor-pointer"
                                    value={searchField}
                                    onChange={(e) => setSearchField(e.target.value)}
                                >
                                    {columns.map(col => (
                                        <option key={col.key} value={col.key}>{col.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Content */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-auto min-h-[300px]"
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-3">
                            <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Fetching records...</span>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">No matches found for "{searchTerm}"</span>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-700 dark:bg-slate-800 shadow-sm">
                                    {columns.map((col, idx) => (
                                        <th
                                            key={col.key}
                                            className={`px-6 py-3.5 text-white uppercase border-b border-slate-700 ${idx === 0 ? 'rounded-tl-lg' : ''} ${tableTypography.header}`}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {visibleData.map((item, index) => (
                                    <tr
                                        key={index}
                                        ref={el => rowRefs.current[index] = el}
                                        className={`transition-all cursor-pointer group ${index === selectedIndex
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ring-2 ring-inset ring-slate-500/50'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            }`}
                                        onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        {columns.map((col, colIdx) => (
                                            <td
                                                key={col.key}
                                                className={`px-6 py-3.5 whitespace-nowrap ${colIdx === 0 ? `text-slate-900 dark:text-slate-100 ${tableTypography.cellMono}` : `text-slate-600 dark:text-slate-300 ${tableTypography.cellText}`}`}
                                            >
                                                {item[col.key] || <span className="text-slate-300 dark:text-slate-600 italic">N/A</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0 z-20">
                            <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} records
                            </div>
                            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); setSelectedIndex(0); }}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors text-slate-700 dark:text-slate-300 mr-1"
                                >
                                    Prev
                                </button>

                                {getPageNumbers().map((page, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (page !== '...') {
                                                setCurrentPage(page);
                                                setSelectedIndex(0);
                                            }
                                        }}
                                        disabled={page === '...'}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${page === currentPage
                                            ? 'bg-slate-600 hover:bg-slate-700 text-white shadow-sm'
                                            : page === '...'
                                                ? 'bg-transparent text-slate-400 cursor-default px-1'
                                                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(totalPages, p + 1)); setSelectedIndex(0); }}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:dark:bg-slate-800 disabled:cursor-not-allowed rounded-md transition-colors ml-1"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] font-medium text-slate-500 uppercase tracking-widest shrink-0">
                    <div>
                        {filteredData.length} records found
                        {searchTerm && <span className="ml-2 text-slate-500">• Filtered from {data.length}</span>}
                    </div>
                    <div>
                        Press <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-xs">ESC</kbd> to close
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UniversalLookupPopup;
