"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PhotoIcon,
  UsersIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

export default function Sidebar({ onLogout }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`${collapsed ? "w-20" : "w-64"
        } bg-black text-white h-screen flex flex-col p-4 shadow-lg transition-all duration-300`}
    >
      {/* Header / Toggle */}
      <div className="flex justify-between items-center mb-8">
        {!collapsed && (
          <h1
            className="text-xl font-bold text-center cursor-pointer hover:text-blue-400 transition"
            onClick={() => router.push("/")}
          >
            SINEVA 
          </h1>
        )}
        <button
          className="p-2 rounded hover:bg-gray-800 transition"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Bars3Icon className="w-6 h-6 text-gray-300" />
        </button>
      </div>


      {/* Menu Items */}
      <div className="flex flex-col flex-grow gap-2">
        <button
          className="flex items-center gap-3 hover:bg-gray-800/70 px-4 py-2 rounded transition-colors duration-200"
          onClick={() => router.push("/created")}
        >
          <PhotoIcon className="w-6 h-6 text-gray-300" />
          {!collapsed && <span>Created Images</span>}
        </button>

        <button
          className="flex items-center gap-3 hover:bg-gray-800/70 px-4 py-2 rounded transition-colors duration-200"
          onClick={() => router.push("/community")}
        >
          <UsersIcon className="w-6 h-6 text-gray-300" />
          {!collapsed && <span>Community Images</span>}
        </button>
      </div>

      {/* Logout */}
      <button
        className="flex items-center gap-3 mt-auto hover:bg-gray-800/70 px-4 py-2 rounded transition-colors duration-200"
        onClick={onLogout}
      >
        <ArrowLeftOnRectangleIcon className="w-6 h-6 text-gray-300" />
        {!collapsed && <span>Logout</span>}
      </button>
    </div>
  );
}
