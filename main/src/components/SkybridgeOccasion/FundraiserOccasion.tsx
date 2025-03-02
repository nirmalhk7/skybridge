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
    agePreference: "10-20",
    message: "",
  });

  const { data: session, status } = useSession();
  
  useEffect((()=>{
    if(session){
      setFormData((prev)=>({
        ...prev,
        name: session.user.name,
        email: session.user.email
      }))
    }
  }),[session, status]);

  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [stateList, setStateList] = useState<any[]>([]);

  // State for GPT response and modal visibility
  const [gptResponse, setGptResponse] = useState("");
  const [showModal, setShowModal] = useState(false);

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
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Function to fetch GPT response without streaming
  const fetchGptResponse = async (occasionMessage: string) => {
    try {
      const encodedMessage = encodeURIComponent(occasionMessage);
      const response = await fetch(`/api/gptHandler?message=${encodedMessage}`);
      const data = await response.json();
      console.log("Fetched GPT response data:", data);
      if (response.ok) {
        setGptResponse(data.gptResponse);
      } else {
        console.error("Error fetching GPT response:", data.error);
        setGptResponse("Error fetching GPT response");
      }
    } catch (error) {
      console.error("Error fetching GPT response:", error);
      setGptResponse("Error fetching GPT response");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = session.user.id;
    if (!userId) {
      alert("User not logged in");
      return;
    }

    // Capture the message before resetting the form
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

        // Initialize GPT response state and display modal
        setGptResponse("");
        setShowModal(true);
        console.log("Modal shown. Starting GPT response fetch.");
        fetchGptResponse(occasionMessage);
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
                {/* Organization Name */}
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
      {/* Modal for displaying OpenAI response */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-11/12 max-w-lg">
            <h2 className="text-xl font-bold mb-4">OpenAI Response</h2>
            <div className="mb-4 whitespace-pre-wrap" style={{ color: 'black' }}>
              {gptResponse || "Loading..."}
            </div>
            <button
              className="bg-primary text-white px-4 py-2 rounded"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundraiserOccasion;
