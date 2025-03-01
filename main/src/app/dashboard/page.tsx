import AboutSectionOne from "@/components/About/AboutSectionOne";
import AboutSectionTwo from "@/components/About/AboutSectionTwo";
import Breadcrumb from "@/components/Common/Breadcrumb";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Welcome to Skybridge",
  // other metadata
};

const AboutPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="Skybridge Dashboard"
        description="You're using a Fundraiser account"
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
              <button className="bg-primary text-white p-4">New Occasion</button>
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:bg-gray-dark">
            <thead className="">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider">
                  Creation Date
                </th>
              </tr>
            </thead>
            <tbody className=" divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sample Name</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sample Type</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sample Status</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sample Date</td>
              </tr>
              {/* More rows here */}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
