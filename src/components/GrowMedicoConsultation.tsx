"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const LOCAL_STORAGE_KEY = "growMedicoConsultationSubmissions";
const LOGO_SRC = "/gmlogo1.webp";
const POPUP_VIDEO_SRC = "/adss.mov";
const SUBMISSION_ENDPOINT = process.env.NEXT_PUBLIC_SUBMISSION_API_URL || "/api/submissions";

type Step =
  | "name"
  | "email"
  | "phone"
  | "professionalBackground"
  | "digitalExperience"
  | "mainStruggle"
  | "revenueMechanism"
  | "platformPriorities"
  | "ultimateGoal"
  | "investmentMindset"
  | "budgetFit"
  | "consultationDate"
  | "summary"
  | "done";

type FieldStep = Exclude<Step, "summary" | "done">;

interface FormData {
  name: string;
  email: string;
  phone: string;
  professionalBackground: string;
  digitalExperience: string;
  mainStruggle: string;
  revenueMechanism: string;
  platformPriorities: string;
  ultimateGoal: string;
  investmentMindset: string;
  budgetFit: string;
  consultationDate: string;
}

interface StoredSubmission extends FormData {
  submittedAt: string;
}

interface Message {
  id: number;
  type: "bot" | "user" | "notice";
  text: string;
  createdAt: number;
}

const formatRelativeTime = (createdAt: number, now: number) => {
  const seconds = Math.max(0, Math.floor((now - createdAt) / 1000));

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const OPTIONS: Partial<Record<Step, string[]>> = {
  professionalBackground: [
    "I run an established business / agency / clinic (Looking to scale)",
    "I am a freelancer / consultant / coach (Looking to get more clients)",
    "I am an executive / working professional (Looking to build my career profile)",
    "I am a creator / artist / individual looking to start a fresh personal brand",
  ],
  digitalExperience: [
    "I have never tried it before (Starting completely from scratch)",
    "I have tried posting a few times, but couldn't stay consistent",
    "I post regularly, but I'm not getting the business results or views I want",
    "I already have an active brand, but I want an agency to take it to the next level",
  ],
  mainStruggle: [
    "Time Limitations: I am too busy with my daily work to handle scripting, editing, and posting.",
    "Content Strategy: I don't know what to talk about to get business or how to structure videos.",
    "Technical Production: My current content looks amateur; I need professional/premium editing.",
    "Distribution: We make great content, but the algorithms are giving us zero distribution or leads.",
  ],
  revenueMechanism: [
    "High-Ticket Services or Retainers (Charging premium prices per client)",
    "Mid-Tier Products, Courses, Consulting, or One-time Projects",
    "Driving local footfalls / walk-ins to a physical location (Clinic, Office, Store)",
    "I don't have a clear product/service yet; I want to build an audience first",
  ],
  platformPriorities: [
    "Instagram & YouTube Shorts (Visual-heavy, rapid reach, authority scaling)",
    "YouTube Long-Form & Podcasts (Deep education, high-intent trust building)",
    "LinkedIn & X (Corporate decision-makers, high-ticket B2B clients, text-heavy authority)",
    "Omnichannel (I want to test multiple formats across all major platforms)",
  ],
  ultimateGoal: [
    "I want to get more high-paying clients, leads, or sales for my business.",
    "I want to build trust, authority, and become a recognized name in my industry.",
    "I want to overcome my hesitation, launch my profile, and build a base of real followers.",
    "I just want millions of random viral views as quickly as possible.",
  ],
  investmentMindset: [
    "I am ready to invest in a professional agency to get top-tier results.",
    "I have a budget, but I need to start with a smaller trial phase to see how it works first.",
    "I am currently just exploring information and looking for low-cost freelance options.",
  ],
  budgetFit: ["Yes", "No"],
};

const TIME_SLOTS = ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"];

const PROMPTS: Record<Exclude<Step, "summary" | "done">, string> = {
  name: "May we begin with your full name?",
  email: "And your email address?",
  phone: "Your phone number, please?",
  professionalBackground: "What is your current professional role or business model?",
  digitalExperience:
    "What is your current experience level with content creation and personal branding?",
  mainStruggle:
    "What has been the biggest challenge keeping you from starting or scaling your personal brand?",
  revenueMechanism:
    "How does your business currently monetize - or intend to monetize - your personal brand's audience?",
  platformPriorities: "Where do you want to dominate and build your primary digital presence?",
  ultimateGoal:
    "What is the primary result you want to achieve through your personal brand in the next 90 days?",
  investmentMindset:
    "Building a premium personal brand through a dedicated agency requires an investment in strategy and production. What is your approach to this project?",
  budgetFit: "Does an investment range of ₹80k to ₹1.5L match your budget?",
  consultationDate: "Please pick your preferred consultation date and time.",
};

const STEP_ORDER: Step[] = [
  "name",
  "email",
  "phone",
  "professionalBackground",
  "digitalExperience",
  "mainStruggle",
  "revenueMechanism",
  "platformPriorities",
  "ultimateGoal",
  "investmentMindset",
  "budgetFit",
  "consultationDate",
  "summary",
];

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const getPhoneDigits = (value: string) => value.replace(/\D/g, "");
const isValidPhone = (value: string) => getPhoneDigits(value).length === 10;
const createInitialMessages = (): Message[] => [
  { id: 1, type: "bot", text: PROMPTS.name, createdAt: Date.now() },
];
const shouldAskBudgetFit = (value: string) =>
  value === OPTIONS.investmentMindset?.[0] || value === OPTIONS.investmentMindset?.[1];

function saveSubmissionToLocalStorage(formData: FormData) {
  if (typeof window === "undefined") return;

  try {
    const existing = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    let submissions: StoredSubmission[] = [];

    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) submissions = parsed;
      } catch (error) {
        console.error("Unable to parse stored submissions, resetting storage:", error);
      }
    }

    submissions.push({ ...formData, submittedAt: new Date().toISOString() });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(submissions));
  } catch (error) {
    console.error("Failed to save submission to localStorage:", error);
  }
}

