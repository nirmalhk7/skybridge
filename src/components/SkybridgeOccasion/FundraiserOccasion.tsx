"use client";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { GetCountries, GetState } from "react-country-state-city";

const FundraiserOccasion: React.FC<{ viewOnly?: boolean }> = ({ viewOnly = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    typePreference: "scholarships",
    countryPreference: "",
    statePreference: "",
    agePreference: "10-19",
    message: "",
  });

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

  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [stateList, setStateList] = useState<any[]>([]);

  // Load countries on mount
  useEffect(() => {
    GetCountries().then((result: any[]) => {
      setCountriesList(result);
      setFormData((prev) => {
        const isValid = result.some(
          (country) => String(country.id) === prev.countryPreference,
        );
        return isValid || result.length === 0
          ? prev
          : { ...prev, countryPreference: String(result[0].id) };
      });
    });
  }, []);

  // Load states when countryPreference changes
  useEffect(() => {
    if (formData.countryPreference) {
      GetState(Number(formData.countryPreference)).then((result: any[]) => {
        setStateList(result);
        setFormData((prev) => {
          const isValid = result.some(
            (stateInfo) => String(stateInfo.id) === prev.statePreference,
          );
          return isValid || result.length === 0
            ? prev
            : { ...prev, statePreference: String(result[0].id) };
        });
      });
    }
  }, [formData.countryPreference]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchAndStoreGptResponse = async (
    occasionId: string,
    occasionMessage: string,
  ) => {
    try {
      const response = await fetch("/api/gptHandler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: occasionMessage }),
      });
      const data = await response.json();
      console.log("Fetched GPT response data:", data);
      if (response.ok) {
        const gptNumber = Number(data.score);
        const addScorePayload = {
          userId: session?.user?.id,
          occasionId,
          score: gptNumber,
        };
        const scoreResponse = await fetch("/api/addScore", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(addScorePayload),
        });
        if (!scoreResponse.ok) {
          const errorData = await scoreResponse.json();
          console.error("Error storing score:", errorData.error);
        }
      } else {
        console.error("Error fetching GPT response:", data.error);
      }
    } catch (error) {
      console.error("Error in fetchAndStoreGptResponse:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = session?.user?.id;
    if (!userId) {
      alert("Please sign in before creating an opportunity.");
      return;
    }

    const occasionMessage = formData.message;

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

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        alert("Occasion added successfully!");
        setFormData({
          name: "",
          email: "",
          typePreference: "scholarships",
          countryPreference: formData.countryPreference,
          statePreference: formData.statePreference,
          agePreference: "10-19",
          message: "",
        });
        if (data.occasionId) {
          fetchAndStoreGptResponse(data.occasionId, occasionMessage);
        }
      } else {
        alert(`Error: ${data.error || data.message || "Unable to add opportunity"}`);
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
                {/* Organization Name */}
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="name"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Your Organization&apos;s Name
                    </label>
                    <input
                      id="name"
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
                {/* Organization Email */}
                <div className="w-full px-4 md:w-1/2">
                  <div className="mb-8">
                    <label
                      htmlFor="email"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Your Organization Email
                    </label>
                    <input
                      id="email"
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
                {/* Type Preference */}
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
                {/* Country Preference */}
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
                {/* State Preference */}
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
                {/* Age Preference */}
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
                {/* Message */}
                <div className="w-full px-4">
                  <div className="mb-8">
                    <label
                      htmlFor="message"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Your Message
                    </label>
                    <textarea
                      id="message"
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
