"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Breadcrumb from "../Common/Breadcrumb";
import { useSession } from "next-auth/react";

const SkybridgeOccasions: React.FC = () => {
  const { data: session, status } = useSession();
  const [accountType, setAccountType] = useState("");
  const [tableData, setTableData] = useState([
    {
      id: "23453647534",
      name: "Sample Name",
      type: "Scholarship",
      status: "Approved",
      date: "March 1st, 2025",
    },
  ]);

  useEffect(() => {
    console.log(session);
    if (session) {
      setAccountType(
        session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1),
      );
    }
    if(accountType == "Sponsorer"){
      
    } else if(accountType === "Fundraiser"){

    }
  }, [session, status]);

  return (
    <>
      <Breadcrumb
        pageName="Skybridge Dashboard"
        description={`You're using a ${accountType} account`}
      />
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
              <Link
                href={`/${accountType.toLowerCase()}/new`}
                className="bg-primary p-4 text-white"
              >
                New Occasion
              </Link>
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:bg-gray-dark">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index}>
                  <td className="font-medium">{row.name}</td>
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
                  <td>{row.date}</td>
                  <td>
                    <Link href={`/fundraiser/${row.id}`}>More</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default SkybridgeOccasions;
