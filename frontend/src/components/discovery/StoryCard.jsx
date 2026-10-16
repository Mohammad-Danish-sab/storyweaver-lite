import React from "react";

export default function StoryCard({ story, language, onSelect }) {
  return (
    <div
      onClick={() => onSelect(story.id)}
      className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer border-4 border-amber-200 flex flex-col justify-between"
    >
      <div>
        <img
          src={story.cover_image}
          alt={story.title_en}
          className="h-48 w-full object-cover"
        />
        <div className="p-4">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
            🌱 Level {story.level}
          </span>
          <h2 className="text-2xl font-bold text-gray-800 mt-2 line-clamp-2">
            {language === "kn" ? story.title_kn : story.title_en}
          </h2>
        </div>
      </div>

      <div className="p-4 pt-0">
        <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl text-lg shadow transition flex items-center justify-center space-x-2">
          <span>{language === "kn" ? "ಓದಿರಿ" : "Read Now"}</span>
          <span>📖</span>
        </button>
      </div>
    </div>
  );
}
