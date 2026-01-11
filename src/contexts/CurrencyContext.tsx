import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number | string) => string;
  refreshCurrency: () => Promise<void>;
}

const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
];

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>(
    CURRENCIES.find(c => c.code === "INR") || CURRENCIES[0]
  );

  const fetchCurrency = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurant/current`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.restaurant.currency) {
          const selectedCurrency = CURRENCIES.find(c => c.code === data.restaurant.currency);
          if (selectedCurrency) {
            setCurrency(selectedCurrency);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch currency:", error);
    }
  };

  useEffect(() => {
    fetchCurrency();
  }, []);

  const formatPrice = (amount: number | string): string => {
    // Convert string to number if needed
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Handle invalid values
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
      const decimals = ['JPY', 'CNY'].includes(currency.code) ? 0 : 2;
      return `${currency.symbol}${(0).toFixed(decimals)}`;
    }
    
    // For currencies with no decimal places (like JPY)
    const decimals = ['JPY', 'CNY'].includes(currency.code) ? 0 : 2;
    const formatted = numAmount.toFixed(decimals);
    
    // Add thousand separators
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return `${currency.symbol}${parts.join('.')}`;
  };

  const refreshCurrency = async () => {
    await fetchCurrency();
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, refreshCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};