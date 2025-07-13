import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";

// Add Razorpay type declaration for TypeScript
// @ts-ignore
// interface Window { Razorpay: any; }
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Sample flashcards and MCQs
const sampleFlashcards = [
  {
    question: "What is the powerhouse of the cell?",
    answer: "The mitochondria.",
  },
  {
    question: "What is the capital of France?",
    answer: "Paris.",
  },
  {
    question: "What is the chemical symbol for water?",
    answer: "H₂O.",
  },
];

const sampleMCQs = [
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    answer: "Mars",
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: [
      "Charles Dickens",
      "William Shakespeare",
      "Jane Austen",
      "Mark Twain",
    ],
    answer: "William Shakespeare",
  },
];

const flashcardGradients = [
  "from-indigo-500 via-blue-500 to-indigo-400",
  "from-blue-600 via-indigo-500 to-blue-400",
  "from-indigo-600 via-blue-400 to-indigo-300",
];

function handlePay(amount: number, planName: string, onSuccess?: () => void) {
  const options = {
    key: "rzp_test_D6x46mYuNkPCGt", // Your Razorpay LIVE Key ID
    amount: amount * 100, // Amount in paise
    currency: "INR",
    name: "Study App",
    description: `Upgrade to ${planName}`,
    handler: function (response: any) {
      alert(`Payment successful! You now have ${planName} access.`);
      if (onSuccess) onSuccess();
    },
    prefill: {
      email: "",
    },
    theme: { color: "#6366f1" },
    method: {
      upi: true,
      card: true,
      netbanking: true,
    },
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
}

const modalContent = (
  setModal: React.Dispatch<
    React.SetStateAction<
      "privacy" | "terms" | "contact" | "pricing" | "login" | null
    >
  >,
  dark: boolean
) => ({
  privacy: {
    title: "Privacy Policy",
    body: (
      <>
        <p className="mb-2 font-semibold">Your privacy is important to us.</p>
        <ul className="list-disc pl-5 space-y-1 text-left">
          <li>We do not sell your data to third parties.</li>
          <li>All study content is private to your account.</li>
          <li>
            Uploaded files are securely stored and can be deleted at any time.
          </li>
          <li>
            We use cookies only for authentication and session management.
          </li>
        </ul>
      </>
    ),
  },
  terms: {
    title: "Terms of Service",
    body: (
      <>
        <p className="mb-2 font-semibold">
          By using Study AI Generator, you agree to:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-left">
          <li>Use the service for educational purposes only.</li>
          <li>
            Not upload or generate harmful, illegal, or inappropriate content.
          </li>
          <li>Respect copyright and intellectual property rights.</li>
          <li>
            We reserve the right to suspend accounts for abuse or violations.
          </li>
        </ul>
      </>
    ),
  },
  contact: {
    title: "Contact Us",
    body: (
      <>
        <p className="mb-2 font-semibold">We'd love to hear from you!</p>
        <ul className="list-disc pl-5 space-y-1 text-left">
          <li>
            Email:{" "}
            <a
              href="mailto:support@studyai.com"
              className="underline text-indigo-600"
            >
              support@studyai.com
            </a>
          </li>
          <li>
            Twitter:{" "}
            <a
              href="https://twitter.com/studyaiofficial"
              className="underline text-indigo-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              @studyaiofficial
            </a>
          </li>
        </ul>
      </>
    ),
  },
  pricing: {
    title: "Pricing",
    body: (
      <>
        <h3 className="text-lg font-bold mb-2">Choose Your Plan</h3>
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900 p-4 flex flex-col">
            <span className="font-bold text-indigo-700 dark:text-indigo-300">
              Free
            </span>
            <span className="text-2xl font-extrabold">$0</span>
            <span className="text-sm text-blue-900 dark:text-blue-200">
              Basic flashcards, MCQs, and notes. Limited generations.
            </span>
            <button
              className="mt-3 bg-gray-200 text-gray-500 px-4 py-2 rounded-lg font-semibold cursor-not-allowed opacity-60"
              disabled
            >
              Current Plan
            </button>
          </div>
          <div className="rounded-xl border-2 border-indigo-400 bg-indigo-50 dark:bg-indigo-900 p-4 flex flex-col scale-105">
            <span className="font-bold text-indigo-800 dark:text-indigo-200">
              Pro
            </span>
            <span className="text-2xl font-extrabold">
              $15<span className="text-base font-normal">/mo</span>
            </span>
            <span className="text-sm text-blue-900 dark:text-blue-200">
              Unlimited generations, advanced features, priority support.
            </span>
            <button
              className="mt-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:from-indigo-700 hover:to-blue-700 transition"
              onClick={() => handlePay(1500, "Pro", () => setModal("pricing"))}
            >
              Buy Pro
            </button>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900 p-4 flex flex-col">
            <span className="font-bold text-indigo-700 dark:text-indigo-300">
              Premium
            </span>
            <span className="text-2xl font-extrabold">
              $40<span className="text-base font-normal">/mo</span>
            </span>
            <span className="text-sm text-blue-900 dark:text-blue-200">
              All Pro features, export, early access, dedicated support.
            </span>
            <button
              className="mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:from-blue-700 hover:to-indigo-700 transition"
              onClick={() =>
                handlePay(4000, "Premium", () => setModal("pricing"))
              }
            >
              Buy Premium
            </button>
          </div>
        </div>
      </>
    ),
  },
  login: {
    title: "Login",
    body: (
      <>
        <h3 className="text-lg font-bold mb-2">Login</h3>
        <p className="text-blue-900 dark:text-blue-200 mb-2">
          (Demo only) Login functionality is available in the main app.
        </p>
        <input
          className="w-full border border-blue-200 dark:border-blue-700 rounded px-3 py-2 mb-3 bg-white dark:bg-indigo-950 text-indigo-900 dark:text-white"
          placeholder="Email"
          disabled
        />
        <input
          className="w-full border border-blue-200 dark:border-blue-700 rounded px-3 py-2 mb-3 bg-white dark:bg-indigo-950 text-indigo-900 dark:text-white"
          placeholder="Password"
          type="password"
          disabled
        />
        <button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2 rounded-lg font-semibold shadow opacity-60 cursor-not-allowed">
          Login
        </button>
      </>
    ),
  },
});

export default function LandingPage() {
  const navigate = useNavigate();
  // Flashcard reveal state
  const [revealed, setRevealed] = useState([false, false, false]);
  // MCQ answer/feedback state
  const [mcqAnswers, setMcqAnswers] = useState<(string | null)[]>([null, null]);
  const [mcqFeedback, setMcqFeedback] = useState<(boolean | null)[]>([
    null,
    null,
  ]);
  // Modal state
  const [modal, setModal] = useState<
    "privacy" | "terms" | "contact" | "pricing" | "login" | null
  >(null);
  // Dark mode state
  const [dark, setDark] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

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
      copy[mcqIdx] = sampleMCQs[mcqIdx].answer === option;
      return copy;
    });
  };

  const modalData = modalContent(setModal, dark);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        dark
          ? "bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 text-white"
          : "bg-gradient-to-br from-indigo-100 via-blue-100 to-white text-indigo-900"
      }`}
    >
      {/* Navbar */}
      <nav
        className={`w-full z-20 py-4 px-6 flex items-center justify-between shadow-sm fixed top-0 left-0 right-0 transition-colors duration-300 ${
          dark
            ? "bg-indigo-950/90 border-b border-blue-900"
            : "bg-white/90 border-b border-blue-100"
        }`}
      >
        <div
          className="flex items-center gap-2 font-extrabold text-2xl font-serif cursor-pointer select-none"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span className="inline-block bg-gradient-to-br from-indigo-500 to-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl">
            📝
          </span>
          <span className="ml-2">StudyAI</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            className={`font-semibold px-4 py-2 rounded-lg transition ${
              dark
                ? "bg-indigo-900 text-white hover:bg-blue-900"
                : "bg-blue-50 text-indigo-900 hover:bg-blue-100"
            }`}
            onClick={() => setShowPricingModal(true)}
          >
            Pricing
          </button>
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className={`font-semibold px-4 py-2 rounded-lg transition ${
                  dark
                    ? "bg-indigo-900 text-white hover:bg-blue-900"
                    : "bg-blue-50 text-indigo-900 hover:bg-blue-100"
                }`}
              >
                Login
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <button
            className={`ml-2 flex items-center gap-1 px-3 py-2 rounded-lg font-semibold border transition ${
              dark
                ? "bg-indigo-900 border-blue-900 text-white hover:bg-blue-900"
                : "bg-white border-blue-200 text-indigo-900 hover:bg-blue-50"
            }`}
            onClick={() => setDark((d) => !d)}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {dark ? (
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1.5M12 19.5V21M4.219 4.219l1.061 1.061M17.657 17.657l1.06 1.06M3 12h1.5M19.5 12H21M4.219 19.781l1.061-1.061M17.657 6.343l1.06-1.06M12 7.5A4.5 4.5 0 1112 16.5a4.5 4.5 0 010-9z"
                  />
                </svg>
                Light
              </span>
            ) : (
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0112 21.75c-5.385 0-9.75-4.365-9.75-9.75 0-4.136 2.664-7.64 6.442-9.125a.75.75 0 01.908.37.75.75 0 01-.082.976A7.501 7.501 0 0012 19.5c2.485 0 4.69-1.21 6.232-3.09a.75.75 0 01.976-.082.75.75 0 01.37.908z"
                  />
                </svg>
                Dark
              </span>
            )}
          </button>
        </div>
      </nav>
      <div className="pt-28">
        {" "}
        {/* Offset for fixed navbar */}
        {/* Hero Section */}
        <div className="flex flex-col justify-center items-center px-4 z-10 pt-12 pb-12">
          <div
            className={`backdrop-blur-xl ${
              dark ? "bg-indigo-950/80" : "bg-white/80"
            } rounded-3xl shadow-2xl p-10 max-w-2xl w-full border border-white/40 relative animate-fade-in`}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full w-20 h-20 flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-4xl text-white">📝</span>
            </div>
            <h1
              className={`text-5xl font-extrabold mb-6 text-center tracking-tight font-serif mt-8 drop-shadow-lg ${
                dark ? "text-white" : "text-indigo-900"
              }`}
            >
              Study AI Generator
            </h1>
            <p
              className={`text-xl mb-8 text-center max-w-xl mx-auto font-sans ${
                dark ? "text-blue-200" : "text-blue-800"
              }`}
            >
              Instantly generate beautiful flashcards, MCQs, and study notes for
              any topic. Upload files, add media, and supercharge your learning
              with AI.
            </p>
            <div className="flex justify-center">
              <button
                className={`bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-10 py-4 rounded-xl text-2xl font-bold shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 animate-fade-in`}
                onClick={() => navigate("/app")}
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
        {/* Feature Section */}
        <div className="max-w-5xl mx-auto w-full px-4 mb-20">
          <h2
            className={`text-4xl font-extrabold text-center font-serif mb-12 mt-8 drop-shadow-lg ${
              dark ? "text-white" : "text-indigo-900"
            }`}
          >
            Study AI Generator
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Flashcard Feature */}
            <div
              className={`bg-gradient-to-br from-indigo-100 via-blue-50 to-white dark:from-indigo-900 dark:via-blue-950 dark:to-indigo-950 rounded-2xl shadow-xl p-8 flex flex-col items-center border ${
                dark ? "border-indigo-900" : "border-indigo-100"
              }`}
            >
              <div className="text-3xl mb-4">🃏</div>
              <h3
                className={`text-xl font-bold mb-2 ${
                  dark ? "text-indigo-200" : "text-indigo-700"
                }`}
              >
                Flashcard Generation
              </h3>
              <p
                className={`${
                  dark ? "text-blue-200" : "text-blue-900"
                } text-center`}
              >
                Automatically create beautiful, concise flashcards for any
                topic. Perfect for quick revision and spaced repetition
                learning.
              </p>
            </div>
            {/* MCQ Feature */}
            <div
              className={`bg-gradient-to-br from-blue-100 via-indigo-50 to-white dark:from-blue-900 dark:via-indigo-950 dark:to-blue-950 rounded-2xl shadow-xl p-8 flex flex-col items-center border ${
                dark ? "border-blue-900" : "border-blue-100"
              }`}
            >
              <div className="text-3xl mb-4">❓</div>
              <h3
                className={`text-xl font-bold mb-2 ${
                  dark ? "text-blue-200" : "text-blue-700"
                }`}
              >
                MCQ Generation
              </h3>
              <p
                className={`${
                  dark ? "text-blue-200" : "text-blue-900"
                } text-center`}
              >
                Generate high-quality multiple-choice questions with plausible
                options and instant feedback. Great for self-testing and exam
                prep.
              </p>
            </div>
            {/* Notes Feature */}
            <div
              className={`bg-gradient-to-br from-indigo-50 via-blue-50 to-white dark:from-indigo-950 dark:via-blue-950 dark:to-indigo-900 rounded-2xl shadow-xl p-8 flex flex-col items-center border ${
                dark ? "border-indigo-900" : "border-indigo-100"
              }`}
            >
              <div className="text-3xl mb-4">📝</div>
              <h3
                className={`text-xl font-bold mb-2 ${
                  dark ? "text-indigo-200" : "text-indigo-700"
                }`}
              >
                Short Notes & Key Terms
              </h3>
              <p
                className={`${
                  dark ? "text-blue-200" : "text-blue-900"
                } text-center`}
              >
                Get concise notes and a list of key terms for any subject.
                Perfect for last-minute revision and building strong
                foundations.
              </p>
            </div>
          </div>
        </div>
        {/* Demo Section: See Flashcards and MCQs in Action */}
        <div className="max-w-5xl mx-auto w-full px-4 mb-20">
          <h2
            className={`text-3xl font-extrabold text-center font-serif mb-10 mt-8 drop-shadow-lg ${
              dark ? "text-white" : "text-indigo-900"
            }`}
          >
            See Flashcards and MCQs in Action
          </h2>
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-10 w-full z-10 animate-fade-in">
            {/* Flashcards */}
            <div className="flex-1 flex flex-col items-center min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                {sampleFlashcards.map((card, i) => (
                  <div
                    key={i}
                    className={`relative border border-[#e0e0e0] dark:border-blue-900 rounded-xl shadow-lg p-0 cursor-pointer transition-transform transform hover:scale-[1.03] flex flex-col justify-center items-center text-center select-none group perspective min-h-[180px] bg-gradient-to-br ${
                      flashcardGradients[i % flashcardGradients.length]
                    } text-white`}
                    onClick={() => handleReveal(i)}
                  >
                    <div
                      className={`w-full h-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d] ${
                        revealed[i] ? "rotate-y-180" : ""
                      }`}
                    >
                      {!revealed[i] ? (
                        <div className="flex flex-col justify-center items-center px-4 py-6 backface-hidden">
                          <div className="font-semibold text-base text-white/80 mb-2 font-sans">
                            Flashcard {i + 1}
                          </div>
                          <div
                            className="text-white text-lg font-medium font-sans transition-all duration-200 w-full break-words whitespace-pre-line p-1 flex items-center justify-center"
                            style={{ wordBreak: "break-word" }}
                          >
                            {card.question}
                          </div>
                          <div className="mt-4 text-xs text-white/70 group-hover:text-white transition">
                            Click to reveal answer
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center items-center px-4 py-6 backface-hidden rotate-y-180">
                          <div className="font-semibold text-base text-white/80 mb-2 font-sans">
                            Flashcard {i + 1}
                          </div>
                          <div
                            className="text-white font-bold text-lg font-sans w-full break-words whitespace-pre-line p-1 flex items-center justify-center"
                            style={{ wordBreak: "break-word" }}
                          >
                            {card.answer}
                          </div>
                          <div className="mt-4 text-xs text-white/70 group-hover:text-white transition">
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
            {/* MCQs */}
            <div className="flex-1 flex flex-col items-center min-w-0">
              <div className="grid grid-cols-1 gap-6 w-full">
                {sampleMCQs.map((mcq, i) => (
                  <div
                    key={i}
                    className={`bg-white/90 dark:bg-indigo-950 border border-[#e0e0e0] dark:border-blue-900 rounded-xl shadow-sm p-6 mb-2`}
                  >
                    <div
                      className={`font-semibold text-lg mb-2 font-sans ${
                        dark ? "text-blue-200" : "text-indigo-800"
                      }`}
                    >
                      Q{i + 1}: {mcq.question}
                    </div>
                    <div className="flex flex-col gap-2">
                      {mcq.options.map((opt, j) => (
                        <button
                          key={j}
                          className={`px-4 py-2 rounded-lg border text-base font-medium transition-all font-sans
                          ${
                            mcqAnswers[i] === opt
                              ? mcqFeedback[i] == null
                                ? dark
                                  ? "bg-blue-900 border-blue-700 text-white"
                                  : "bg-blue-100 border-blue-400 text-indigo-900"
                                : mcqFeedback[i]
                                ? dark
                                  ? "bg-blue-800 border-blue-400 text-white"
                                  : "bg-blue-200 border-blue-600 text-blue-900"
                                : "bg-red-100 border-red-400 text-red-700"
                              : dark
                              ? "bg-indigo-950 border-blue-900 hover:bg-blue-950"
                              : "bg-white border-[#e0e0e0] hover:bg-blue-50"
                          }
                        `}
                          disabled={mcqFeedback[i] != null}
                          onClick={() => handleMcqSelect(i, opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {mcqFeedback[i] != null && (
                      <div
                        className={`mt-2 text-sm font-semibold font-sans ${
                          mcqFeedback[i]
                            ? dark
                              ? "text-blue-300"
                              : "text-blue-700"
                            : "text-red-700"
                        }`}
                      >
                        {mcqFeedback[i]
                          ? "Correct!"
                          : `Incorrect. Answer: ${mcq.answer}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <footer
          className={`border-t py-8 px-4 text-center text-base font-sans shadow-inner z-10 animate-fade-in transition-colors duration-300 ${
            dark
              ? "bg-indigo-950/90 border-blue-900 text-blue-200"
              : "bg-white/90 border-blue-100 text-indigo-900"
          }`}
        >
          <div className="mb-2 font-semibold tracking-wide">
            &copy; {new Date().getFullYear()} Study AI Generator. All rights
            reserved.
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <button
              className="underline hover:text-blue-700 transition"
              onClick={() => setModal("privacy")}
            >
              Privacy Policy
            </button>
            <button
              className="underline hover:text-blue-700 transition"
              onClick={() => setModal("terms")}
            >
              Terms of Service
            </button>
            <button
              className="underline hover:text-blue-700 transition"
              onClick={() => setModal("contact")}
            >
              Contact
            </button>
          </div>
        </footer>
      </div>
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
          <div
            className={`rounded-2xl shadow-2xl p-8 w-full max-w-md relative ${
              dark ? "bg-indigo-950 text-white" : "bg-white text-indigo-900"
            }`}
          >
            <button
              onClick={() => setModal(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-black text-2xl"
            >
              &times;
            </button>
            <h2
              className={`text-2xl font-bold mb-4 text-center font-serif ${
                dark ? "text-white" : "text-indigo-900"
              }`}
            >
              {modalData[modal]?.title}
            </h2>
            <div className="text-base text-left">{modalData[modal]?.body}</div>
          </div>
        </div>
      )}
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
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-800 transition mt-auto opacity-60 cursor-not-allowed"
                  disabled
                >
                  Free Active
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
                  onClick={() =>
                    handlePay(1500, "Pro", () => setShowPricingModal(false))
                  }
                >
                  Buy Pro
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
                  onClick={() =>
                    handlePay(4000, "Premium", () => setShowPricingModal(false))
                  }
                >
                  Buy Premium
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in { animation: fade-in 1.2s cubic-bezier(0.4,0,0.2,1) both; }
      `}</style>
    </div>
  );
}
