import React from "react";

export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`px-6 py-3 rounded-2xl font-medium shadow-md transition 
      bg-indigo-600 hover:bg-indigo-500 text-white ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
