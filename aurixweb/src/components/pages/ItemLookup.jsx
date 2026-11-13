import React, { useState, useEffect, useCallback } from 'react';
import { SalesService } from '../../services/SalesEntryApi';

const ItemLookup = ({ isOpen, onClose, onSelect, metalType = 'G', shopCode }) => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await SalesService.getItems(metalType, shopCode);
            setItems(response.data || []);
        } catch (error) {
            console.error('Error fetching items:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [metalType, shopCode]);

    useEffect(() => {
        if (isOpen) {
            fetchItems();
            setSearchTerm('');
            setSelectedIndex(0);
        }
    }, [fetchItems, isOpen]);

    const filteredItems = items.filter(item =>
        item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemDesc?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (item) => {
        onSelect({
            itemCode: item.itemCode,
            itemDesc: item.itemDesc,
            cntr: item.counter,
            vaPer: item.va,
            unit: item.unit,
            billType: item.billType
        });
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                handleSelect(filteredItems[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-[95%] max-w-[550px] max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center bg-slate-700 dark:bg-slate-800 text-white dark:border-b dark:border-slate-700/60 shadow-sm px-4 py-3 rounded-t-lg">
                    <h2 className="text-lg font-semibold">Item Lookup - {metalType.toUpperCase().startsWith('S') ? 'Silver' : 'Gold'}</h2>
                        <button onClick={onClose} className="text-2xl hover:text-slate-300 transition-colors">
        ✕
    </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700/60">
                    <input
                        type="text"
                        placeholder="Search by Item Code or Description..."
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-shadow shadow-inner"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="text-slate-500 dark:text-slate-400">Loading items...</div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-b-lg flex justify-between items-center border-t">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                        {filteredItems.length} item(s) • Use ↑↓ to navigate, Enter to select, Esc to close
                    </div>
                    {/* <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-800/500 text-white rounded hover:bg-slate-600 dark:bg-slate-800 transition-colors"
                    >
                        Close
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export default ItemLookup;
