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
              <th>
                Name
              </th>
              <th >
                Type
              </th>
              <th >
                Status
              </th>
              <th >
                Creation Date
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                <td className="font-medium">
                  {row.name}
                </td>
                <td>
                  <button className="bg-gray-light text-black hover:text-white dark:bg-[#2C303B] dark:text-white dark:hover:bg-primary">
                    {row.type}
                  </button>
                </td>
                <td>
                  <button className="bg-green-500 text-black">
                    {row.status}
                  </button>
                </td>
                <td>
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
