"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { AuthContext } from "../contexts/AuthContext";
import {
  ClipboardIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Page() {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [modalImage, setModalImage] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const busy = isUploading || isGenerating || loading;

  useEffect(() => {
    if (!authLoading && (!user || !token)) router.push("/login");
  }, [user, token, authLoading]);

  useEffect(() => {
    if (token) fetchChat();
  }, [token]);

  const fetchChat = async () => {
    try {
      const res = await axios.get("https://sineva-backend.vercel.app/api/image/getimage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChat(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching images:", err);
      setChat([]);
    }
  };

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsUploading(true);
    setLoading(true);
    setMessage("Uploading image...");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await axios.post(
        "https://sineva-backend.vercel.app/api/imageupload/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const uploadedUrl = res.data?.imageUrl;
      if (uploadedUrl) {
        setImageUrlInput(uploadedUrl);
        setMessage("Image uploaded! Ready to send with prompt.");
      } else {
        setMessage("Upload failed: no URL returned.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("Failed to upload image. Try again.");
    } finally {
      setIsUploading(false);
      setLoading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageUrlInput) {
      return setMessage("Please enter a prompt or provide an image URL.");
    }

    const userText = prompt;
    setPrompt("");
    setMessage("");

    setChat((prev) => [
      ...prev,
      { prompt: userText, imageUrl: imageUrlInput || null, loading: true },
    ]);
    scrollToBottom();

    setIsGenerating(true);
    setLoading(true);

    try {
      const formData = new FormData();
      if (prompt) formData.append("prompt", prompt);
      if (imageUrlInput) formData.append("imageUrl", imageUrlInput);

      const res = await axios.post(
        "https://sineva-backend.vercel.app/api/image/createimage",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const newImage = res.data?.data;

      setChat((prev) => {
        const newChat = [...prev];
        const lastIndex = newChat.map((m) => m.loading).lastIndexOf(true);
        if (lastIndex !== -1) {
          newChat[lastIndex] = {
            prompt: newImage?.prompt || userText,
            imageUrl: newImage?.imageUrl || "",
          };
        }
        return newChat;
      });

      setImageUrlInput("");
    } catch (err) {
      console.error("Error generating image:", err);
      setChat((prev) => prev.filter((m) => !m.loading));
      setMessage(err.response?.data?.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleEdit = (text) => setPrompt(text);
  const handleCopy = (text) => navigator.clipboard.writeText(text);
  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "generated-image.png";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Error downloading image:", err);
      setMessage("Failed to download image. Please try again.");
    }
  };

  const extractLeadingUrl = (promptString) => {
    if (!promptString) return { url: null, text: "" };
    const trimmed = promptString.trim();
    const match = trimmed.match(/^(https?:\/\/\S+)\s*(.*)$/i);
    if (match) return { url: match[1], text: (match[2] || "").trim() };
    return { url: null, text: trimmed };
  };

  if (authLoading)
    return <div className="p-6 text-gray-200">Checking authentication...</div>;

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Chat Container */}
      <div className="flex-1 flex bg-gray-900 justify-center items-center p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col w-full max-w-6xl h-full max-h-[90vh] glass rounded-2xl shadow-2xl overflow-hidden animate-scaleIn
                        sm:max-w-full sm:h-full sm:rounded-xl sm:shadow-xl">

          {/* Header */}
          <header className="p-4 text-center border-b border-gray-800 bg-black/70 backdrop-blur-xl">
            <h1 className="text-xl sm:text-lg font-semibold gradient-text">SINEVA GRAFICS</h1>
          </header>

          {/* Chat Area */}
          <main className="flex-1 custom-scrollbar overflow-y-auto px-4 sm:px-3 py-3 sm:py-2 flex flex-col gap-3">
            {chat.length === 0 && (
              <p className="text-gray-500 text-center mt-6 text-sm sm:text-xs">
                Start a conversation by typing a prompt or uploading an image.
              </p>
            )}

            {chat.map((item, index) => {
              const { url: oldImageUrl, text: promptText } = extractLeadingUrl(item.prompt);
              return (
                <div key={index} className="flex flex-col gap-2 animate-fadeIn">
                  {oldImageUrl && (
                    <div className="flex justify-end">
                      <img
                        src={oldImageUrl}
                        alt="Reference"
                        className="w-28 h-28 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-700 shadow-md"
                      />
                    </div>
                  )}

                  {promptText && (
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 rounded-2xl max-w-[70%] sm:max-w-[85%] text-sm break-words whitespace-normal shadow-lg">
                        {promptText}
                      </div>
                    </div>
                  )}

                  {promptText && (
                    <div className="flex justify-end gap-2 text-gray-400 text-xs sm:text-[10px]">
                      <button onClick={() => handleEdit(promptText)} title="Edit" className="hover:text-white">
                        <PencilIcon className="w-4 h-4 sm:w-3 sm:h-3" />
                      </button>
                      <button onClick={() => handleCopy(promptText)} title="Copy" className="hover:text-white">
                        <ClipboardIcon className="w-4 h-4 sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  )}

                  {item.loading ? (
                    <div className="flex justify-start mt-1">
                      <div className="bg-gray-800 p-2 rounded-2xl max-w-[70%] animate-pulse sm:max-w-[85%]">
                        <div className="w-36 h-36 sm:w-28 sm:h-28 bg-gray-700 rounded-lg"></div>
                      </div>
                    </div>
                  ) : item.imageUrl ? (
                    <div className="flex flex-col gap-2 mt-2 max-w-[70%] sm:max-w-[85%]">
                      <img
                        src={item.imageUrl}
                        alt="Generated"
                        className="rounded-xl w-52 h-52 sm:w-36 sm:h-36 object-cover cursor-pointer glow"
                        onClick={() => setModalImage(item.imageUrl)}
                      />
                      <div className="flex justify-start gap-3 mt-1">
                        <button
                          onClick={() => handleDownload(item.imageUrl)}
                          title="Download"
                          className="text-gray-400 hover:text-white btn-glow"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => setImageUrlInput(item.imageUrl)}
                          title="Use this image"
                          className="text-gray-400 hover:text-white btn-glow"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 sm:w-4 sm:h-4 rotate-45"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 19l9-7-9-7v4H3v6h9v4z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start mt-2 max-w-[70%] sm:max-w-[85%] bg-gray-800/70 p-2 rounded-2xl shadow text-sm text-gray-300">
                      Please provide more details to generate an image.
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef}></div>
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-800 bg-black/70 p-3 sm:p-2 backdrop-blur-xl">
            <div className="flex items-center gap-2 sm:gap-1">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                disabled={busy}
              />
              <button
                onClick={triggerFileSelect}
                disabled={busy}
                className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-300 btn-glow"
              >
                <ArrowUpTrayIcon className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <textarea
                placeholder="Type your description..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className={`flex-1 rounded-2xl px-3 py-2 text-white placeholder-gray-400 focus:outline-none
                  resize-none h-10 max-h-32 overflow-y-auto custom-scrollbar
                  bg-transparent backdrop-blur-md border border-gray-700/40 shadow-inner
                  hover:bg-black/20 transition-all duration-300
                  ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={busy}
              />
              <button
                onClick={handleGenerate}
                disabled={busy}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-medium btn-glow hover:opacity-90 text-sm sm:text-xs"
              >
                {isUploading ? "Uploading..." : isGenerating ? "Generating..." : "Send"}
              </button>
            </div>

            {imageUrlInput && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={imageUrlInput}
                  alt="preview"
                  className="w-14 h-14 sm:w-10 sm:h-10 rounded-md object-cover border border-gray-700"
                />
                <button
                  onClick={() => setImageUrlInput("")}
                  disabled={busy}
                  className="p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4 sm:w-3 sm:h-3" />
                </button>
              </div>
            )}

            {message && <p className="text-center text-red-400 mt-2 text-xs sm:text-[10px]">{message}</p>}
          </footer>
        </div>
      </div>

      {/* Modal */}
      {/* Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setModalImage(null)}
        >
          <img
            src={modalImage}
            alt="Large view"
            className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
          />

        </div>
      )}
    </div>
  );
}
