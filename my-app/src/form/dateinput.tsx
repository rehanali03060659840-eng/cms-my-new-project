"use client";

import type { DateValue } from "@internationalized/date";
import { Button, DateInput } from "@heroui/react";
import { getLocalTimeZone, today, parseDate } from "@internationalized/date";
import { useEffect, useState } from "react";

type DateControlledProps = {
  value: string;
  onChange: (dateStr: string) => void;
};

export const DateControlled = ({ value, onChange }: DateControlledProps) => {
  const [internalDate, setInternalDate] = useState<DateValue | null>(null);

  useEffect(() => {
    if (value) {
      try {
        setInternalDate(parseDate(value));
      } catch (e) {
        console.error("Invalid date string format received:", value);
      }
    } else {
      setInternalDate(null);
    }
  }, [value]);

  const handleDateChange = (newDateValue: DateValue | null) => {
    setInternalDate(newDateValue);
    onChange(newDateValue ? newDateValue.toString() : "");
  };

  const handleSetToday = () => {
    const currentToday = today(getLocalTimeZone());
    setInternalDate(currentToday);
    onChange(currentToday.toString());
  };

  const handleClear = () => {
    setInternalDate(null);
    onChange("");
  };

  return (
    <div className="flex flex-col">
      <DateInput
        className="w-[256px]"
        name="date"
        label="Date"
        labelPlacement="outside"
        value={internalDate}
        onChange={handleDateChange}
        description={`Current value: ${internalDate ? internalDate.toString() : "(empty)"}`}
        classNames={{
          label: "text-sm font-semibold text-gray-700",
          inputWrapper:
            "border border-gray-300 rounded-lg px-4 py-2 bg-white focus-within:ring focus-within:ring-slate-400",
          description: "text-xs text-gray-500 mt-1",
        }}
      />

      <div className="flex gap-2 mt-2">
        <Button
          type="button"
          variant="light"
          className="p-1.5 text-xs rounded-[5px] font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
          onPress={handleSetToday}
        >
          Set today
        </Button>
        <Button
          type="button"
          variant="light"
          onPress={handleClear}
          className="p-1.5 text-xs rounded-[5px] font-semibold hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
        >
          Clear
        </Button>
      </div>
    </div>
  );
};