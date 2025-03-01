"use client";
import React, { useState } from "react";
import { CountrySelect, StateSelect } from "react-country-state-city";

const SponsorerOccasion: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    typePreference: "scholarships",
    countryPreference: "usa",
    statePreference: "california",
    agePreference: "10-20",
    message: "",
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
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
                    <CountrySelect
                      containerClassName="bg-[#f8f8f8]"
                      inputClassName="bg-[#f8f8f8]"
                      onChange={(_country) => handleChange(e)}
                      onTextChange={(_txt) => console.log(_txt)}
                      placeHolder="Select Country"
                    />
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
                    <StateSelect
                      countryid={formData.countryPreference?.id}
                      containerClassName="form-group"
                      inputClassName=""
                      onChange={(_state) => handleChange(_state)}
                      onTextChange={(_txt) => console.log(_txt)}
                      placeHolder="Select State"
                    />
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
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
                <div className="w-full px-4">
                  <button className="rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark">
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorerOccasion;
