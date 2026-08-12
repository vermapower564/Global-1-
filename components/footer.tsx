import React from "react";

export default function Footer() {
  return (
    <footer className="border-t bg-white py-4 px-6 text-center text-sm text-gray-500">
      <p>© {new Date().getFullYear()} Operations Management System (OMS). All rights reserved.</p>
    </footer>
  );
}
