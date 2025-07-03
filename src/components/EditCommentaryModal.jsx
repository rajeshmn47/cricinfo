import React from "react";
import Filters from "./Filters";
import { URL, VIDEO_URL } from "@/constants/userConstants";

export default function EditCommentaryModal({
  open,
  onClose,
  onSave,
  inputCommentary,
  setInputCommentary,
  filterValues,
  handleFilterChange,
  clips,
  filteredClips,
  clipsLoading,
  newVideoLink,
  setNewVideoLink,
  searchTerm,
  setSearchTerm,    
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl overflow-y-scroll h-full">
        <h3 className="text-lg font-bold mb-4">Edit Video Link</h3>

        {inputCommentary?.commentary && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentary Text</label>
            <textarea
              className="border border-gray-300 rounded px-3 py-2 w-full"
              value={inputCommentary?.commentary}
              onChange={(e) => setInputCommentary({ ...inputCommentary, commentary: e.target.value })}
              rows={3}
            />
          </div>
        )}
        <div className="flex flex-col gap-2 mb-4">
          <Filters values={filterValues} onChange={handleFilterChange} clips={clips} />
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2"
            value={newVideoLink}
            onChange={(e) => setNewVideoLink(e.target.value)}
            placeholder="Enter new video link"
          />
          <div>
            <span className="block text-xs text-gray-500 mb-1">
              Or select from available clips ({filteredClips?.length}):
            </span>
            <input
                type="text"
                className="border border-gray-300 rounded px-3 py-2 mb-2 w-full"
                placeholder="Search by commentary..."
                value={searchTerm|| ""}
                onChange={e => setSearchTerm(e.target.value )}
            />
            {clipsLoading ? (
              <span className="text-gray-400 text-sm">Loading clips...</span>
            ) : (
              <div className="max-h-40 overflow-y-auto flex flex-col gap-2">
                {filteredClips.length === 0 ? (
                  <span className="text-gray-400 text-sm">No clips available.</span>
                ) : (
                  filteredClips.map(clip => (
                    <label key={clip._id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="clip-radio"
                        value={clip.clip}
                        checked={newVideoLink === clip.clip}
                        onChange={() => setNewVideoLink(clip.clip)}
                      />
                      <span className="flex items-center gap-2">
                        <span className="text-sm" title={clip.commentary}>
                          {clip.commentary}
                        </span>
                        {clip.clip && (
                          <video
                            className="w-24 h-12 rounded shadow"
                            controls
                            muted
                            style={{ minWidth: "6rem" }}
                          >
                            <source src={`${VIDEO_URL}/mockvideos/${clip.clip}`} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
            style={{ whiteSpace: 'nowrap' }}
            onClick={onSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 whitespace-nowrap"
            style={{ whiteSpace: 'nowrap' }}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}