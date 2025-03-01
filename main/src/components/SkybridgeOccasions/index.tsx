"use client";

import React, { useState } from "react";

const SkybridgeOccasions: React.FC = () => {
  const [tableData, setTableData] = useState([
    {
      name: "Sample Name",
      type: "Scholarship",
      status: "Approved",
      date: "March 1st, 2025",
    },
  ]);
  return (
    <div className="container py-8">
      <div
        className="mb-12 rounded-sm bg-white px-8 py-11 shadow-three dark:bg-gray-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]"
        data-wow-delay=".15s"
      >
        <div className="grid grid-cols-8 gap-4">
          <div className="col-span-7">
            <h3 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl">
              All Occasions
            </h3>
          </div>
          <div>
            <button className="bg-primary p-4 text-white">New Occasion</button>
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:bg-gray-dark">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider">
                Creation Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tableData.map((row, index) => (
              <tr key={index}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  {row.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <button className="inline-flex items-center justify-center rounded-sm bg-gray-light px-4 py-2 text-sm text-black duration-300 hover:text-white dark:bg-[#2C303B] dark:text-white dark:hover:bg-primary">
                    {row.type}
                  </button>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <button className="inline-flex items-center justify-center rounded-sm bg-gray-light bg-green-500 px-4 py-2 text-sm text-black duration-300">
                    {row.status}
                  </button>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {row.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SkybridgeOccasions;
