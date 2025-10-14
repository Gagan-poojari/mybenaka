'use client';
import { ReactNode } from 'react';
import Link from 'next/link';

const DashboardLayout = ({ children, role }) => {
  const sidebarItems = {
    admin: ['Users', 'Reports', 'Settings'],
    manager: ['Projects', 'Teams', 'Analytics'],
    user: ['Profile', 'Tasks', 'Messages'],
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white p-4 shadow-md">
        <h2 className="text-xl font-bold mb-6">{role.toUpperCase()} DASHBOARD</h2>
        <ul>
          {sidebarItems[role].map((item) => (
            <li key={item} className="mb-3 hover:text-blue-500">
              <Link href="#">{item}</Link>
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
