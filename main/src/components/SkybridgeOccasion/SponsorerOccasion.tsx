"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  CountrySelect,
  GetCountries,
  GetState,
  StateSelect,
} from "react-country-state-city";

const SponsorerOccasion: React.FC<{ viewOnly?: boolean }> = ({
  viewOnly = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    typePreference: "scholarships",
    countryPreference: "233",
    statePreference: "1450",
    agePreference: "10-20",
    message: "",
  });

  const [searchResults, setSearchResults] = useState([]);

  const { data: session, status } = useSession();
  useEffect(() => {
    if (session) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name,
        email: session.user.email,
      }));
    }
  }, [session, status]);

  const [countriesList, setCountriesList] = useState([]);
  const [stateList, setStateList] = useState([]);

  // Load countries on mount
  useEffect(() => {
    GetCountries().then((result) => {
      setCountriesList(result);
      if (result.length > 0 && !formData.countryPreference) {
        setFormData((prev) => ({
          ...prev,
          countryPreference: result[0].id.toString(),
        }));
      }
    });
  }, []);

  // Load states when countryPreference changes
  useEffect(() => {
    if (formData.countryPreference) {
      GetState(Number(formData.countryPreference)).then((result) => {
        setStateList(result);
        if (result.length > 0 && !formData.statePreference) {
          setFormData((prev) => ({
            ...prev,
            statePreference: result[0].id.toString(),
          }));
        }
      });
    }
  }, [formData.countryPreference]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleApproval = (e, occasionId) => {
    e.preventDefault();
    const raw = JSON.stringify({
      occasionId: occasionId,
      occasionData: {
        status: "Approved",
        sponsorerId: session.user.id,
      },
    });

    fetch("/api/updateOccasion", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: raw,
    })
      .then((response) => response.json())
      .then((result) => {
        alert(
          `Congratulations! You are matched with a user. Please contact them at ${result.email}`,
        );
        handleSubmit(e); // Call handleSubmit again
      })
      .catch((error) => console.error("Error updating occasion:", error));
  };

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams({
        agePreference: formData.agePreference,
        countryPreference: formData.countryPreference,
        statePreference: formData.statePreference,
        typePreference: formData.typePreference,
    });

    fetch(`http://localhost:3000/api/searchOccasion?${searchParams.toString()}`)
        .then((response) => response.json())
        .then((data) => {
        if (Array.isArray(data)) {
            setSearchResults(data);
        } else {
            console.error("Expected an array but received:", data);
            setSearchResults([]);
        }
        })
        .catch((error) => {
        console.error("Error fetching search results:", error);
        });
    };

  return (
    <div className="container">
      <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div
            className="mb-12 rounded-sm bg-white px-8 py-11 shadow-three dark:bg-gray-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]"
            data-wow-delay=".15s"
          >
            <form onSubmit={handleSubmit}>
              <div className="-mx-4 flex flex-wrap">
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="name"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Your Organization&apos;s Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your name"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.name}
                      disabled={viewOnly}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="email"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Your Organization Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.email}
                      disabled={viewOnly}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="type-preference"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Type Preference
                    </label>
                    <select
                      id="type-preference"
                      name="typePreference"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.typePreference}
                      disabled={viewOnly}
                      onChange={handleChange}
                    >
                      <option value="scholarships">Scholarships</option>
                      <option value="events">Events</option>
                      <option value="research-groups">Research Groups</option>
                    </select>
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="country-preference"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Country Preference
                    </label>
                    <select
                      id="country-preference"
                      name="countryPreference"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.countryPreference}
                      disabled={viewOnly}
                      onChange={handleChange}
                    >
                      {countriesList.map((countryInfo) => (
                        <option key={countryInfo.id} value={countryInfo.id}>
                          {countryInfo.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="state-preference"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      State Preference
                    </label>
                    <select
                      id="state-preference"
                      name="statePreference"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.statePreference}
                      disabled={viewOnly}
                      onChange={handleChange}
                    >
                      {stateList.map((stateInfo) => (
                        <option key={stateInfo.id} value={stateInfo.id}>
                          {stateInfo.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="age-preference"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Age Preference
                    </label>
                    <select
                      id="age-preference"
                      name="agePreference"
                      className="border-stroke bg-[#f8f8f8] focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:border-primary"
                      value={formData.agePreference}
                      disabled={viewOnly}
                      onChange={handleChange}
                    >
                      {Array.from({ length: 7 }, (_, i) => {
                        const start = i * 10 + 10;
                        const end = start + 9;
                        return (
                          <option key={i} value={`${start}-${end}`}>
                            {`${start}-${end}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="w-full px-4">
                  <button className="rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark">
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
       <div className="flex flex-wrap">
        <div className="w-full px-4">
          <div
            className="mb-12 rounded-sm bg-white px-8 py-11 shadow-three dark:bg-gray-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]"
            data-wow-delay=".15s"
          >
            <h3>Search Results</h3>
            <table className="min-w-full divide-y divide-gray-200 dark:bg-gray-dark">
              <thead>
                <tr>
                  <th>userid</th>
                  <th>message</th>
                  <th>score</th>
                  <th>status</th>
                </tr>
              </thead>
            <tbody>
            {Array.isArray(searchResults) && searchResults.length > 0 ? (
                searchResults.map((row, index) => (
                <tr key={index}>
                    <td>
                    <button className="bg-gray-light text-black hover:text-white dark:bg-[#2C303B] dark:text-white dark:hover:bg-primary">
                        {row.userId}
                    </button>
                    </td>
                    <td>{row.occasion.message}</td>
                    <td>{row.occasion.score}</td>
                    <td>
                    <button
                        onClick={(e) => handleApproval(e, row.occasion.id)}
                        className="bg-white text-black"
                    >
                        {row.occasion.status === "Searching" ? "Approve?" : "Approved"}
                    </button>
                    </td>
                </tr>
                ))
            ) : (
                <tr>
                <td colSpan={4}>No search results found.</td>
                </tr>
            )}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorerOccasion;
