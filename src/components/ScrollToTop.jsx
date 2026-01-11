import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });

    // Enforce light mode on customer-facing routes (only allow dashboard and staff pages)
    if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/staff')) {
      document.documentElement.classList.remove('dark');
    }
  }, [pathname]);

  return null;
}