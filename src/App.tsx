import React, { useState, useRef, useEffect } from "react";
import { generateStudyContent, StudyResult, Flashcard, MCQ } from "./gemini";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";

const initialState: StudyResult = {
  overview: "",
  keyTerms: [],
  flashcards: [],
  mcqs: [],
  notes: [],
};

interface UploadedFile {
  file: File;
  url: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  // Extract video ID from various YouTube URL formats
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

async function fetchUserPlan(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("user_plans")
    .select("plan")
    .eq("user_id", userId)
    .single();
  if (error) return "Free";
  return data?.plan || "Free";
}

export default function App() {
  const [topic, setTopic] = useState("");
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [mcqCount, setMcqCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyResult>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [mcqAnswers, setMcqAnswers] = useState<(string | null)[]>([]);
  const [mcqFeedback, setMcqFeedback] = useState<(boolean | null)[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [mediaFiles, setMediaFiles] = useState<UploadedFile[]>([]);
  const [ytUrl, setYtUrl] = useState("");
  const [ytEmbed, setYtEmbed] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  // Flashcard navigation state
  const [activeCard, setActiveCard] = useState<number>(0);

  const { user, isLoaded, isSignedIn } = useUser();
  const [anonGenCount, setAnonGenCount] = useState(() => {
    const stored = localStorage.getItem("anonGenCount");
    return stored ? parseInt(stored) : 0;
  });
  const FREE_LIMIT = 3;
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("Free");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [studySessions, setStudySessions] = useState<any[]>([]);

  // On mount, check for user session
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchUserPlan(user?.id || "").then(setUserPlan);
    }
  }, [isLoaded, isSignedIn, user]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!avatarDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      const dropdown = document.getElementById("avatar-dropdown");
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setAvatarDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [avatarDropdownOpen]);

  // Update anonGenCount in localStorage
  useEffect(() => {
    localStorage.setItem("anonGenCount", anonGenCount.toString());
  }, [anonGenCount]);

