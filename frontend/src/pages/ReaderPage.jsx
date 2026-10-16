import React, { useState, useEffect } from "react";
import { getCachedStoryById } from "../services/indexedDB";

export default function ReaderPage({ storyId, language, onBack }) {
  const [story, setStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    // Attempt local/cached lookup
    getCachedStoryById(storyId).then((data) => {
      if (data) setStory(data);
    });
  }, [storyId]);

  if (!story) {
    return <div className="p-10 text-center text-xl">Loading Story...</div>;
  }

  const page = story.pages[currentPage];
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === story.pages.length - 1;

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col justify-between select-none p-4">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm mb-2">
        <button
          onClick={onBack}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-xl text-lg"
        >
          ⬅ {language === "kn" ? "ಹಿಂದಕ್ಕೆ" : "Back"}
        </button>
        <span className="text-lg font-bold text-gray-600">
          {currentPage + 1} / {story.pages.length}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center gap-6">
        <img
          src={page.image_url}
          alt="Page illustration"
          className="w-full md:w-1/2 h-64 md:h-96 object-cover rounded-2xl"
        />
        <div className="w-full md:w-1/2 flex flex-col justify-between h-full">
          <p className="text-2xl md:text-3xl font-medium leading-relaxed text-gray-800">
            {language === "kn" ? page.text_kn : page.text_en}
          </p>

          <button className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-bold py-3 px-6 rounded-2xl shadow flex items-center space-x-2 self-start">
            <span>🔊 {language === "kn" ? "ಪ್ಲೇ ಮಾಡಿ" : "Listen"}</span>
          </button>
        </div>
      </div>

      {/* Large Navigation Controls */}
      <div className="flex justify-between items-center mt-4 gap-4">
        <button
          disabled={isFirstPage}
          onClick={() => setCurrentPage((p) => p - 1)}
          className={`flex-1 py-4 text-2xl font-bold rounded-2xl shadow transition ${
            isFirstPage
              ? "bg-gray-200 text-gray-400"
              : "bg-amber-500 text-white hover:bg-amber-600"
          }`}
        >
          ⬅ {language === "kn" ? "ಹಿಂದಿನ ಪುಟ" : "Previous"}
        </button>

        <button
          onClick={() => (isLastPage ? onBack() : setCurrentPage((p) => p + 1))}
          className="flex-1 py-4 text-2xl font-bold rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shadow transition"
        >
          {isLastPage
            ? language === "kn"
              ? "ಮುಗಿಯಿತು 🎉"
              : "Finish 🎉"
            : language === "kn"
              ? "ಮುಂದಿನ ಪುಟ ➡"
              : "Next ➡"}
        </button>
      </div>
    </div>
  );
}
