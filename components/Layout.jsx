// components/Layout.jsx
"use client";
import Sidebar from "./Sidebar";

export default function Layout({ children, active }) {
  return (
    <div className="flex">
      <Sidebar active={active} />
      <main className="flex-1 bg-gray-900 text-white min-h-screen p-6">
        {children}
      </main>
    </div>
  );
}