  // Use userPlan to restrict features
  // Example: restrict generation for Free users
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      alert("Please sign in to generate study content.");
      return;
    }
    if (userPlan === "Free" && anonGenCount >= FREE_LIMIT) {
      alert("Upgrade to Pro or Premium to generate more study content.");
      return;
    }
    setLoading(true);
    setError(null);
    setRevealed([]);
    setMcqAnswers([]);
    setMcqFeedback([]);
    setActiveCard(0);
    try {
      const data: StudyResult = await generateStudyContent(
        topic,
        flashcardCount,
        mcqCount
      );
      setResult(data);
      setRevealed(Array(data.flashcards.length).fill(false));
      setMcqAnswers(Array(data.mcqs.length).fill(null));
      setMcqFeedback(Array(data.mcqs.length).fill(null));
      await supabase.from("study_sessions").insert([
        {
          user_id: user?.id,
          user_email: user?.primaryEmailAddress?.emailAddress,
          topic,
          result: data,
        },
      ]);
      if (userPlan === "Free") {
        setAnonGenCount((prev) => prev + 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate content.");
      setResult(initialState);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = (idx: number) => {
    setRevealed((prev) => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  const handleMcqSelect = (mcqIdx: number, option: string) => {
    setMcqAnswers((prev) => {
      const copy = [...prev];
      copy[mcqIdx] = option;
      return copy;
    });
    setMcqFeedback((prev) => {
      const copy = [...prev];
      copy[mcqIdx] = result.mcqs[mcqIdx].answer === option;
      return copy;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newFiles.push({ file, url });
    }
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveUploadedFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        newFiles.push({ file, url });
      }
    }
    setMediaFiles((prev) => [...prev, ...newFiles]);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const handleYtUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYtUrl(e.target.value);
  };
  const handleYtEmbed = () => {
    const embed = getYouTubeEmbedUrl(ytUrl);
    setYtEmbed(embed);
  };
  const handleRemoveYt = () => {
    setYtUrl("");
    setYtEmbed(null);
  };

  const handlePay = (amount: number, planName: string) => {
    const options = {
      key: "rzp_test_D6x46mYuNkPCGt", // Your Razorpay LIVE Key ID
      amount: amount * 100, // Amount in paise
      currency: "INR",
      name: "Study App",
      description: `Upgrade to ${planName}`,
      handler: function (response: any) {
        console.log("Razorpay handler called", response);
        localStorage.setItem("plan", planName);
        setUserPlan(planName);
        alert(`Payment successful! You now have ${planName} access.`);
      },
      prefill: {
        email: user?.primaryEmailAddress?.emailAddress || "",
      },
      theme: { color: "#6366f1" },
      method: {
        upi: true,
        card: true,
        netbanking: true,
      },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  useEffect(() => {
    setUserPlan(localStorage.getItem("plan") || "Free");
  }, []);

  // Fetch study sessions for the user
  useEffect(() => {
    if (!isSignedIn) {
      setStudySessions([]);
      return;
    }
    supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setStudySessions(data || []);
      });
  }, [user, showSaveModal, showHistoryModal, isSignedIn]);

  const renderUploadedFiles = () => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-3 text-black font-serif tracking-tight flex items-center gap-2">
        <span className="inline-block w-1.5 h-6 bg-[#ececec] rounded-full mr-2" />
        Uploaded Files
      </h2>
      <div className="flex flex-wrap gap-6 items-center">
        {uploadedFiles.map((uf, idx) => (
          <div key={idx} className="flex flex-col items-center">
            {uf.file.type.startsWith("image/") ? (
              <img
                src={uf.url}
                alt={uf.file.name}
                className="object-contain max-w-xs max-h-40 rounded-xl border border-[#ececec] shadow-sm"
              />
            ) : uf.file.type.startsWith("video/") ? (
              <video
                src={uf.url}
                controls
                className="object-contain max-w-xs max-h-40 rounded-xl border border-[#ececec] shadow-sm"
              />
            ) : (
              <a
                href={uf.url}
                download={uf.file.name}
                className="text-blue-600 underline text-sm"
              >
                {uf.file.name}
              </a>
            )}
            <button
              onClick={() => handleRemoveUploadedFile(idx)}
              className="mt-2 text-xs text-red-500 underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMediaFiles = () => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-3 text-black font-serif tracking-tight flex items-center gap-2">
        <span className="inline-block w-1.5 h-6 bg-[#ececec] rounded-full mr-2" />
        Topic Media
      </h2>
      <div className="flex flex-wrap gap-6">
        {mediaFiles.map((uf, i) => {
          if (uf.file.type.startsWith("image/")) {
            return (
              <div
                key={i}
                className="w-40 h-40 bg-[#faf9f6] border border-[#ececec] rounded-xl shadow-sm flex items-center justify-center overflow-hidden"
              >
                <img
                  src={uf.url}
                  alt={uf.file.name}
                  className="object-contain max-w-full max-h-full"
                />
              </div>
            );
          } else if (uf.file.type.startsWith("video/")) {
            return (
              <div
                key={i}
                className="w-40 h-40 bg-[#faf9f6] border border-[#ececec] rounded-xl shadow-sm flex items-center justify-center overflow-hidden"
              >
                <video
                  src={uf.url}
                  controls
                  className="object-contain max-w-full max-h-full"
                />
              </div>
            );
          } else {
            return null;
          }
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-white text-indigo-900 py-6 px-1 sm:px-4 md:px-8 font-sans transition-colors duration-300">
      {/* Clerk Auth Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-end items-center gap-4 px-2">
        {!isLoaded ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-black text-white px-4 py-1 rounded-lg font-semibold hover:bg-[#222] transition">
                  Login
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-2">
                <button
                  className="mr-2 px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700 border border-gray-300 align-middle focus:outline-none hover:bg-gray-300 transition"
                  onClick={() => setShowPricingModal(true)}
                  title="View or upgrade your plan"
                >
                  {userPlan || "Free"}
                </button>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <button
              onClick={() => setShowPricingModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-lg font-semibold shadow hover:from-indigo-600 hover:to-purple-600 transition"
            >
              Pricing
            </button>
          </>
        )}
      </div>
      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-black text-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative">
            <button
              onClick={() => setShowPricingModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
            >
              &times;
            </button>
            <h2 className="text-3xl font-bold mb-8 text-center font-serif">
              Choose Your Plan
            </h2>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch">
              {/* Free Plan */}
              <div className="flex-1 bg-gray-900 rounded-xl p-6 border border-gray-700 shadow-sm flex flex-col items-center">
                <h3 className="text-xl font-bold mb-2 text-indigo-300">Free</h3>
                <div className="text-3xl font-extrabold mb-2">$0</div>
                <ul className="text-gray-200 text-sm mb-4 space-y-2 text-left">
                  <li>✔️ 3 generations (flashcards/MCQs)</li>
                  <li>✔️ Basic flashcards & MCQs</li>
                  <li>✔️ File upload</li>
                  <li>✔️ Limited media support</li>
                  <li>❌ Priority support</li>
                </ul>
                <button
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-800 transition mt-auto"
                  onClick={() => {
                    localStorage.setItem("plan", "Free");
                    setUserPlan("Free");
                    setShowPricingModal(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={userPlan === "Free"}
                >
                  {userPlan === "Free" ? "Free Active" : "Choose Free"}
                </button>
                <div className="mt-2 text-xs text-gray-400">
                  No card required
                </div>
              </div>
              {/* Pro Plan */}
              <div className="flex-1 bg-gray-950 rounded-xl p-6 border-2 border-indigo-500 shadow-lg flex flex-col items-center scale-105">
                <h3 className="text-xl font-bold mb-2 text-indigo-200">Pro</h3>
                <div className="text-3xl font-extrabold mb-2">
                  $15<span className="text-base font-normal">/mo</span>
                </div>
                <ul className="text-gray-200 text-sm mb-4 space-y-2 text-left">
                  <li>✔️ Unlimited generations</li>
                  <li>✔️ Advanced flashcards & MCQs</li>
                  <li>✔️ File & media upload</li>
                  <li>✔️ Priority support</li>
                  <li>❌ Early access features</li>
                </ul>
                <button
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-indigo-700 transition mt-auto"
                  onClick={() => handlePay(1500, "Pro")} // 1500 INR for Pro
                  disabled={userPlan === "Pro" || userPlan === "Premium"}
                >
                  {userPlan === "Pro" || userPlan === "Premium"
                    ? "Pro Unlocked"
                    : "Buy Pro"}
                </button>
              </div>
              {/* Premium Plan */}
              <div className="flex-1 bg-gray-900 rounded-xl p-6 border border-gray-700 shadow-sm flex flex-col items-center">
                <h3 className="text-xl font-bold mb-2 text-purple-200">
                  Premium
                </h3>
                <div className="text-3xl font-extrabold mb-2">
                  $40<span className="text-base font-normal">/mo</span>
                </div>
                <ul className="text-gray-200 text-sm mb-4 space-y-2 text-left">
                  <li>✔️ All Pro features</li>
                  <li>✔️ Export to PDF/CSV</li>
                  <li>✔️ Early access to new features</li>
                  <li>✔️ Dedicated support</li>
                </ul>
                <button
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition mt-auto"
                  onClick={() => handlePay(4000, "Premium")} // 4000 INR for Premium
                  disabled={userPlan === "Premium"}
                >
                  {userPlan === "Premium" ? "Premium Unlocked" : "Buy Premium"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Main App */}
      <div className="max-w-4xl mx-auto bg-white/90 rounded-3xl shadow-2xl p-2 sm:p-6 md:p-10 border border-blue-100 relative w-full">
        {/* My Study Sets Section */}
        {isSignedIn && (
          <div className="w-full max-w-xs sm:max-w-md md:max-w-lg bg-white/90 rounded-xl shadow p-4 mb-6 border border-blue-100 mx-auto">
            <h3 className="font-bold text-lg sm:text-xl mb-2 text-indigo-800">
              My Study Sets
            </h3>
            <ul>
              {studySessions.map((session) => (
                <li
                  key={session.id}
                  className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <button
                    className="text-indigo-700 underline text-left truncate"
                    onClick={() => {
                      setTopic(session.topic);
                      setResult(session.result);
                      setRevealed(
                        Array(session.result.flashcards.length).fill(false)
                      );
                      setMcqAnswers(
                        Array(session.result.mcqs.length).fill(null)
                      );
                      setMcqFeedback(
                        Array(session.result.mcqs.length).fill(null)
                      );
                    }}
                  >
                    {session.topic}{" "}
                    <span className="text-xs text-blue-400">
                      ({new Date(session.created_at).toLocaleString()})
                    </span>
                  </button>
                  <button
                    className="text-red-500 ml-0 sm:ml-2 hover:text-red-700 w-full sm:w-auto"
                    onClick={async () => {
                      await supabase
                        .from("study_sessions")
                        .delete()
                        .eq("id", session.id);
                      setStudySessions((prev) =>
                        prev.filter((s) => s.id !== session.id)
                      );
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <h1 className="text-4xl font-extrabold mb-8 text-center text-black tracking-tight font-serif">
          <span className="inline-block align-middle mr-2">📝</span>Study AI
          Generator
        </h1>
        <form
          onSubmit={handleGenerate}
          className="flex flex-col sm:flex-row gap-3 mb-10 justify-center"
        >
          <input
            className="flex-1 border border-[#e0e0e0] bg-[#faf9f6] rounded-lg px-4 py-2 text-lg focus:outline-none focus:border-[#b2b2b2] transition shadow-sm font-sans"
            type="text"
            placeholder="Enter a topic (e.g. Photosynthesis)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required={!uploadedFiles.length}
            disabled={loading}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#ececec] file:text-black hover:file:bg-[#e0e0e0]"
            onChange={handleFileUpload}
            disabled={loading}
            style={{ maxWidth: 220 }}
          />
          <button
            className="bg-black text-white px-6 py-2 rounded-lg text-lg font-semibold shadow hover:bg-[#222] transition disabled:opacity-50 font-sans"
            type="submit"
            disabled={
              loading ||
              (!topic && !uploadedFiles.length) ||
              flashcardCount < 1 ||
              flashcardCount > 20 ||
              mcqCount < 1 ||
              mcqCount > 20
            }
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner /> Generating...
              </span>
            ) : (
              "Generate"
            )}
          </button>
        </form>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center items-center">
          <label className="flex items-center gap-2 font-sans text-base">
            Flashcards:
            <button
              type="button"
              className="px-2 py-1 rounded border bg-[#ececec] text-lg font-bold"
              onClick={() => setFlashcardCount((c) => Math.max(1, c - 1))}
              disabled={loading || flashcardCount <= 1}
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={20}
              value={flashcardCount}
              onChange={(e) =>
                setFlashcardCount(
                  Math.max(1, Math.min(20, Number(e.target.value)))
                )
              }
              className="w-14 border border-[#e0e0e0] rounded px-2 py-1 text-center focus:outline-none focus:border-[#b2b2b2] mx-1"
              disabled={loading}
            />
            <button
              type="button"
              className="px-2 py-1 rounded border bg-[#ececec] text-lg font-bold"
              onClick={() => setFlashcardCount((c) => Math.min(20, c + 1))}
              disabled={loading || flashcardCount >= 20}
            >
              +
            </button>
          </label>
          <label className="flex items-center gap-2 font-sans text-base">
            MCQs:
            <button
              type="button"
              className="px-2 py-1 rounded border bg-[#ececec] text-lg font-bold"
              onClick={() => setMcqCount((c) => Math.max(1, c - 1))}
              disabled={loading || mcqCount <= 1}
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={20}
              value={mcqCount}
              onChange={(e) =>
                setMcqCount(Math.max(1, Math.min(20, Number(e.target.value))))
              }
              className="w-14 border border-[#e0e0e0] rounded px-2 py-1 text-center focus:outline-none focus:border-[#b2b2b2] mx-1"
              disabled={loading}
            />
            <button
              type="button"
              className="px-2 py-1 rounded border bg-[#ececec] text-lg font-bold"
              onClick={() => setMcqCount((c) => Math.min(20, c + 1))}
              disabled={loading || mcqCount >= 20}
            >
              +
            </button>
          </label>
        </div>
        {uploadedFiles.length > 0 && renderUploadedFiles()}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-6 text-center font-medium">
            {error}
          </div>
        )}
        {result.flashcards.length > 0 || result.mcqs.length > 0 ? (
          <>
            <div className="space-y-12">
              <Section title="Overview" content={result.overview} />
              <Divider />
              <Section title="Key Terms" content={result.keyTerms} isList />
              <Divider />
              <Section title="Short Notes" content={result.notes} isList />
              <Divider />
              <FlashcardGrid
                flashcards={result.flashcards}
                revealed={revealed}
                onReveal={handleReveal}
              />
              <Divider />
              <MCQGrid
                mcqs={result.mcqs}
                answers={mcqAnswers}
                feedback={mcqFeedback}
                onSelect={handleMcqSelect}
              />
            </div>
            <Divider />
            {/* Add Media Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-3 text-black font-serif tracking-tight flex items-center gap-2">
                <span className="inline-block w-1.5 h-6 bg-[#ececec] rounded-full mr-2" />
                Add Media to Help Understand This Topic
              </h2>
              <input
                ref={mediaInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#ececec] file:text-black hover:file:bg-[#e0e0e0]"
                onChange={handleMediaUpload}
              />
            </div>
            {mediaFiles.length > 0 && renderMediaFiles()}
            {/* YouTube Video Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-3 text-black font-serif tracking-tight flex items-center gap-2">
                <span className="inline-block w-1.5 h-6 bg-[#ececec] rounded-full mr-2" />
                Add a YouTube Video
              </h2>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  value={ytUrl}
                  onChange={handleYtUrlChange}
                  placeholder="Paste YouTube video URL"
                  className="flex-1 border border-[#e0e0e0] bg-[#faf9f6] rounded-lg px-4 py-2 text-lg focus:outline-none focus:border-[#b2b2b2] transition shadow-sm font-sans"
                />
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
                  onClick={handleYtEmbed}
                  type="button"
                  disabled={!ytUrl.trim()}
                >
                  Embed
                </button>
                {ytEmbed && (
                  <button
                    className="ml-2 text-xs text-red-500 underline"
                    onClick={handleRemoveYt}
                    type="button"
                  >
                    Remove
                  </button>
                )}
              </div>
              {ytEmbed && (
                <div className="w-full flex justify-center mt-4">
                  <iframe
                    width="400"
                    height="225"
                    src={ytEmbed}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-xl border border-[#ececec] shadow-sm"
                  ></iframe>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
      {/* After generation, show Save button at top right of results area */}
      {(result.flashcards.length > 0 || result.mcqs.length > 0) &&
        isSignedIn && (
          <button
            className="absolute top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-indigo-700 transition"
            onClick={() => setShowSaveModal(true)}
          >
            Save
          </button>
        )}
      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative">
            <button
              onClick={() => setShowSaveModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-black text-2xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">
              Save Study Set
            </h2>
            <input
              type="text"
              placeholder="Enter a name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
            />
            <button
              className={`bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold w-full transition ${
                !saveName.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-indigo-700"
              }`}
              disabled={!saveName.trim()}
              onClick={async () => {
                if (!saveName.trim() || !user) return;
                await supabase.from("study_sessions").insert([
                  {
                    user_id: user?.id,
                    user_email: user?.primaryEmailAddress?.emailAddress,
                    topic: saveName,
                    result,
                  },
                ]);
                setShowSaveModal(false);
                setSaveName("");
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  content,
  isList = false,
}: {
  title: string;
  content: string | string[];
  isList?: boolean;
}) {
  if (!content || (Array.isArray(content) && content.length === 0)) return null;
  return (
    <div className="mb-2">
      <h2 className="text-2xl font-bold mb-3 text-black font-serif tracking-tight flex items-center gap-2">
        <span className="inline-block w-1.5 h-6 bg-[#ececec] rounded-full mr-2" />
        {title}
      </h2>
      {isList ? (
        <ul className="list-disc pl-6 space-y-1 text-lg text-[#222]">
          {(content as string[]).map((item, i) => (
            <li key={i} className="whitespace-pre-line">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="whitespace-pre-line text-lg text-[#222]">{content}</p>
      )}
    </div>
  );
}

function Divider() {
  return <div className="my-8 border-t border-[#ececec]" />;
}

function FlashcardGrid({
  flashcards,
  revealed,
  onReveal,
}: {
  flashcards: Flashcard[];
  revealed: boolean[];
  onReveal: (idx: number) => void;
}) {
  if (!flashcards || flashcards.length === 0) return null;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-black font-serif tracking-tight flex items-center gap-2">
        <span className="inline-block w-1.5 h-6 bg-[#ececec] rounded-full mr-2" />
        Flashcards
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {flashcards.map((card, i) => (
          <div
            key={i}
            className={`relative bg-[#faf9f6] border border-[#ececec] rounded-xl shadow-lg p-0 cursor-pointer transition-transform transform hover:scale-[1.03] flex flex-col justify-center items-center text-center select-none group perspective`}
            onClick={() => onReveal(i)}
            style={{ minHeight: 100 }}
          >
            <div
              className={`w-full h-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d] ${
                revealed[i] ? "rotate-y-180" : ""
              }`}
            >
              {/* Only one side is visible at a time, both in normal flow */}
              {!revealed[i] ? (
                <div className="flex flex-col justify-center items-center px-4 py-6 backface-hidden">
                  <div className="font-semibold text-base text-[#555] mb-2 font-sans">
                    Flashcard {i + 1}
                  </div>
                  <div
                    className="text-black text-lg font-medium font-sans transition-all duration-200 w-full break-words whitespace-pre-line p-1 flex items-center justify-center"
                    style={{ wordBreak: "break-word" }}
                  >
                    {card.question}
                  </div>
                  <div className="mt-4 text-xs text-gray-400 group-hover:text-black transition">
                    Click to reveal answer
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center px-4 py-6 backface-hidden rotate-y-180">
                  <div className="font-semibold text-base text-[#555] mb-2 font-sans">
                    Flashcard {i + 1}
                  </div>
                  <div
                    className="text-green-700 font-bold text-lg font-sans w-full break-words whitespace-pre-line p-1 flex items-center justify-center"
                    style={{ wordBreak: "break-word" }}
                  >
                    {card.answer}
                  </div>
                  <div className="mt-4 text-xs text-gray-400 group-hover:text-black transition">
                    Click to hide answer
                  </div>
                </div>
              )}
            </div>
            <style>{`
              .rotate-y-180 { transform: rotateY(180deg); }
              .perspective { perspective: 1200px; }
              .backface-hidden { backface-visibility: hidden; }
            `}</style>
          </div>
        ))}
      </div>
    </div>
  );
}

function MCQGrid({
  mcqs,
  answers,
  feedback,
  onSelect,
}: {
  mcqs: MCQ[];
  answers: (string | null)[];
  feedback: (boolean | null)[];
  onSelect: (mcqIdx: number, option: string) => void;
}) {
  if (!mcqs || mcqs.length === 0) return null;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-black font-serif tracking-tight flex items-center gap-2">
        <span className="inline-block w-1.5 h-6 bg-[#ececec] rounded-full mr-2" />
        MCQs
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {mcqs.map((mcq, i) => (
          <div
            key={i}
            className="bg-[#faf9f6] border border-[#ececec] rounded-xl shadow-sm p-6"
          >
            <div className="font-semibold text-lg text-[#555] mb-2 font-sans">
              Q{i + 1}: {mcq.question}
            </div>
            <div className="flex flex-col gap-2">
              {mcq.options.map((opt, j) => (
                <button
                  key={j}
                  className={`px-4 py-2 rounded-lg border text-base font-medium transition-all font-sans
                    ${
                      answers[i] === opt
                        ? feedback[i] == null
                          ? "bg-[#e6e6e6] border-[#b2b2b2]"
                          : feedback[i]
                          ? "bg-green-200 border-green-600 text-green-900"
                          : "bg-red-100 border-red-400 text-red-700"
                        : "bg-white border-[#ececec] hover:bg-[#f3f3f3]"
                    }
                  `}
                  disabled={feedback[i] != null}
                  onClick={() => onSelect(i, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {feedback[i] != null && (
              <div
                className={`mt-2 text-sm font-semibold font-sans ${
                  feedback[i] ? "text-green-700" : "text-red-700"
                }`}
              >
                {feedback[i] ? "Correct!" : `Incorrect. Answer: ${mcq.answer}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-black"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  );
}
