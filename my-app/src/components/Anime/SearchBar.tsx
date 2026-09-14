import { useEffect, useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
}: SearchBarProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const debounce = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(debounce);
  }, [localValue, onChange]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="relative mb-6 max-w-xl">
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
        <Search size={18} />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] py-3 pl-11 pr-4 text-white placeholder:text-white/40 transition-all focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue("");
            onChange("");
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
