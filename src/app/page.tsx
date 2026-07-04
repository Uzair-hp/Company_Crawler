"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Globe,
  Cpu,
  FileText,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Mail,
  Compass,
  HelpCircle,
  Briefcase,
  MapPin,
  Phone,
  Sparkles,
  Download,
  Check,
  Building,
  Hash
} from "lucide-react";
import { SUPPORTED_MODELS, ResearchData } from "src/lib/openrouter";

export default function Dashboard() {
  // Input fields
  const [targetName, setTargetName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [customFocus, setCustomFocus] = useState("");
  
  // API Keys
  const [serperKey, setSerperKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showSerperKey, setShowSerperKey] = useState(false);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");

  // Applicant details
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");

  // Discord Config
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [discordBotToken, setDiscordBotToken] = useState("");
  const [discordChannelId, setDiscordChannelId] = useState("");
  const [useWebhook, setUseWebhook] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<{
    success: boolean;
    data: ResearchData;
    crawledCount: number;
    pages: { url: string; title: string }[];
  } | null>(null);

  // Live progress animations
  const [progressStep, setProgressStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [discordSending, setDiscordSending] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"overview" | "offerings" | "painpoints" | "swot" | "competitors">("overview");

  // Load API keys from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSerperKey(localStorage.getItem("serper_key") || "");
      setOpenrouterKey(localStorage.getItem("openrouter_key") || "");
      setDiscordWebhookUrl(localStorage.getItem("discord_webhook") || "");
      setDiscordBotToken(localStorage.getItem("discord_token") || "");
      setDiscordChannelId(localStorage.getItem("discord_channel") || "");
    }
  }, []);

  // Save API keys to localStorage
  const saveKeys = () => {
    localStorage.setItem("serper_key", serperKey);
    localStorage.setItem("openrouter_key", openrouterKey);
    localStorage.setItem("discord_webhook", discordWebhookUrl);
    localStorage.setItem("discord_token", discordBotToken);
    localStorage.setItem("discord_channel", discordChannelId);
    alert("Configurations saved locally in browser storage!");
  };

  const handleStartResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName && !targetUrl) {
      setError("Please provide a company name or website URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setResearchResult(null);
    setDiscordStatus("idle");
    setProgressStep(1);
    setProgressMessage("Searching Serper.dev for official website & competitors...");

    // Progress updates simulator to keep UI dynamic
    const timer1 = setTimeout(() => {
      setProgressStep(2);
      setProgressMessage("Extracting and crawling website structure...");
    }, 4000);

    const timer2 = setTimeout(() => {
      setProgressStep(3);
      setProgressMessage("Analyzing gathered data with OpenRouter LLM...");
    }, 9000);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: targetName,
          url: targetUrl,
          serperKey,
          openrouterKey,
          model: selectedModel,
          customFocus,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "An error occurred during research extraction.");
      }

      setProgressStep(4);
      setProgressMessage("Dossier analysis completed!");
      
      // Small pause to let user see success state
      setTimeout(() => {
        setResearchResult(resData);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setError(err.message || "Failed to complete company research.");
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!researchResult) return;
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          researchData: researchResult.data,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF file.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${researchResult.data.companyName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(`PDF Error: ${err.message}`);
    }
  };

  const handleSendToDiscord = async () => {
    if (!researchResult) return;
    setDiscordSending(true);
    setDiscordStatus("idle");

    const discordConfig = useWebhook
      ? { webhookUrl: discordWebhookUrl }
      : { botToken: discordBotToken, channelId: discordChannelId };

    const applicantDetails = applicantName || applicantEmail
      ? { name: applicantName, email: applicantEmail }
      : undefined;

    try {
      const response = await fetch("/api/discord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          researchData: researchResult.data,
          discordConfig,
          applicantDetails,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Failed to send data.");

      setDiscordStatus("success");
    } catch (err: any) {
      console.error(err);
      setDiscordStatus("error");
      alert(`Discord Error: ${err.message}`);
    } finally {
      setDiscordSending(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* ==================== SIDEBAR / SETTINGS ==================== */}
      <aside
        style={{
          width: "360px",
          backgroundColor: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-glass)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Branding */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid var(--border-muted)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              padding: "6px",
              borderRadius: "8px",
              background: "var(--accent-gradient)",
            }}
          >
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
              className="text-gradient"
            >
              COMPANY CRAWLER
            </h1>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
              AI Research Dossier v1.0
            </span>
          </div>
        </div>

        {/* Sidebar Scroll Area */}
        <div className="custom-scroll" style={{ flex: 1, padding: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Credentials Section */}
            <div>
              <h2
                style={{
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  letterSpacing: "1px",
                  marginBottom: "12px",
                  fontWeight: 700,
                }}
              >
                API Credentials
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {/* Serper.dev Key */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Serper.dev API Key
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showSerperKey ? "text" : "password"}
                      value={serperKey}
                      onChange={(e) => setSerperKey(e.target.value)}
                      placeholder="Paste Serper API key"
                      style={{
                        width: "100%",
                        padding: "8px 36px 8px 12px",
                        borderRadius: "6px",
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-glass)",
                        color: "#fff",
                        fontSize: "0.85rem",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSerperKey(!showSerperKey)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                      }}
                    >
                      {showSerperKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* OpenRouter Key */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    OpenRouter API Key
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showOpenrouterKey ? "text" : "password"}
                      value={openrouterKey}
                      onChange={(e) => setOpenrouterKey(e.target.value)}
                      placeholder="Paste OpenRouter API key"
                      style={{
                        width: "100%",
                        padding: "8px 36px 8px 12px",
                        borderRadius: "6px",
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-glass)",
                        color: "#fff",
                        fontSize: "0.85rem",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                      }}
                    >
                      {showOpenrouterKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Model Selector */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Analysis AI Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      color: "#fff",
                      fontSize: "0.85rem",
                    }}
                  >
                    {SUPPORTED_MODELS.map((model) => (
                      <option key={model.id} value={model.id} style={{ backgroundColor: "#0b0f19" }}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Applicant Details */}
            <div>
              <h2
                style={{
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  letterSpacing: "1px",
                  marginBottom: "12px",
                  fontWeight: 700,
                }}
              >
                Applicant context
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      color: "#fff",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Candidate Email
                  </label>
                  <input
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="e.g. jane@example.com"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      color: "#fff",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Discord Integration */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    letterSpacing: "1px",
                    fontWeight: 700,
                  }}
                >
                  Discord Dispatch
                </h2>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setUseWebhook(true)}
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "none",
                      background: useWebhook ? "var(--accent-blue)" : "rgba(255,255,255,0.05)",
                      color: "#fff",
                    }}
                  >
                    Webhook
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseWebhook(false)}
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "none",
                      background: !useWebhook ? "var(--accent-blue)" : "rgba(255,255,255,0.05)",
                      color: "#fff",
                    }}
                  >
                    Bot
                  </button>
                </div>
              </div>

              {useWebhook ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Discord Webhook URL
                  </label>
                  <input
                    type="password"
                    value={discordWebhookUrl}
                    onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      color: "#fff",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Discord Bot Token
                    </label>
                    <input
                      type="password"
                      value={discordBotToken}
                      onChange={(e) => setDiscordBotToken(e.target.value)}
                      placeholder="MTYy..."
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-glass)",
                        color: "#fff",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Discord Channel ID
                    </label>
                    <input
                      type="text"
                      value={discordChannelId}
                      onChange={(e) => setDiscordChannelId(e.target.value)}
                      placeholder="e.g. 11985474663..."
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-glass)",
                        color: "#fff",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Save Buttons */}
            <button
              type="button"
              onClick={saveKeys}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-glass)",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 600,
                transition: "var(--transition-smooth)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-glass)")}
            >
              Save Configurations Local
            </button>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN PANEL ==================== */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-base)",
          backgroundImage: "radial-gradient(circle at 75% 20%, rgba(56, 189, 248, 0.04) 0%, transparent 40%)",
        }}
      >
        {/* Research Input Bar */}
        <header
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-glass)",
            background: "rgba(11, 15, 25, 0.4)",
            backdropFilter: "blur(12px)",
          }}
        >
          <form onSubmit={handleStartResearch} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", width: "100%" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                  Company Name
                </label>
                <div style={{ position: "relative" }}>
                  <Building
                    size={16}
                    style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    placeholder="e.g. Stripe, OpenAI, Tesla"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              <div style={{ width: "40px", textAlign: "center", paddingBottom: "10px", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>
                OR
              </div>

              <div style={{ flex: 1.2 }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                  Website URL
                </label>
                <div style={{ position: "relative" }}>
                  <Globe
                    size={16}
                    style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="e.g. stripe.com, openai.com"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  background: loading ? "var(--text-muted)" : "var(--accent-gradient)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: loading ? "none" : "0 4px 14px 0 rgba(56, 189, 248, 0.3)",
                  transition: "var(--transition-smooth)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.transform = "translateY(0)";
                }}
              >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                  Extracting...
                </>
              ) : (
                <>
                  <Compass size={16} />
                  Analyze Company
                </>
              )}
            </button>
            </div>

            <div style={{ width: "100%" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                Custom Research Focus (Optional)
              </label>
              <input
                type="text"
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                placeholder="e.g. Focus on pricing tiers, open-source model, developer experience, security compliance..."
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-glass)",
                  color: "#fff",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </form>
        </header>

        {/* Dashboard Content Container */}
        <div style={{ flex: 1, padding: "28px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* ==================== LOADING & PROGRESS ==================== */}
          {loading && (
            <div
              className="glass-panel"
              style={{
                maxWidth: "600px",
                width: "100%",
                margin: "40px auto",
                padding: "32px",
                textAlign: "center",
                animation: "fadeIn 0.4s ease-out",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "50%",
                    background: "rgba(56, 189, 248, 0.08)",
                    border: "1px dashed var(--accent-blue)",
                    animation: "pulseGlow 2s infinite",
                  }}
                >
                  <Loader2 size={36} color="var(--accent-blue)" style={{ animation: "spin 2s linear infinite" }} />
                </div>
              </div>
              
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px", fontFamily: "var(--font-display)" }}>
                Compiling Corporate Intelligence
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "24px" }}>
                {progressMessage}
              </p>

              {/* Progress Steps UI */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px", margin: "0 auto", textAlign: "left" }}>
                
                {/* Step 1 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: progressStep > 1 ? "var(--accent-green)" : progressStep === 1 ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.05)",
                      color: progressStep > 1 ? "#fff" : progressStep === 1 ? "var(--accent-blue)" : "var(--text-muted)",
                      border: progressStep === 1 ? "1px solid var(--accent-blue)" : "none",
                    }}
                  >
                    {progressStep > 1 ? <Check size={12} /> : "1"}
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: progressStep === 1 ? 600 : 400, color: progressStep >= 1 ? "var(--text-primary)" : "var(--text-muted)" }}>
                    Serper Search & competitor discovery
                  </span>
                </div>

                {/* Step 2 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: progressStep > 2 ? "var(--accent-green)" : progressStep === 2 ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.05)",
                      color: progressStep > 2 ? "#fff" : progressStep === 2 ? "var(--accent-blue)" : "var(--text-muted)",
                      border: progressStep === 2 ? "1px solid var(--accent-blue)" : "none",
                    }}
                  >
                    {progressStep > 2 ? <Check size={12} /> : "2"}
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: progressStep === 2 ? 600 : 400, color: progressStep >= 2 ? "var(--text-primary)" : "var(--text-muted)" }}>
                    Cheerio target page crawling
                  </span>
                </div>

                {/* Step 3 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: progressStep > 3 ? "var(--accent-green)" : progressStep === 3 ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.05)",
                      color: progressStep > 3 ? "#fff" : progressStep === 3 ? "var(--accent-blue)" : "var(--text-muted)",
                      border: progressStep === 3 ? "1px solid var(--accent-blue)" : "none",
                    }}
                  >
                    {progressStep > 3 ? <Check size={12} /> : "3"}
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: progressStep === 3 ? 600 : 400, color: progressStep >= 3 ? "var(--text-primary)" : "var(--text-muted)" }}>
                    OpenRouter Synthesis
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ==================== ERROR NOTIFICATION ==================== */}
          {error && (
            <div
              className="glass-panel"
              style={{
                maxWidth: "600px",
                width: "100%",
                margin: "40px auto",
                padding: "24px",
                borderLeft: "4px solid var(--accent-rose)",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
                animation: "fadeIn 0.3s ease-out",
              }}
            >
              <AlertCircle color="var(--accent-rose)" size={24} style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                  Research Operation Failed
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  {error}
                </p>
                <div style={{ marginTop: "12px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  💡 Ensure your API keys are correct, saved locally, or configured in the server environment.
                </div>
              </div>
            </div>
          )}

          {/* ==================== IDLE STATE ==================== */}
          {!loading && !error && !researchResult && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                maxWidth: "600px",
                margin: "0 auto",
                padding: "20px",
                animation: "fadeIn 0.5s ease-out",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)",
                  border: "1px solid var(--border-glass)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-blue)",
                  marginBottom: "24px",
                }}
              >
                <Search size={32} />
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.7rem",
                  fontWeight: 700,
                  marginBottom: "10px",
                }}
              >
                Research any company in seconds
              </h2>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginBottom: "28px",
                }}
              >
                Enter a company name or website URL. The crawler will scrape their website pages, identify top competitors, and build a downloadable corporate intelligence PDF report.
              </p>
              
              <div
                className="glass-panel"
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  textAlign: "left",
                }}
              >
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Features Included:
                </h4>
                <ul style={{ listStyleType: "none", fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={14} color="var(--accent-blue)" /> Key website page crawls (Cheerio)
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={14} color="var(--accent-blue)" /> Google Search API competitor mapping (Serper)
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={14} color="var(--accent-blue)" /> AI executive summary synthesis (Gemini/Llama)
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={14} color="var(--accent-blue)" /> Professional corporate PDF download (PDFKit)
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={14} color="var(--accent-blue)" /> Direct HR/Recruitment Discord Dispatch
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ==================== RESEARCH DOSSIER RESULTS ==================== */}
          {researchResult && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                animation: "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Profile Card Header */}
              <div
                className="glass-panel"
                style={{
                  padding: "24px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundImage: "linear-gradient(to right, rgba(56, 189, 248, 0.03), transparent)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800 }}>
                      {researchResult.data.companyName}
                    </h2>
                    <span className="badge badge-blue">{researchResult.data.industry}</span>
                    <span className="badge badge-indigo">{researchResult.crawledCount} pages crawled</span>
                  </div>
                  {researchResult.data.tagline && (
                    <p style={{ fontSize: "0.95rem", color: "var(--accent-blue)", fontFamily: "var(--font-display)", fontWeight: 500 }}>
                      {researchResult.data.tagline}
                    </p>
                  )}
                  <a
                    href={researchResult.data.website}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px" }}
                  >
                    <Globe size={12} />
                    {researchResult.data.website}
                  </a>
                </div>

                {/* Actions Toolbar */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  {/* PDF Download Button */}
                  <button
                    onClick={handleDownloadPDF}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "6px",
                      backgroundColor: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.2)",
                      color: "var(--accent-blue)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "var(--transition-smooth)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.15)";
                      e.currentTarget.style.borderColor = "var(--accent-blue)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.08)";
                      e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.2)";
                    }}
                  >
                    <Download size={15} />
                    Download PDF Report
                  </button>

                  {/* Discord Publish Button */}
                  <button
                    onClick={handleSendToDiscord}
                    disabled={discordSending}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "6px",
                      backgroundColor:
                        discordStatus === "success"
                          ? "rgba(16, 185, 129, 0.1)"
                          : discordStatus === "error"
                          ? "rgba(244, 63, 94, 0.1)"
                          : "rgba(99, 102, 241, 0.1)",
                      border:
                        discordStatus === "success"
                          ? "1px solid rgba(16, 185, 129, 0.3)"
                          : discordStatus === "error"
                          ? "1px solid rgba(244, 63, 94, 0.3)"
                          : "1px solid rgba(99, 102, 241, 0.2)",
                      color:
                        discordStatus === "success"
                          ? "var(--accent-green)"
                          : discordStatus === "error"
                          ? "var(--accent-rose)"
                          : "var(--accent-indigo)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "var(--transition-smooth)",
                    }}
                    onMouseEnter={(e) => {
                      if (!discordSending && discordStatus === "idle") {
                        e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.18)";
                        e.currentTarget.style.borderColor = "var(--accent-indigo)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!discordSending && discordStatus === "idle") {
                        e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
                        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.2)";
                      }
                    }}
                  >
                    {discordSending ? (
                      <>
                        <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                        Dispatching...
                      </>
                    ) : discordStatus === "success" ? (
                      <>
                        <Check size={15} />
                        Dispatched to Discord
                      </>
                    ) : discordStatus === "error" ? (
                      <>
                        <AlertCircle size={15} />
                        Dispatch Failed
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Send to Discord
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--border-glass)",
                  marginBottom: "20px",
                  gap: "24px",
                }}
              >
                {(["overview", "offerings", "painpoints", "swot", "competitors"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "10px 4px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: activeTab === tab ? "var(--accent-blue)" : "var(--text-secondary)",
                      borderBottom: activeTab === tab ? "2px solid var(--accent-blue)" : "2px solid transparent",
                      transition: "var(--transition-smooth)",
                      textTransform: "capitalize",
                    }}
                  >
                    {tab === "painpoints" ? "Pain Points" : tab === "swot" ? "SWOT & Focus" : tab}
                  </button>
                ))}
              </div>

              {/* Tab Content Panels */}
              <div className="custom-scroll" style={{ flex: 1, padding: "4px" }}>
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px", animation: "fadeIn 0.3s ease-out" }}>
                    <div className="glass-panel" style={{ padding: "20px" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <FileText size={16} color="var(--accent-blue)" />
                        Executive Summary
                      </h3>
                      <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                        {researchResult.data.executiveSummary}
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div className="glass-panel" style={{ padding: "20px" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Building size={16} color="var(--accent-blue)" />
                          Corporate Contact details
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem" }}>
                          <div style={{ display: "flex" }}>
                            <span style={{ width: "80px", color: "var(--text-muted)", fontWeight: 600 }}>Address:</span>
                            <span style={{ flex: 1, color: "var(--text-secondary)" }}>
                              <MapPin size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                              {researchResult.data.contactInfo.address}
                            </span>
                          </div>
                          <div style={{ display: "flex" }}>
                            <span style={{ width: "80px", color: "var(--text-muted)", fontWeight: 600 }}>Phone:</span>
                            <span style={{ flex: 1, color: "var(--text-secondary)" }}>
                              <Phone size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                              {researchResult.data.contactInfo.phone}
                            </span>
                          </div>
                          <div style={{ display: "flex" }}>
                            <span style={{ width: "80px", color: "var(--text-muted)", fontWeight: 600 }}>Email:</span>
                            <span style={{ flex: 1, color: "var(--text-secondary)" }}>
                              <Mail size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                              {researchResult.data.contactInfo.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: "20px" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Globe size={16} color="var(--accent-blue)" />
                          Crawled Index
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {researchResult.pages.map((page, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.8rem",
                                padding: "6px 8px",
                                borderRadius: "4px",
                                background: "rgba(255,255,255,0.01)",
                                border: "1px solid rgba(255,255,255,0.02)",
                              }}
                            >
                              <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "250px" }}>
                                {page.title}
                              </span>
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "var(--accent-blue)", fontSize: "0.75rem", fontFamily: "monospace" }}
                              >
                                View Source
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. OFFERINGS TAB */}
                {activeTab === "offerings" && (
                  <div className="result-section-list" style={{ animation: "fadeIn 0.3s ease-out" }}>
                    {researchResult.data.offerings.map((offering, idx) => (
                      <div key={idx} className="result-card">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <Hash size={14} color="var(--accent-blue)" />
                          <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                            {offering.name}
                          </h4>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                          {offering.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. PAIN POINTS TAB */}
                {activeTab === "painpoints" && (
                  <div className="result-section-list" style={{ animation: "fadeIn 0.3s ease-out" }}>
                    {researchResult.data.painPoints.map((pt, idx) => (
                      <div key={idx} className="result-card" style={{ borderLeft: "3px solid var(--accent-rose)" }}>
                        <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-rose)", marginBottom: "8px" }}>
                          Challenge: {pt.issue}
                        </h4>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                          <strong>How they solve it:</strong> {pt.impact}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* SWOT & FOCUS TAB */}
                {activeTab === "swot" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px", animation: "fadeIn 0.3s ease-out" }}>
                    
                    {/* Custom Focus Summary Block */}
                    {researchResult.data.customFocusSummary && (
                      <div className="glass-panel" style={{ padding: "20px", borderLeft: "4px solid var(--accent-indigo)" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Sparkles size={16} color="var(--accent-indigo)" />
                          Targeted Focus Analysis
                        </h3>
                        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                          {researchResult.data.customFocusSummary}
                        </p>
                      </div>
                    )}

                    {/* 2x2 SWOT Matrix Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      
                      {/* Strengths */}
                      <div className="glass-panel" style={{ padding: "20px", borderTop: "4px solid var(--accent-green)" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--accent-green)", marginBottom: "12px", fontFamily: "var(--font-display)" }}>
                          STRENGTHS (S)
                        </h3>
                        <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                          {(researchResult.data.swot?.strengths || []).map((s, idx) => (
                            <li key={idx} style={{ lineHeight: "1.4" }}>{s}</li>
                          ))}
                          {(!researchResult.data.swot?.strengths || researchResult.data.swot.strengths.length === 0) && (
                            <li style={{ listStyleType: "none", color: "var(--text-muted)", fontStyle: "italic" }}>No strengths recorded.</li>
                          )}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="glass-panel" style={{ padding: "20px", borderTop: "4px solid var(--accent-rose)" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--accent-rose)", marginBottom: "12px", fontFamily: "var(--font-display)" }}>
                          WEAKNESSES (W)
                        </h3>
                        <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                          {(researchResult.data.swot?.weaknesses || []).map((w, idx) => (
                            <li key={idx} style={{ lineHeight: "1.4" }}>{w}</li>
                          ))}
                          {(!researchResult.data.swot?.weaknesses || researchResult.data.swot.weaknesses.length === 0) && (
                            <li style={{ listStyleType: "none", color: "var(--text-muted)", fontStyle: "italic" }}>No weaknesses recorded.</li>
                          )}
                        </ul>
                      </div>

                      {/* Opportunities */}
                      <div className="glass-panel" style={{ padding: "20px", borderTop: "4px solid var(--accent-blue)" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--accent-blue)", marginBottom: "12px", fontFamily: "var(--font-display)" }}>
                          OPPORTUNITIES (O)
                        </h3>
                        <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                          {(researchResult.data.swot?.opportunities || []).map((o, idx) => (
                            <li key={idx} style={{ lineHeight: "1.4" }}>{o}</li>
                          ))}
                          {(!researchResult.data.swot?.opportunities || researchResult.data.swot.opportunities.length === 0) && (
                            <li style={{ listStyleType: "none", color: "var(--text-muted)", fontStyle: "italic" }}>No opportunities recorded.</li>
                          )}
                        </ul>
                      </div>

                      {/* Threats */}
                      <div className="glass-panel" style={{ padding: "20px", borderTop: "4px solid #a855f7" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#a855f7", marginBottom: "12px", fontFamily: "var(--font-display)" }}>
                          THREATS (T)
                        </h3>
                        <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                          {(researchResult.data.swot?.threats || []).map((t, idx) => (
                            <li key={idx} style={{ lineHeight: "1.4" }}>{t}</li>
                          ))}
                          {(!researchResult.data.swot?.threats || researchResult.data.swot.threats.length === 0) && (
                            <li style={{ listStyleType: "none", color: "var(--text-muted)", fontStyle: "italic" }}>No threats recorded.</li>
                          )}
                        </ul>
                      </div>

                    </div>
                  </div>
                )}

                {/* 4. COMPETITORS TAB */}
                {activeTab === "competitors" && (
                  <div className="result-section-list" style={{ animation: "fadeIn 0.3s ease-out" }}>
                    {researchResult.data.competitors.map((comp, idx) => (
                      <div
                        key={idx}
                        className="result-card"
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <div>
                          <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                            {comp.name}
                          </h4>
                          {comp.url && comp.url !== "N/A" && (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {comp.url}
                            </span>
                          )}
                        </div>
                        {comp.url && comp.url !== "N/A" && (
                          <a
                            href={comp.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255,255,255,0.03)",
                              border: "1px solid var(--border-glass)",
                              fontSize: "0.8rem",
                              color: "var(--accent-blue)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              transition: "var(--transition-smooth)",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)")}
                          >
                            Visit Site
                            <ArrowRight size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