function buildConcernText(formData: FormData) {
  return [
    `Professional Background: ${formData.professionalBackground}`,
    `Digital Experience: ${formData.digitalExperience}`,
    `Main Struggle: ${formData.mainStruggle}`,
    `Revenue Mechanism: ${formData.revenueMechanism}`,
    `Platform Priorities: ${formData.platformPriorities}`,
    `Ultimate Goal: ${formData.ultimateGoal}`,
    `Investment Mindset: ${formData.investmentMindset}`,
    `Budget Fit: ${formData.budgetFit}`,
  ]
    .filter((line) => !line.endsWith(": "))
    .join("\n");
}

function buildSubmissionPayload(formData: FormData) {
  const pageUrl = typeof window === "undefined" ? "" : window.location.href;

  return {
    source: "Grow Medico Consultation",
    formName: "Grow Medico Consultation",
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    treatment: "Personal Branding Consultation",
    appointmentDateTime: formData.consultationDate,
    concern: buildConcernText(formData),
    condition: buildConcernText(formData),
    message: buildConcernText(formData),
    pageUrl,
    url: pageUrl,
    consent: true,
    professionalBackground: formData.professionalBackground,
    digitalExperience: formData.digitalExperience,
    mainStruggle: formData.mainStruggle,
    revenueMechanism: formData.revenueMechanism,
    platformPriorities: formData.platformPriorities,
    ultimateGoal: formData.ultimateGoal,
    investmentMindset: formData.investmentMindset,
    budgetFit: formData.budgetFit,
    consultationDate: formData.consultationDate,
  };
}

async function submitConsultation(formData: FormData) {
  const endpoint = SUBMISSION_ENDPOINT.trim();
  if (!endpoint) return;

  const isExternalEndpoint = /^https?:\/\//i.test(endpoint);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": isExternalEndpoint ? "text/plain;charset=utf-8" : "application/json",
    },
    body: JSON.stringify(buildSubmissionPayload(formData)),
    mode: isExternalEndpoint ? "no-cors" : "cors",
  });

  if (!isExternalEndpoint && !response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Submission failed");
  }
}

