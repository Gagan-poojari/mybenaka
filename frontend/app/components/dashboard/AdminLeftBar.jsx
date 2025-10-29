"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu,
    X,
    Home,
    Users,
    FileText,
    ChartPie,
    IndianRupee,
    Settings,
    Bell,
    CreditCard,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";


const navItems = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "managers", label: "Managers", icon: Users },
    { key: "borrowers", label: "Borrowers", icon: FileText },
    { key: "loans", label: "My Loans", icon: CreditCard },
    { key: "collectionlogs", label: "Collection Logs", icon: IndianRupee },
    { key: "activitylogs", label: "Activity Logs", icon: ChartPie },
    { key: "settings", label: "Settings", icon: Settings },
];

const AdminLeftbar = () => {
    const pathname = usePathname()

    const [open, setOpen] = useState(true); // desktop expanded state
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Map routes to nav keys
    const getActiveKey = () => {
        if (pathname === '/admin' || pathname === '/admin/dashboard') return 'dashboard';
        if (pathname.startsWith('/admin/managers')) return 'managers';
        if (pathname.startsWith('/admin/borrowers')) return 'borrowers';
        if (pathname.startsWith('/admin/loans')) return 'loans';
        if (pathname.startsWith('/admin/collectionlogs')) return 'collectionlogs';
        if (pathname.startsWith('/admin/activitylogs')) return 'activitylogs';
        if (pathname.startsWith('/admin/settings')) return 'settings';
        return 'dashboard';
    };
    const active = getActiveKey();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) setOpen(false);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const container = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0, transition: { staggerChildren: 0.02 } },
    };
    const item = {
        hidden: { opacity: 0, x: -8 },
        show: { opacity: 1, x: 0 },
    };

    const formatLabel = (label) => label;

    return (
        <>
            {/* Mobile hamburger */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    aria-label="Open menu"
                    onClick={() => setMobileOpen(true)}
                    className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center ring-1 ring-slate-100"
                >
                    <Menu className="w-6 h-6 text-slate-700" />
                </button>
            </div>

            {/* Desktop / large screens sidebar */}
            <aside
                className='hidden lg:flex flex-col h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out p-4 w-80'
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/70 backdrop-blur rounded-2xl h-full shadow-xl border border-slate-100 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 shadow-inner">
                                <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center ring-1 ring-orange-100">
                                    <span className="font-bold text-orange-600">B</span>
                                </div>
                            </div>

                            {open && (
                                <div>
                                    <div className="flex items-center font-semibold">
                                        <span className="text-orange-600">Namma</span><span className="text-slate-900">Benaka</span>
                                    </div>
                                    <div className="text-xs text-slate-500">Dashboard</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nav */}
                    <div className="flex-1 overflow-auto">
                        <motion.nav variants={container} initial="hidden" animate="show" className="p-2 flex flex-col gap-1">
                            {navItems.map((n) => {
                                const Icon = n.icon;
                                const activeItem = n.key === active;
                                return (
                                    <Link key={n.key} href={`/admin/${n.key}`} className="group w-full flex items-center gap-3 text-left rounded-lg hover:bg-orange-50 transition-colors duration-150 focus:outline-none cursor-pointer">
                                        <motion.button
                                            key={n.key}
                                            variants={item}
                                            // onClick={() => onNavigate?.(n.key)}
                                            className={`group w-full flex items-center gap-3 text-left rounded-lg px-2 py-3 hover:bg-orange-50 transition-colors duration-150 focus:outline-none cursor-pointer ${activeItem ? "bg-orange-50" : ""
                                                }`}
                                        >
                                            <div
                                                className={`flex items-center justify-center w-10 h-10 rounded-lg shadow-sm ring-1 ring-slate-100 ${activeItem ? "bg-orange-100" : "bg-white"
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 ${activeItem ? "text-orange-600" : "text-slate-600"}`} />
                                            </div>

                                            {open && (
                                                <div className="flex-1">
                                                    <div className={`font-medium ${activeItem ? "text-slate-900" : "text-slate-700"}`}>{formatLabel(n.label)}</div>
                                                    <div className="text-xs text-slate-400">{n.key === "loans" ? "Manage loans & terms" : ""}</div>
                                                </div>
                                            )}

                                            <div className="ml-auto">
                                                {activeItem && <div className="w-3 h-3 rounded-full bg-orange-400 shadow-md" />}
                                            </div>
                                        </motion.button>
                                    </Link>
                                );
                            })}
                        </motion.nav>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 justify-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center ring-1 ring-slate-100">
                                    <img src="https://api.dicebear.com/5.x/initials/svg?seed=SA" alt="avatar" className="w-8 h-8 rounded-md" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">Super Admin</div>
                                    <div className="text-xs text-slate-400">admin@nammabenaka.com</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </aside>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* backdrop */}
                        <motion.div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

                        <motion.div
                            className="absolute left-0 top-0 bottom-0 w-80 p-4"
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <div className="h-full bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50">
                                            <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center ring-1 ring-orange-100">
                                                <span className="font-bold text-orange-600">B</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-900 font-semibold">Benaka Admin</div>
                                            <div className="text-xs text-slate-500">Premium Dashboard</div>
                                        </div>
                                    </div>

                                    <button onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-slate-50">
                                        <X className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-auto">
                                    <nav className="px-2 flex flex-col gap-1">
                                        {navItems.map((n) => {
                                            const Icon = n.icon;
                                            const activeItem = n.key === active;
                                            return (
                                                <Link key={n.key} href={`/admin/${n.key}`} className="w-full flex items-center gap-3 text-left rounded-lg p-3 hover:bg-orange-50 transition-colors duration-150">
                                                <button
                                                    key={n.key}
                                                    onClick={() => {
                                                        // onNavigate?.(n.key);
                                                        setMobileOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 text-left rounded-lg px-2 py-1 hover:bg-orange-50 transition-colors duration-150 ${activeItem ? "bg-orange-50" : ""
                                                        }`}
                                                >
                                                    <div
                                                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${activeItem ? "bg-orange-100" : "bg-white"} ring-1 ring-slate-100`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${activeItem ? "text-orange-600" : "text-slate-600"}`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={`font-medium ${activeItem ? "text-slate-900" : "text-slate-700"}`}>{formatLabel(n.label)}</div>
                                                        <div className="text-xs text-slate-400">{n.key === "loans" ? "Manage loans & terms" : ""}</div>
                                                    </div>
                                                </button>
                                                </Link>
                                            );
                                        })}
                                    </nav>
                                </div>

                                <div className="p-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center ring-1 ring-slate-100">
                                                <img src="https://api.dicebear.com/5.x/initials/svg?seed=SA" alt="avatar" className="w-8 h-8 rounded-md" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">Super Admin</div>
                                                <div className="text-xs text-slate-400">admin@nammabenaka.com</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default AdminLeftbar