"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isActive = (href: string) =>
    pathname === href
      ? "text-gray-900 bg-gray-200"
      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100";

  const handleLogout = () => {
    localStorage.removeItem("rsc_token");
    sessionStorage.removeItem("rsc_token");
    router.push("/");
  };

  const menuItems = [
    { href: "/dashboard", icon: "fa-gauge", label: "Dashboard" },
    { href: "/analytics", icon: "fa-chart-column", label: "Analytics" },
    { href: "/sold", icon: "fa-circle-check", label: "Sold" },
    { href: "/orders", icon: "fa-receipt", label: "Orders" },
    { href: "/attach", icon: "fa-receipt", label: "Attach" },
  ];


  return (

    <div>

    <nav
      className={`fixed top-0 mb-12  left-0 w-full z-50 border-b p-2 transition-all duration-500 ${
        isOpen
          ? "bg-white shadow-lg border-slate-200"
          : isScrolled
            ? "bg-white/95 backdrop-blur-xl shadow-lg border-slate-200/80"
            : "bg-white/80 backdrop-blur-lg shadow-sm border-slate-200"
      }`}
    >
      
      <div className="mx-auto w-full flex items-center justify-between px-4 py-2 h-16 ">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-black text-white flex items-center justify-center font-semibold text-sm shadow-md transition-transform duration-300 hover:scale-105">
            <i className="fa-solid fa-desktop text-sm"></i>
          </div>
          <span className="font-semibold text-lg text-gray-800 tracking-tight transition-all duration-300">
            Royal Smart Computer
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-sm ">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 transform ${isActive(
                item.href
              )}`}
            >
              <i className={`fa-solid ${item.icon} w-4 text-center`} />
              {item.label}
            </Link>
          ))}

          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-300 transform hover:scale-105"
            onClick={handleLogout}
          >
            <i className="fa-solid fa-right-from-bracket" />
            Logout
          </button>
        </div>

        <div className="md:hidden flex items-center">
          <button
            ref={hamburgerRef}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-all duration-300 transform hover:scale-110"
            onClick={() => setIsOpen(!isOpen)}
          >
            <i
              className={`fa-solid fa-bars text-lg transition-transform duration-300 ${
                isOpen ? "rotate-90 scale-110" : "rotate-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden absolute left-auto right-0 top-full z-50 transition-all duration-300 ease-out bg-white border border-slate-200 shadow-xl w-[min(92vw,20rem)] ${
          isOpen
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none -translate-y-2"
        }`}
      >
        <div className="flex flex-col gap-1 px-0 py-3">
          {menuItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-3 px-4 py-3 transition-all duration-500 transform w-full ${
                isOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
              } ${isActive(item.href)}`}
              style={{ transitionDelay: isOpen ? `${index * 100}ms` : "0ms" }}
              onClick={() => setIsOpen(false)}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          <button
            className={`inline-flex items-center gap-3 px-4 py-3 w-full bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-500 transform ${
              isOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
            }`}
            style={{
              transitionDelay: isOpen
                ? `${(menuItems.length + 1) * 100}ms`
                : "0ms",
            }}
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }}
          >
            <i className="fa-solid fa-right-from-bracket w-5 text-center" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </nav>
    <div className="mb-30">
       </div>
    </div>

  );
}