export function GrowMedicoConsultation() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("name");
  const [messages, setMessages] = useState<Message[]>(createInitialMessages);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingStep, setEditingStep] = useState<FieldStep | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [data, setData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    professionalBackground: "",
    digitalExperience: "",
    mainStruggle: "",
    revenueMechanism: "",
    platformPriorities: "",
    ultimateGoal: "",
    investmentMindset: "",
    budgetFit: "",
    consultationDate: "",
  });

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const idRef = useRef(1);

  const pushBot = (text: string) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      idRef.current++;
      setMessages((current) => [
        ...current,
        { id: idRef.current, type: "bot", text, createdAt: Date.now() },
      ]);
    }, 500);
  };

  const pushUser = (text: string) => {
    idRef.current++;
    setMessages((current) => [
      ...current,
      { id: idRef.current, type: "user", text, createdAt: Date.now() },
    ]);
  };

  const pushNotice = (text: string) => {
    idRef.current++;
    setMessages((current) => [
      ...current,
      { id: idRef.current, type: "notice", text, createdAt: Date.now() },
    ]);
  };

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, step]);

  useEffect(() => {
    if (!OPTIONS[step] && step !== "summary") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  const playVideo = () => {
    if (!videoRef.current) return;

    videoRef.current.muted = false;
    videoRef.current.defaultMuted = false;
    videoRef.current.volume = 1;
    videoRef.current.play().catch(() => {
      // Browser autoplay policies can block unmuted playback before user interaction.
    });
  };

  useEffect(() => {
    const playTimer = window.setTimeout(playVideo, 100);
    return () => window.clearTimeout(playTimer);
  }, []);

  const advance = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) return;

    if (step === "email" && !isValidEmail(value)) {
      pushUser(value);
      setTimeout(
        () =>
          pushNotice(
            "That email address looks incorrect. Please provide a valid email like name@example.com.",
          ),
        250,
      );
      return;
    }

    if (step === "phone" && !isValidPhone(trimmedValue)) {
      pushUser(trimmedValue);
      setTimeout(
        () => pushNotice("That phone number looks incorrect. Please enter exactly 10 digits."),
        250,
      );
      return;
    }

    pushUser(trimmedValue);

    if (editingStep === step) {
      setData((current) => ({ ...current, [step]: trimmedValue }));
      setEditingStep(null);
      setStep("summary");
      pushBot("Updated. Please review your consultation summary.");
      return;
    }

    if (step === "investmentMindset") {
      setData((current) => ({
        ...current,
        investmentMindset: trimmedValue,
        budgetFit: "",
        consultationDate: shouldAskBudgetFit(trimmedValue) ? current.consultationDate : "",
      }));

      if (shouldAskBudgetFit(trimmedValue)) {
        setStep("budgetFit");
        pushBot(PROMPTS.budgetFit);
      } else {
        setStep("summary");
        pushBot("Thanks for sharing. Please review your consultation summary.");
      }
      return;
    }

    if (step === "budgetFit") {
      const isBudgetMatch = trimmedValue.toLowerCase() === "yes";

      setData((current) => ({
        ...current,
        budgetFit: trimmedValue,
        consultationDate: isBudgetMatch ? current.consultationDate : "",
      }));

      if (isBudgetMatch) {
        setStep("consultationDate");
        pushBot(PROMPTS.consultationDate);
      } else {
        setStep("summary");
        pushBot("Thanks for sharing. Please review your consultation summary.");
      }
      return;
    }

    const next: Partial<Record<Step, Step>> = {
      name: "email",
      email: "phone",
      phone: "professionalBackground",
      professionalBackground: "digitalExperience",
      digitalExperience: "mainStruggle",
      mainStruggle: "revenueMechanism",
      revenueMechanism: "platformPriorities",
      platformPriorities: "ultimateGoal",
      ultimateGoal: "investmentMindset",
      consultationDate: "summary",
    };
    const nextStep = next[step];

    if (nextStep) {
      setData((current) => ({ ...current, [step]: trimmedValue }));
      setStep(nextStep);
      if (nextStep === "summary") {
        pushBot("A perfect brief. Please review your consultation summary.");
      } else {
        pushBot(PROMPTS[nextStep as Exclude<Step, "summary" | "done">]);
      }
    }
  };

  const finish = async (finalData: FormData) => {
    setSubmitting(true);
    saveSubmissionToLocalStorage(finalData);

    try {
      await submitConsultation(finalData);
      const firstName = finalData.name.split(" ")[0] || "";
      const searchParams = new URLSearchParams({ firstName, email: finalData.email });
      router.push(`/thank-you?${searchParams.toString()}`);
    } catch (error) {
      console.error("Failed to submit consultation:", error);
      pushNotice("We could not submit this right now. Please try again in a moment.");
      setSubmitting(false);
    }
  };

  const resetChat = () => {
    setStep("name");
    setMessages(createInitialMessages());
    idRef.current = 1;
    setInput("");
    setSelectedTime("");
    setSubmitting(false);
    setEditingStep(null);
    setNow(Date.now());
    setData({
      name: "",
      email: "",
      phone: "",
      professionalBackground: "",
      digitalExperience: "",
      mainStruggle: "",
      revenueMechanism: "",
      platformPriorities: "",
      ultimateGoal: "",
      investmentMindset: "",
      budgetFit: "",
      consultationDate: "",
    });
  };

  const editField = (field: FieldStep) => {
    const currentValue = data[field];
    setEditingStep(field);
    setStep(field);
    setTyping(false);

    if (field === "consultationDate") {
      const [date = "", time = ""] = currentValue.split(" at ");
      setInput(date);
      setSelectedTime(time);
    } else if (OPTIONS[field]) {
      setInput("");
      setSelectedTime("");
    } else {
      setInput(currentValue);
      setSelectedTime("");
    }

    pushNotice(`Editing ${PROMPTS[field]}`);
  };

  const summaryRows: Array<{ field: FieldStep; label: string; value: string }> = [
    { field: "name", label: "Name", value: data.name },
    { field: "email", label: "Email", value: data.email },
    { field: "phone", label: "Phone", value: data.phone },
    {
      field: "professionalBackground",
      label: "Professional Background",
      value: data.professionalBackground,
    },
    { field: "digitalExperience", label: "Digital Experience", value: data.digitalExperience },
    { field: "mainStruggle", label: "Main Struggle", value: data.mainStruggle },
    { field: "revenueMechanism", label: "Revenue Mechanism", value: data.revenueMechanism },
    { field: "platformPriorities", label: "Platform Priorities", value: data.platformPriorities },
    { field: "ultimateGoal", label: "Ultimate Goal", value: data.ultimateGoal },
    { field: "investmentMindset", label: "Investment Mindset", value: data.investmentMindset },
    { field: "budgetFit", label: "Budget Fit", value: data.budgetFit },
    { field: "consultationDate", label: "Preferred Slot", value: data.consultationDate },
  ];
  const currentStepIndex = Math.max(0, STEP_ORDER.indexOf(step));
  const completedStepCount = STEP_ORDER.filter(
    (stepName): stepName is FieldStep =>
      stepName !== "summary" && stepName !== "done" && Boolean(data[stepName]),
  ).length;
  const chapterNumber = String(Math.min(currentStepIndex + 1, STEP_ORDER.length)).padStart(2, "0");
  const totalChapters = String(STEP_ORDER.length).padStart(2, "0");
  const progressPercent = `${((currentStepIndex + 1) / STEP_ORDER.length) * 100}%`;
  const answeredProgressPercent = `${(completedStepCount / (STEP_ORDER.length - 1)) * 100}%`;
  const latestMessageId = messages[messages.length - 1]?.id;

  const botAvatar = (
    <div className="avatar">
      <img src={LOGO_SRC} alt="Grow Medico" />
    </div>
  );

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap');
    * { box-sizing: border-box; }
    .gold-page input,
    .gold-page button,
    .gold-page textarea,
    .gold-page select {
      font-family: 'Outfit', Arial, sans-serif;
    }
    .gold-page {
      position: fixed;
      inset: 0;
      height: 100dvh;
      width: 100%;
      background: #111111;
      color: #f2efe6;
      font-family: 'Outfit', Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      overflow: hidden;
    }
    .consultation-shell {
      width: 100vw;
      height: 100dvh;
      min-height: 0;
      display: grid;
      grid-template-columns: clamp(260px, 28vw, 420px) minmax(0, 1fr);
      gap: 0;
      align-items: stretch;
      background: #080b0b;
      border-top: 1px solid rgba(232,251,248,0.34);
      border-bottom: 1px solid rgba(232,251,248,0.28);
      box-shadow:
        inset 0 0 0 1px rgba(255,255,255,0.03),
        0 0 140px rgba(7,155,143,0.14);
    }
    .video-panel {
      position: relative;
      min-height: 0;
      overflow: hidden;
      background: #030607;
      border-right: none;
      padding: 28px 24px 24px;
      display: grid;
      grid-template-rows: auto 1fr auto;
      isolation: isolate;
    }
    .video-panel > * {
      position: relative;
      z-index: 2;
    }
    .video-panel video {
      display: block;
      position: absolute;
      inset: 0;
      z-index: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: #030607;
      border: none;
      filter: saturate(1.04) contrast(1.06);
      opacity: 0.82;
    }
    .video-panel::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      background:
        linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.46)),
        linear-gradient(90deg, rgba(2,10,10,0.08), rgba(2,10,10,0.3)),
        radial-gradient(circle at 32% 12%, rgba(232,251,248,0.2), transparent 34%);
      mix-blend-mode: multiply;
    }
    .video-panel::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      background:
        linear-gradient(90deg, transparent 0 70%, rgba(3,6,7,0.82) 100%),
        linear-gradient(180deg, rgba(3,6,7,0.05), transparent 42%, rgba(3,6,7,0.5));
    }
    @keyframes slowAura {
      0%, 100% { opacity: 0.35; transform: translate3d(-8%, -4%, 0) scale(1); }
      50% { opacity: 0.72; transform: translate3d(6%, 5%, 0) scale(1.08); }
    }
    .brand-panel {
      position: relative;
      padding: 14px;
      margin: -8px -8px 0;
    }
    .brand-panel::before {
      content: "";
      position: absolute;
      width: 180px;
      height: 180px;
      left: -70px;
      top: -70px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(7,155,143,0.28), transparent 66%);
      pointer-events: none;
      animation: slowAura 9s ease-in-out infinite;
    }
    .left-logo {
      width: min(178px, 78%);
      height: auto;
      display: block;
      margin: 0 0 18px;
      object-fit: contain;
      filter: drop-shadow(0 18px 36px rgba(0,0,0,0.5));
    }
    .brand-eyebrow,
    .left-services,
    .footer-line,
    .top-kicker,
    .chapter-label,
    .message-label,
    .send-btn,
    .refresh-btn,
    .time,
    .user-time {
      font-size: 10px;
      line-height: 1;
      letter-spacing: 0.58em;
      text-transform: uppercase;
      color: rgba(242,239,230,0.42);
    }
    .brand-eyebrow {
      margin-bottom: 12px;
      color: rgba(7,155,143,0.72);
    }
    .brand-name {
      margin: 0;
      color: #079b8f;
      font-family: 'Outfit', Arial, sans-serif;
      font-size: clamp(38px, 4.1vw, 64px);
      font-weight: 400;
      line-height: 0.9;
      letter-spacing: 0;
    }
    .brand-mark {
      display: block;
      width: 46px;
      height: 1px;
      margin-top: 24px;
      background: rgba(7,155,143,0.52);
      box-shadow: 0 0 22px rgba(7,155,143,0.34);
    }
    .brand-quote {
      align-self: center;
      margin: 0;
      max-width: 560px;
      color: rgba(232,251,248,0.78);
      font-family: 'Outfit', Arial, sans-serif;
      font-size: clamp(22px, 2vw, 31px);
      font-style: italic;
      line-height: 1.45;
      text-shadow: 0 18px 50px rgba(0,0,0,0.75);
      padding: 26px 0;
      border-left: 1px solid rgba(7,155,143,0.3);
      padding-left: 18px;
    }
    .brand-quote strong {
      color: #ffffff;
      font-weight: 400;
    }
    .house-row {
      display: flex;
      align-items: center;
      gap: 18px;
      color: rgba(242,239,230,0.46);
      font-size: 10px;
      letter-spacing: 0.58em;
      text-transform: uppercase;
      margin-bottom: 24px;
      text-shadow: 0 10px 28px rgba(0,0,0,0.68);
    }
    .house-row::before {
      content: "";
      width: 52px;
      height: 1px;
      background: rgba(7,155,143,0.38);
    }
    .left-divider {
      height: 1px;
      background: rgba(255,255,255,0.1);
      margin-bottom: 24px;
    }
    .left-services {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 28px;
      max-width: 460px;
      color: rgba(164,180,185,0.78);
    }
    .left-services span {
      display: block;
      margin-bottom: 12px;
    }
    .footer-line {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 20px;
      margin-top: 24px;
      letter-spacing: 0.42em;
    }
    .chat-card {
      width: 100%;
      height: 100%;
      min-height: 0;
      background:
        radial-gradient(circle at 14% 12%, rgba(7,155,143,0.16), transparent 30%),
        radial-gradient(circle at 80% 0%, rgba(232,251,248,0.07), transparent 24%),
        linear-gradient(135deg, #101615 0%, #090d0c 48%, #040606 100%);
      position: relative;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) 110px;
      overflow: hidden;
      border-left: 1px solid rgba(232,251,248,0.08);
    }
    .chat-card::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(90deg, rgba(7,155,143,0.13), transparent 11%, transparent 88%, rgba(242,239,230,0.025)),
        linear-gradient(180deg, rgba(255,255,255,0.024), transparent 18%, transparent 82%, rgba(0,0,0,0.18));
    }
    .chat-card .consultation-header::after {
      content: "";
      position: absolute;
      left: clamp(44px, 5vw, 82px);
      bottom: -1px;
      width: 148px;
      height: 1px;
      background: linear-gradient(90deg, #e8fbf8, #16c6b3 45%, transparent);
      box-shadow: 0 0 24px rgba(7,155,143,0.7);
    }
    .chat-card::after {
      content: "";
      position: absolute;
      inset: 146px auto 110px 0;
      width: 2px;
      height: auto;
      pointer-events: none;
      background:
        linear-gradient(180deg, transparent, rgba(7,155,143,0.62) 20%, rgba(232,251,248,0.42) 50%, rgba(7,155,143,0.34) 80%, transparent);
      filter: blur(0);
      opacity: 0.62;
    }
    .chat-card .consultation-header,
    .chat-card .chat-body-wrap,
    .chat-card .chat-input {
      margin-left: clamp(10px, 1.5vw, 24px);
      margin-right: clamp(10px, 1.5vw, 24px);
    }
    .consultation-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 170px;
      border-bottom: 1px solid rgba(232,251,248,0.075);
      background:
        linear-gradient(90deg, rgba(7,155,143,0.055), transparent 46%),
        linear-gradient(180deg, rgba(255,255,255,0.024), rgba(255,255,255,0.006));
      backdrop-filter: blur(18px);
      position: relative;
      z-index: 1;
    }
    .header-copy {
      padding: 44px clamp(44px, 5vw, 82px) 0;
      border-bottom: 1px solid rgba(232,251,248,0.06);
    }
    .top-kicker {
      margin-bottom: 14px;
      color: #ffffff;
      font-weight: 600;
      text-shadow: 0 0 22px rgba(7,155,143,0.34);
      width: fit-content;
      padding-bottom: 7px;
      border-bottom: 1px solid rgba(7,155,143,0.35);
    }
    .header-subtitle {
      margin: 0;
      color: rgba(164,180,185,0.82);
      font-family: 'Outfit', Arial, sans-serif;
      font-size: 16px;
      font-style: normal;
    }
    .header-subtitle::after {
      content: "";
      display: block;
      width: 50px;
      height: 1px;
      margin-top: 20px;
      background: linear-gradient(90deg, rgba(232,251,248,0.45), rgba(7,155,143,0.65));
    }
    .header-copy .message-label {
      margin-top: 24px;
      margin-bottom: 16px;
      letter-spacing: 0.42em;
    }
    .header-copy .row {
      margin-bottom: 0;
    }
    .header-copy .bubble {
      max-width: 760px;
      color: rgba(242,239,230,0.78);
      font-size: clamp(16px, 1.16vw, 20px);
      line-height: 1.42;
      text-shadow: none;
    }
    .chapter-block {
      padding: 44px 34px 0;
      border-left: 1px solid rgba(232,251,248,0.075);
      background:
        radial-gradient(circle at 40% 10%, rgba(232,251,248,0.08), transparent 42%),
        linear-gradient(180deg, rgba(7,155,143,0.075), transparent);
    }
    .chapter-label {
      margin-bottom: 20px;
    }
    .chapter-count {
      color: #f2efe6;
      font-family: 'Outfit', Arial, sans-serif;
      font-size: 28px;
      letter-spacing: 0.16em;
    }
    .chapter-count span {
      color: rgba(164,180,185,0.5);
      font-size: 18px;
    }
    .progress-track {
      position: absolute;
      top: 145px;
      left: 0;
      right: 0;
      height: 3px;
      background:
        repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 25%, rgba(255,255,255,0.02) 25% 25.2%);
    }
    .progress-track span {
      display: block;
      width: var(--progress);
      height: 100%;
      background: linear-gradient(90deg, #e8fbf8 0%, #16c6b3 45%, #079b8f 100%);
      box-shadow: 0 0 26px rgba(7,155,143,0.72);
      transition: width 0.35s ease;
    }
    .logo-crown,
    .logo-title,
    .logo-tagline,
    .logo-rule,
    .avatar,
    .time,
    .user-time {
      display: none;
    }
    .chat-body-wrap {
      position: relative;
      min-height: 0;
      padding: 42px clamp(44px, 5vw, 82px) 18px;
      overflow: hidden;
      z-index: 1;
    }
    .chat-body-wrap::before {
      display: none;
    }
    .chat-body-wrap::after {
      display: none;
    }
    .refresh-btn {
      position: absolute;
      right: clamp(44px, 5vw, 82px);
      bottom: 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      color: rgba(242,239,230,0.58);
      letter-spacing: 0.34em;
      z-index: 2;
      transition: color 0.18s ease;
    }
    .refresh-btn:hover {
      color: #16c6b3;
    }
    .chat-body {
      height: 100%;
      overflow: hidden;
      padding: 0 6px 18px 0;
      position: relative;
      z-index: 1;
      scrollbar-width: none;
      mask-image: none;
    }
    .chat-body::-webkit-scrollbar { display: none; }
    .chat-body::-webkit-scrollbar-thumb { background: transparent; }
    .chat-body::-webkit-scrollbar-track { background: transparent; }
    .row {
      display: block;
      margin: 0 0 28px;
      padding: 0;
    }
    .row.user {
      display: flex;
      justify-content: flex-end;
      margin: 0 0 34px;
    }
    .message-label {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
      color: rgba(242,239,230,0.34);
      position: relative;
      top: 0;
      width: fit-content;
      padding: 8px 0 10px;
      background: transparent;
      z-index: 2;
      letter-spacing: 0.72em;
    }
    .message-label::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #079b8f;
      box-shadow: 0 0 18px rgba(7,155,143,0.86);
    }
    .bubble,
    .option-bubble {
      width: min(100%, 920px);
      max-width: 980px;
      border: none;
      border-radius: 0;
      background: transparent;
      color: #079b8f;
      padding: 0;
      font-family: 'Outfit', Arial, sans-serif;
      font-size: clamp(24px, 1.86vw, 34px);
      line-height: 1.32;
      font-weight: 400;
      text-shadow: 0 0 26px rgba(7,155,143,0.15);
      animation: promptRise 0.45s ease both;
      max-width: min(1060px, 100%);
    }
    @keyframes promptRise {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .bubble strong {
      color: #f2efe6;
      font-weight: 400;
    }
    .chat-body > div:first-child .bubble {
      color: rgba(242,239,230,0.78);
      font-size: clamp(18px, 1.25vw, 22px);
      line-height: 1.42;
      max-width: 760px;
      margin-bottom: 20px;
    }
    .user-bubble {
      max-width: min(680px, 80%);
      border: 1px solid rgba(232,251,248,0.16);
      background:
        linear-gradient(135deg, rgba(7,155,143,0.18), rgba(255,255,255,0.04));
      color: #f2efe6;
      padding: 18px 22px;
      font-family: 'Outfit', Arial, sans-serif;
      font-size: 20px;
      line-height: 1.25;
      text-align: left;
      box-shadow:
        0 20px 70px rgba(0,0,0,0.24),
        inset 0 0 0 1px rgba(255,255,255,0.025);
      backdrop-filter: blur(12px);
    }
    .notice-row {
      display: flex;
      justify-content: center;
      margin: 0 0 28px;
      padding: 0;
    }
    .notice-bubble {
      max-width: 620px;
      border: 1px solid rgba(242,239,230,0.16);
      background: rgba(7,155,143,0.06);
      color: rgba(242,239,230,0.74);
      padding: 12px 16px;
      font-family: 'Outfit', Arial, sans-serif;
      font-size: 13px;
      letter-spacing: 0.12em;
      text-align: center;
    }
    .option-title {
      margin: 0 0 28px;
      color: #079b8f;
      font-family: 'Outfit', Arial, sans-serif;
      font-size: clamp(24px, 1.9vw, 34px);
      line-height: 1.25;
      font-weight: 400;
    }
    .choice-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: min(980px, 100%);
    }
    .choice-btn {
      border: 1px solid rgba(232,251,248,0.12);
      border-radius: 0;
      background:
        linear-gradient(90deg, rgba(7,155,143,0.08), transparent 54%),
        rgba(5,10,10,0.62);
      color: rgba(242,239,230,0.82);
      min-height: 56px;
      padding: 0 20px;
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      gap: 15px;
      font-family: 'Outfit', Arial, sans-serif;
      font-size: 13px;
      line-height: 1.25;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow:
        inset 3px 0 0 rgba(7,155,143,0.42),
        inset 0 0 0 1px rgba(255,255,255,0.012);
      position: relative;
      overflow: hidden;
      transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease, transform 0.18s ease;
      backdrop-filter: blur(10px);
    }
    .choice-btn::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(232,251,248,0.08), transparent);
      transform: translateX(-110%);
      transition: transform 0.42s ease;
      pointer-events: none;
    }
    .choice-btn::before {
      content: ">";
      color: #16c6b3;
      letter-spacing: 0;
      transform: translateY(-1px);
    }
    .choice-btn.active,
    .choice-btn:hover {
      border-color: rgba(7,155,143,0.68);
      color: #f2efe6;
      background:
        linear-gradient(90deg, rgba(7,155,143,0.18), rgba(232,251,248,0.035)),
        rgba(7,155,143,0.08);
      transform: translateX(6px);
      box-shadow:
        inset 0 0 0 1px rgba(232,251,248,0.04),
        0 18px 46px rgba(0,0,0,0.22),
        0 0 32px rgba(7,155,143,0.08);
    }
    .choice-btn:hover::after {
      transform: translateX(110%);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 28px;
    }
    .summary-item {
      border: 1px solid rgba(242,239,230,0.12);
      background: linear-gradient(135deg, rgba(255,255,255,0.045), rgba(7,155,143,0.035));
      padding: 13px 14px;
      min-width: 0;
      box-shadow: 0 18px 44px rgba(0,0,0,0.16);
    }
    .summary-item-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }
    .summary-item span {
      display: block;
      color: rgba(242,239,230,0.42);
      font-family: 'Outfit', Arial, sans-serif;
      font-size: 9px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
    }
    .edit-field-btn {
      border: none;
      background: transparent;
      color: #079b8f;
      padding: 0;
      font-family: 'Outfit', Arial, sans-serif;
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      cursor: pointer;
    }
    .summary-item p {
      margin: 0;
      color: rgba(242,239,230,0.84);
      font-family: 'Outfit', Arial, sans-serif;
      font-size: 13px;
      line-height: 1.35;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .review-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 24px;
    }
    .finish-btn {
      border: 1px solid rgba(7,155,143,0.62);
      border-radius: 0;
      background: rgba(7,155,143,0.08);
      color: #16c6b3;
      min-height: 48px;
      padding: 0 20px;
      font-family: 'Outfit', Arial, sans-serif;
      font-size: 11px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
      box-shadow: inset 0 0 0 1px rgba(232,251,248,0.03);
    }
    .finish-btn:hover {
      background: rgba(7,155,143,0.16);
      transform: translateY(-1px);
    }
    .finish-btn:disabled {
      opacity: 0.42;
      cursor: not-allowed;
    }
    .chat-input {
      padding: 10px clamp(44px, 5vw, 82px) 22px;
      background:
        linear-gradient(90deg, rgba(7,155,143,0.055), transparent 40%),
        linear-gradient(180deg, rgba(0,0,0,0.08), #040606);
      border-top: 1px solid rgba(232,251,248,0.07);
      display: flex;
      align-items: center;
      z-index: 1;
      box-shadow:
        0 -22px 70px rgba(0,0,0,0.34),
        inset 0 1px 0 rgba(7,155,143,0.08);
    }
    .answer-progress {
      display: none;
      width: 100%;
      height: 3px;
      margin-bottom: 12px;
      background: rgba(232,251,248,0.1);
      overflow: hidden;
    }
    .answer-progress span {
      display: block;
      width: var(--answered-progress);
      height: 100%;
      background: linear-gradient(90deg, #e8fbf8 0%, #16c6b3 48%, #079b8f 100%);
      box-shadow: 0 0 20px rgba(7,155,143,0.68);
      transition: width 0.35s ease;
    }
    .chat-input form {
      width: 100%;
    }
    .input-line {
      border: none;
      border-bottom: 1px solid rgba(232,251,248,0.16);
      background: transparent;
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr) auto;
      align-items: center;
      gap: 14px;
      min-height: 64px;
      padding: 0;
      transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      position: relative;
      box-shadow: none;
    }
    .input-line::after {
      content: "";
      position: absolute;
      left: 42px;
      right: 0;
      bottom: -1px;
      height: 1px;
      background: linear-gradient(90deg, rgba(22,198,179,0.8), transparent 54%);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.2s ease;
    }
    .input-line:focus-within {
      border-bottom-color: rgba(232,251,248,0.24);
      background: transparent;
      box-shadow:
        0 16px 46px rgba(7,155,143,0.045);
    }
    .input-line:focus-within::after {
      transform: scaleX(1);
    }
    .input-line::before {
      content: ">";
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(7,155,143,0.34);
      color: #16c6b3;
      font-size: 13px;
      line-height: 1;
      box-shadow: 0 0 18px rgba(7,155,143,0.1);
    }
    .answer-input {
      width: 100%;
      border: none;
      outline: none;
      color: #f2efe6;
      font-family: 'Outfit', Arial, sans-serif;
      font-size: 19px;
      font-style: normal;
      font-weight: 300;
      padding: 0;
      background: transparent;
      letter-spacing: 0.01em;
    }
    .answer-input::placeholder {
      color: rgba(164,180,185,0.62);
      font-family: 'Outfit', Arial, sans-serif;
      font-weight: 300;
    }
    .send-btn {
      border: none;
      width: auto;
      min-width: auto;
      height: auto;
      background: transparent;
      color: rgba(242,239,230,0.56);
      cursor: pointer;
      padding: 0 0 0 18px;
      justify-self: end;
      letter-spacing: 0.42em;
      transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
    }
    .send-btn:not(:disabled):hover {
      color: #16c6b3;
      transform: translateX(3px);
      text-shadow: 0 0 18px rgba(7,155,143,0.44);
    }
    .send-btn:disabled {
      cursor: default;
      opacity: 0.32;
    }
    .time-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 12px 0 0 28px;
    }
    .time-row .choice-btn {
      width: auto;
      min-height: 38px;
      font-size: 11px;
      padding: 0 12px;
    }
    @media (max-width: 1180px) {
      .consultation-shell {
        grid-template-columns: clamp(240px, 30vw, 340px) minmax(0, 1fr);
      }
      .chat-card {
        grid-template-rows: auto minmax(0, 1fr) 104px;
      }
      .chat-card::after {
        inset: 136px auto 104px 0;
      }
      .header-copy {
        padding-top: 38px;
      }
      .chapter-block {
        padding-top: 38px;
      }
      .progress-track {
        top: 135px;
      }
      .chat-body-wrap {
        padding-top: 34px;
      }
      .bubble,
      .option-bubble {
        font-size: clamp(23px, 2.3vw, 31px);
      }
      .choice-btn {
        min-height: 52px;
        font-size: 12px;
        letter-spacing: 0.14em;
      }
    }
    @media (max-width: 980px) {
      .gold-page {
        position: fixed;
        height: 100dvh;
        overflow: hidden;
        align-items: stretch;
      }
      .consultation-shell {
        width: 100%;
        height: 100dvh;
        min-height: 0;
        grid-template-columns: 1fr;
        grid-template-rows: 50dvh minmax(0, 1fr);
        border-top: 0;
        border-bottom: 0;
      }
      .video-panel {
        height: 50dvh;
        min-height: 0;
        padding: 28px 24px 22px;
        border-right: none;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      .video-panel video {
        object-position: center 20%;
      }
      .brand-panel {
        width: fit-content;
        max-width: 72%;
      }
      .left-logo {
        width: min(170px, 100%);
        margin-bottom: 0;
      }
      .chat-card {
        min-height: 0;
        grid-template-rows: auto minmax(0, 1fr) auto;
        overflow: hidden;
        border-left: 0;
      }
      .chat-card::after {
        display: none;
      }
      .consultation-header {
        grid-template-columns: 1fr;
      }
      .chat-card .consultation-header::after {
        left: 24px;
      }
      .progress-track {
        position: relative;
        top: auto;
        height: 3px;
      }
      .header-copy,
      .chapter-block,
      .chat-body-wrap,
      .chat-input {
        padding-left: 24px;
        padding-right: 24px;
      }
      .header-copy {
        padding-top: 30px;
        padding-bottom: 24px;
        border-bottom: 0;
      }
      .chapter-block {
        display: none;
      }
      .chat-body-wrap {
        padding-top: 24px;
        padding-bottom: 14px;
        overflow: hidden;
      }
      .chat-body {
        height: 100%;
        min-height: 0;
        overflow: auto;
        padding-right: 0;
        padding-bottom: 8px;
      }
      .message-block {
        display: none;
      }
      .intro-message,
      .message-label.intro-message {
        display: block;
      }
      .message-label.intro-message {
        display: flex;
      }
      .message-block.active-message,
      .notice-row.active-message {
        display: block;
      }
      .refresh-btn {
        right: 24px;
        bottom: 10px;
      }
      .bubble,
      .option-bubble {
        font-size: 26px;
        max-width: 100%;
      }
      .chat-body > div:first-child .bubble {
        font-size: 18px;
      }
      .brand-name {
        font-size: 48px;
      }
      .choice-list {
        width: 100%;
      }
      .summary-grid {
        grid-template-columns: 1fr;
      }
      .chat-input {
        display: block;
        padding-top: 8px;
      }
      .answer-progress {
        display: block;
      }
    }
    @media (max-width: 640px) {
      .video-panel {
        height: 50dvh;
        min-height: 0;
        padding: 22px 18px 20px;
      }
      .brand-panel {
        max-width: 78%;
        padding: 10px;
        margin: -4px -4px 0;
      }
      .left-logo {
        width: min(148px, 100%);
        margin-bottom: 0;
      }
      .brand-quote {
        align-self: end;
        font-size: 24px;
      }
      .chat-body-wrap {
        padding-top: 18px;
      }
      .header-copy {
        padding-top: 18px;
        padding-bottom: 14px;
      }
      .top-kicker,
      .chapter-label,
      .message-label,
      .send-btn,
      .refresh-btn {
        letter-spacing: 0.32em;
      }
      .header-subtitle {
        font-size: 14px;
      }
      .message-label {
        margin-bottom: 18px;
      }
      .bubble,
      .option-bubble {
        font-size: 20px;
        line-height: 1.34;
      }
      .user-bubble {
        max-width: 100%;
        font-size: 18px;
        padding: 14px 16px;
      }
      .option-title {
        font-size: 24px;
      }
      .choice-btn {
        min-height: auto;
        padding: 13px 12px;
        font-size: 10px;
        line-height: 1.25;
        letter-spacing: 0.08em;
        gap: 10px;
      }
      .chat-input {
        padding: 6px 20px 14px;
      }
      .input-line {
        grid-template-columns: 26px minmax(0, 1fr);
        min-height: 58px;
        padding: 0;
      }
      .input-line::after {
        left: 40px;
      }
      .send-btn {
        grid-column: 1 / -1;
        justify-self: start;
        margin-left: 40px;
        margin-bottom: 4px;
        padding-left: 0;
      }
      .answer-input {
        font-size: 18px;
      }
      .time-row {
        padding-left: 0;
      }
      .time-row .choice-btn {
        width: 100%;
      }
    }
    @media (max-width: 420px) {
      .video-panel {
        height: 50dvh;
        min-height: 0;
        padding: 18px 16px;
      }
      .left-logo {
        width: min(132px, 100%);
      }
      .header-copy,
      .chat-body-wrap,
      .chat-input {
        padding-left: 18px;
        padding-right: 18px;
      }
      .bubble,
      .option-bubble {
        font-size: 20px;
      }
      .chat-body > div:first-child .bubble {
        font-size: 16px;
      }
      .choice-btn {
        font-size: 9px;
      }
      .answer-input {
        font-size: 17px;
      }
    }
  `;

  const renderOptions = () => {
    if (OPTIONS[step]) {
      return (
        <div className="row">
          {botAvatar}
          <div className="option-bubble">
            <div className="choice-list">
              {OPTIONS[step]?.map((option) => (
                <button key={option} className="choice-btn" onClick={() => advance(option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderSummary = () => {
    if (step !== "summary") return null;

    return (
      <div className="row">
        {botAvatar}
        <div className="option-bubble">
          <div className="summary-grid">
            {summaryRows.map(({ field, label, value }) => (
              <div key={label} className="summary-item">
                <div className="summary-item-head">
                  <span>{label}</span>
                  <button className="edit-field-btn" type="button" onClick={() => editField(field)}>
                    Edit
                  </button>
                </div>
                <p>{value || "-"}</p>
              </div>
            ))}
          </div>
          <div className="review-actions">
            <button className="finish-btn" onClick={() => finish(data)} disabled={submitting}>
              {submitting ? "Sending..." : "Confirm & Connect"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="gold-page">
      <style>{styles}</style>
      <div className="consultation-shell">
        <aside
          className="video-panel"
          aria-label="Grow Medico consultation introduction"
          onPointerDown={playVideo}
        >
          <video
            ref={videoRef}
            src={POPUP_VIDEO_SRC}
            controls
            autoPlay
            loop
            playsInline
            muted={false}
            preload="auto"
            onCanPlay={playVideo}
            onLoadedData={playVideo}
          />
          <div className="brand-panel">
            <img className="left-logo" src={LOGO_SRC} alt="Grow Medico" />
          </div>

          {/* <p className="brand-quote">
            "Personal Branding | Digital Marketing | <strong>Growth</strong>."
          </p> */}

          {/* <div>
            <div className="house-row">The House of Grow Medico</div>
            <div className="left-divider" />
            <div className="left-services" aria-label="Grow Medico capabilities">
              <div>
                <span>Strategy</span>
                <span>Development</span>
                <span>Performance</span>
              </div>
              <div>
                <span>Design</span>
                <span>Cinematography</span>
                <span>Storytelling</span>
              </div>
            </div>
            <div className="footer-line">
              <span>Established Excellence</span>
              <span>MMXXIV</span>
            </div>
          </div> */}
        </aside>

        <section
          className="chat-card"
          style={
            {
              "--progress": progressPercent,
              "--answered-progress": answeredProgressPercent,
            } as CSSProperties
          }
        >
          <header className="consultation-header">
            <div className="header-copy">
              <div className="top-kicker">Personal Branding </div>
              <p className="header-subtitle">| Digital Marketing | Growth</p>
              {/* <div className="message-label intro-message">Grow Medico</div> */}
              <div className="row intro-message">
                {botAvatar}
                <div className="bubble">
                  Hello! Welcome to <strong>Grow Medico</strong>.
                  <br />
                  We're a personal branding and digital growth team for healthcare professionals.
                  <br />
                  please fill the form below to book a consultation with our team.
                </div>
              </div>
            </div>
            <div className="chapter-block">
              <div className="chapter-label">Chapter</div>
              <div className="chapter-count">
                {chapterNumber} <span>/ {totalChapters}</span>
              </div>
            </div>
          </header>

          <div className="logo-crown">
            <img src={LOGO_SRC} alt="Grow Medico" />
          </div>
          <p className="logo-title">GROW MEDICO</p>
          <p className="logo-tagline">Personal Branding </p>
          <span className="logo-rule" aria-hidden="true" />

          <div className="chat-body-wrap">
            <button
              className="refresh-btn"
              type="button"
              onClick={resetChat}
              aria-label="Restart chat"
            >
              ↻
            </button>
            <div ref={chatRef} className="chat-body">
              <div className="answer-progress question-progress" aria-hidden="true">
                <span />
              </div>

              {messages.map((message) =>
                message.type === "notice" ? (
                  <div
                    key={message.id}
                    className={`notice-row message-block${
                      message.id === latestMessageId ? " active-message" : ""
                    }`}
                  >
                    <div className="notice-bubble">{message.text}</div>
                  </div>
                ) : message.type === "bot" ? (
                  <div
                    key={message.id}
                    className={`message-block${message.id === latestMessageId ? " active-message" : ""}`}
                  >
                    <div className="row">
                      {botAvatar}
                      <div className="bubble">{message.text}</div>
                    </div>
                    <div className="time">{formatRelativeTime(message.createdAt, now)}</div>
                  </div>
                ) : (
                  <div
                    key={message.id}
                    className={`message-block${message.id === latestMessageId ? " active-message" : ""}`}
                  >
                    <div className="row user">
                      <div className="user-bubble">{message.text}</div>
                    </div>
                    <div className="user-time">{formatRelativeTime(message.createdAt, now)}</div>
                  </div>
                ),
              )}

              {typing && (
                <div className="row">
                  {botAvatar}
                  <div className="bubble">Typing...</div>
                </div>
              )}

              {!typing && renderOptions()}
              {!typing && renderSummary()}
            </div>
          </div>

          {!OPTIONS[step] && step !== "summary" && (
            <div className="chat-input">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (step === "consultationDate") {
                    if (!input.trim() || !selectedTime) return;
                    advance(`${input.trim()} at ${selectedTime}`);
                    setInput("");
                    setSelectedTime("");
                    return;
                  }
                  if (!input.trim()) return;
                  advance(input);
                  setInput("");
                }}
              >
                <div className="input-line">
                  <input
                    ref={inputRef}
                    type={step === "consultationDate" ? "date" : "text"}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    min={
                      step === "consultationDate"
                        ? new Date().toISOString().split("T")[0]
                        : undefined
                    }
                    placeholder={step === "consultationDate" ? "Select a date" : "Type an answer"}
                    className="answer-input"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    className="send-btn"
                    disabled={
                      step === "consultationDate" ? !input.trim() || !selectedTime : !input.trim()
                    }
                    aria-label="Send answer"
                  >
                    Send -&gt;
                  </button>
                </div>
                {step === "consultationDate" && (
                  <div className="time-row">
                    {TIME_SLOTS.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`choice-btn${selectedTime === time ? " active" : ""}`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
