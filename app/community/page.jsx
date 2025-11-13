"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import GalleryLayout from "../../components/GalleryLayout";
import { useRouter } from "next/navigation";

export default function CommunityImages() {
  const [images, setImages] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const router = useRouter();

  const fetchImages = async (pageNumber = 1) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setPageLoading(true);
    try {
      const res = await axios.get(
        `https://sineva-backend.vercel.app/api/image/getallimages?page=${pageNumber}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setImages(res.data.data || []);
        setPage(res.data.pagination.page || 1);
        setTotalPages(res.data.pagination.totalPages || 1);
      } else {
        console.error("Failed to fetch images:", res.data.message);
      }
    } catch (err) {
      console.error("API Error:", err);
      alert("Failed to fetch images. Make sure you are logged in.");
    } finally {
      setPageLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages(page);
  }, [page]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const extractUrlFromPrompt = (prompt) => {
    if (!prompt) return null;
    const match = prompt.match(/(https?:\/\/\S+)/);
    return match ? match[0] : null;
  };

  const removeUrlFromPrompt = (prompt) => {
    if (!prompt) return "";
    return prompt.replace(/https?:\/\/\S+/i, "").trim();
  };

  const downloadImage = (url) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "image.png";
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch((err) => console.error("Download failed:", err));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading images...
      </div>
    );

  return (
    <GalleryLayout onLogout={handleLogout}>
      <h2 className="text-white text-2xl mb-6">Community Images</h2>

      {images.length === 0 ? (
        <p className="text-gray-400">No images found.</p>
      ) : (
        <>
          {pageLoading && (
            <div className="text-white text-center mb-4">Loading page...</div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img) => (
              <div
                key={img._id}
                className="cursor-pointer"
                onClick={() => setModal(img)}
              >
                <img
                  src={img.imageUrl}
                  alt={img.prompt || "Generated image"}
                  className="w-full h-40 sm:h-36 md:h-40 lg:h-44 object-cover rounded-lg"
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-6 text-white">
            <button
              onClick={handlePrevPage}
              disabled={page === 1 || pageLoading}
              className="bg-gray-700 px-3 py-1 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm sm:text-base">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page === totalPages || pageLoading}
              className="bg-gray-700 px-3 py-1 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Fullscreen Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-70 p-4 sm:p-6"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-gray-900 rounded-xl shadow-xl flex flex-col sm:flex-row max-w-5xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Full-size image */}
            <div className="relative flex-shrink-0 w-full sm:w-2/3 bg-black flex items-center justify-center p-4">
              <img
                src={modal.imageUrl}
                alt={modal.prompt || "Generated image"}
                className="max-h-[60vh] sm:max-h-[80vh] object-contain rounded-xl sm:rounded-l-xl"
              />
              {/* Download Button */}
              <button
                onClick={() => downloadImage(modal.imageUrl)}
                className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 p-2 rounded-full text-white"
                title="Download Image"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                  />
                </svg>
              </button>
            </div>

            {/* Right: Prompt */}
            <div className="w-full sm:w-1/3 p-4 flex flex-col justify-start">
              <h3 className="text-white text-lg mb-2">Prompt:</h3>
              <p className="text-gray-200 mb-4 break-words text-sm sm:text-base">
                {extractUrlFromPrompt(modal.prompt)
                  ? removeUrlFromPrompt(modal.prompt)
                  : modal.prompt}
              </p>

              {/* If prompt contains URL, show small reference image */}
              {extractUrlFromPrompt(modal.prompt) && (
                <div className="mt-2">
                  <h4 className="text-white text-sm mb-1">Referenced Image:</h4>
                  <img
                    src={extractUrlFromPrompt(modal.prompt)}
                    alt="Prompt reference"
                    className="w-full h-32 sm:h-40 object-contain rounded-lg border border-gray-600"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </GalleryLayout>
  );
}
