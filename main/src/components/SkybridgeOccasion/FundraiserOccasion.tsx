"use client";
import React, { useEffect, useState } from "react";
import { GetCountries, GetState } from "react-country-state-city";

const FundraiserOccasion: React.FC<{ viewOnly?: boolean }> = ({
  viewOnly = false,
}) => {
  // Retrieve the user ID from localStorage (which should be stored upon signup)
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    typePreference: "scholarships",
    countryPreference: "",
    statePreference: "",
    agePreference: "10-20",
    message: "",
  });

  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [stateList, setStateList] = useState<any[]>([]);

  // Load countries on mount
  useEffect(() => {
    GetCountries().then((result) => {
      setCountriesList(result);
      if (result.length > 0 && !formData.countryPreference) {
        setFormData((prev) => ({ ...prev, countryPreference: result[0].id.toString() }));
      }
    });
  }, []);

  // Load states when countryPreference changes
  useEffect(() => {
    if (formData.countryPreference) {
      GetState(Number(formData.countryPreference)).then((result) => {
        setStateList(result);
        if (result.length > 0 && !formData.statePreference) {
          setFormData((prev) => ({ ...prev, statePreference: result[0].id.toString() }));
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!userId) {
    alert("User not logged in");
    return;
  }

  const payload = {
    userId,
    occasionData: formData,
  };

  try {
    const response = await fetch("/api/addOccasion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert("Occasion added successfully!");
      setFormData({
        name: "",
        email: "",
        typePreference: "scholarships",
        countryPreference: formData.countryPreference,
        statePreference: formData.statePreference,
        agePreference: "10-20",
        message: "",
      });
    } else {
      const data = await response.json();
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error("Submission error:", error);
    alert("Failed to submit the occasion");
  }
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
                      Your Organization's Name
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
                  <div className="mb-8">
                    <label
                      htmlFor="message"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Your Message
                    </label>
                    <textarea
                      name="message"
                      rows={5}
                      placeholder="Enter your Message"
                      className="border-stroke w-full resize-none rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                      value={formData.message}
                      disabled={viewOnly}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
                {!viewOnly ? (
                  <div className="w-full px-4">
                    <button className="rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark">
                      Submit
                    </button>
                  </div>
                ) : (
                  <h4 className="mb-3 text-center text-lg font-bold text-black dark:text-white sm:text-lg">
                    Updates
                  </h4>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundraiserOccasion;
