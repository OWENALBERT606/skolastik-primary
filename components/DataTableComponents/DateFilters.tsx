"use client";

import React, { useState } from "react";
import Select from "react-tailwindcss-select";
import { SelectValue } from "react-tailwindcss-select/dist/components/type";
// import { months } from "../Forms/SavingForm";

export const months = [
  {
    label: "January",
    value: "JANUARY",
  },
  {
    label: "February",
    value: "FEBRUARY",
  },
  {
    label: "March",
    value: "MARCH",
  },
  {
    label: "April",
    value: "APRIL",
  },
  {
    label: "May",
    value: "MAY",
  },
  {
    label: "June",
    value: "JUNE",
  },
  {
    label: "July",
    value: "JULY",
  },
  {
    label: "August",
    value: "AUGUST",
  },
  {
    label: "September",
    value: "SEPTEMBER",
  },
  {
    label: "October",
    value: "OCTOBER",
  },
  {
    label: "November",
    value: "NOVEMBER",
  },
  {
    label: "December",
    value: "DECEMBER",
  },
];

export default function DateFilters({
  data,
  onFilter,
  setIsSearch,
}: {
  data: any[];
  onFilter: any;
  setIsSearch: any;
}) {
  const [selectedFilter, setSelectedFilter] = useState<SelectValue>(null);
  const filterByMonth = (data: any[], key: string): any[] => {
    return data.filter((item) => item.month === key);
  };
  const handleChange = (item: any) => {
    const valueString = item!.value;
    setSelectedFilter(item);
    setIsSearch(false);
    const filteredData = filterByMonth(data, valueString);
    onFilter(filteredData);
  };
  return (
    <div className="w-full">
      <Select
        value={selectedFilter}
        onChange={handleChange}
        options={months}
        primaryColor={"indigo"}
        isSearchable
        placeholder="Filter By Month"
      />
    </div>
  );
}
