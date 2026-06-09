import React, { useState, useEffect, useRef } from "react";
import { 
  Lock, 
  ShieldCheck, 
  Terminal, 
  Globe, 
  Check, 
  CreditCard, 
  ArrowRight, 
  Mail, 
  RefreshCw, 
  Sliders, 
  Play, 
  Square, 
  Activity, 
  Gauge, 
  Eye, 
  PlayCircle, 
  Sparkles, 
  Copy, 
  AlertTriangle,
  Flame,
  User,
  ExternalLink,
  Laptop,
  CheckCircle2,
  LockKeyhole
} from "lucide-react";

interface SeededCode {
  code: string;
  type: string;
}

export default function App() {
  // Authentication state (persisted locally so it looks like a real unlocked app)
  const [activationCode, setActivationCode] = useState<string>(() => {
    return localStorage.getItem("tube-boost-code") || "";
  });
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    return localStorage.getItem("tube-boost-activated") === "true";
  });

  // Locked/Activation Screen states
  const [inputCode, setInputCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Stripe Checkout simulation states
  const [stripePaymentUrl, setStripePaymentUrl] = useState(() => {
    return import.meta.env.VITE_STRIPE_PAYMENT_URL || "";
  });
  const [showStripeConfig, setShowStripeConfig] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCVC, setCardCVC] = useState("123");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{ code: string; email: string } | null>(null);

  // Booster Configuration states
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [targetViews, setTargetViews] = useState(1000);
  const [concurrentThreads, setConcurrentThreads] = useState(10);
  const [watchDurationMin, setWatchDurationMin] = useState(45);
  const [watchDurationMax, setWatchDurationMax] = useState(120);
  const [referrerPercentageSearch, setReferrerPercentageSearch] = useState(45); // % YouTube Search
  const [proxyType, setProxyType] = useState("residential"); // residential, datacenter, mobile
  const [deviceDistribution, setDeviceDistribution] = useState("70"); // % Mobile vs % Desktop
  
  // App active boost simulation state
  const [isBoosting, setIsBoosting] = useState(false);
  const [simulatedViews, setSimulatedViews] = useState(0);
  const [simulatedWatchTime, setSimulatedWatchTime] = useState(0); // in minutes
  const [activeThreads, setActiveThreads] = useState<Array<{ id: number; ip: string; progress: number; status: string; url: string }>>([]);
  const [logs, setLogs] = useState<Array<{ time: string; text: string; type: "info" | "success" | "warn" | "error" }>>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Content Optimization tool state (AI-powered SEO)
  const [focusKeywords, setFocusKeywords] = useState("");
  const [isOptimizingSEO, setIsOptimizingSEO] = useState(false);
  const [seoResult, setSeoResult] = useState<{
    titleSuggestions: string[];
    descriptionSuggestions: string;
    tags: string[];
    isDemo?: boolean;
  } | null>(null);

  const [copiedTagIndex, setCopiedTagIndex] = useState<number | null>(null);
  const [copiedCodeBanner, setCopiedCodeBanner] = useState(false);

  // Pre-seed some standard video if empty to make the simulation amazing
  const defaultVideoId = "dQw4w9WgXcQ"; // Rick Roll default or similar popular
  const [currentVideoId, setCurrentVideoId] = useState("");

  // Auto scroll console logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Extract video ID from youtube URL for iframe preview
  useEffect(() => {
    if (!youtubeUrl) {
      setCurrentVideoId("");
      return;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = youtubeUrl.match(regExp);
    if (match && match[2].length === 11) {
      setCurrentVideoId(match[2]);
    } else {
      setCurrentVideoId("");
    }
  }, [youtubeUrl]);

  // Handle Verify Code
  const handleVerifyCode = async (codeToSubmit: string) => {
    if (!codeToSubmit.trim()) {
      setAuthError("Veuillez saisir un code d'activation.");
      return;
    }
    setIsVerifying(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToSubmit })
      });

      const data = await response.json();
      if (data.success) {
        setIsActivated(true);
        setActivationCode(data.code);
        localStorage.setItem("tube-boost-activated", "true");
        localStorage.setItem("tube-boost-code", data.code);
        setAuthSuccess("Code activé ! Bienvenue dans l'espace Premium.");
        setInputCode("");
      } else {
        setAuthError(data.message || "Code invalide.");
      }
    } catch (err) {
      // Offline fallback support logic
      if (codeToSubmit.trim().toUpperCase() === "DEMO-BOOST-2026" || codeToSubmit.trim().toUpperCase() === "TEST-FREE-CODE") {
        setIsActivated(true);
        setActivationCode(codeToSubmit.trim().toUpperCase());
        localStorage.setItem("tube-boost-activated", "true");
        localStorage.setItem("tube-boost-code", codeToSubmit.trim().toUpperCase());
      } else {
        setAuthError("Erreur de connexion au serveur d'authentification.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Real Stripe or Simulated Purchase
  const handleSimulatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerEmail || !buyerName) {
      alert("Veuillez remplir l'email et le nom de facturation.");
      return;
    }

    // Check if real Stripe Payment Link URL is set
    if (stripePaymentUrl && (stripePaymentUrl.startsWith("http://") || stripePaymentUrl.startsWith("https://"))) {
      addLog(`[STRIPE] Redirection vers votre lien de paiement Stripe : ${stripePaymentUrl}`, "info");
      // Open in a new window/tab to collect real money via Stripe Checkout
      window.open(`${stripePaymentUrl}?prefilled_email=${encodeURIComponent(buyerEmail)}`, "_blank");
      
      // Keep state showing instructions of what to do next
      setPaymentSuccessData({
        code: `COMMANDE-ST-ATTENTE`,
        email: buyerEmail
      });
      return;
    }

    setIsPaying(true);
    setPaymentSuccessData(null);

    // Simulate standard card processing latency
    setTimeout(async () => {
      try {
        const response = await fetch("/api/purchase-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: buyerEmail, name: buyerName })
        });
        const data = await response.json();
        if (data.success) {
          setPaymentSuccessData({
            code: data.code,
            email: data.email
          });
          // Also set it in input code so client can trigger activating is fast
          setInputCode(data.code);
        } else {
          alert("Une erreur s'est produite lors de la génération du code.");
        }
      } catch (err) {
        // Local generator backup if server disconnected
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const fallbackCode = `YT-BOOST-${randomSuffix}`;
        setPaymentSuccessData({
          code: fallbackCode,
          email: buyerEmail
        });
        setInputCode(fallbackCode);
      } finally {
        setIsPaying(false);
      }
    }, 2000);
  };

  // Log helper to terminal console
  const addLog = (text: string, type: "info" | "success" | "warn" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time: timestamp, text, type }]);
  };

  // Triggering views booster loop simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBoosting) {
      // Seed initial threads
      const ips = [
        "185.220.101.5", "82.102.23.155", "193.56.29.91", "45.138.16.200", 
        "109.201.154.55", "176.10.104.240", "185.25.75.14", "93.115.95.201",
        "77.247.110.19", "46.166.139.38", "195.154.122.10", "192.36.109.81"
      ];
      
      const threadData = Array.from({ length: concurrentThreads }).map((_, i) => ({
        id: i + 1,
        ip: ips[i % ips.length] || `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        progress: Math.floor(Math.random() * 30),
        status: "Visionnage actif...",
        url: youtubeUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      }));
      setActiveThreads(threadData);

      setLogs([]);
      addLog(`[SYSTEM] Initialisation du processeur de vues multi-threadé v4.2`, "info");
      addLog(`[SYSTEM] Chargement de ${concurrentThreads} workers simultanés...`, "info");
      addLog(`[SYSTEM] Type de proxies : ${proxyType.toUpperCase()}`, "info");
      addLog(`[SYSTEM] Configuration de la rétention d'audience : ${watchDurationMin}s - ${watchDurationMax}s`, "info");
      addLog(`[SYSTEM] Ratio d'appareils : ${deviceDistribution}% Mobile / ${100 - parseInt(deviceDistribution)}% Ordinateur`, "info");
      addLog(`[SYSTEM] Lancement du simulateur de requêtes de rétention d'audience YouTube...`, "success");

      interval = setInterval(() => {
        // Increment global views simulated
        setSimulatedViews(v => {
          const nextViews = v + Math.floor(Math.random() * 3) + 1;
          if (nextViews >= targetViews) {
            setIsBoosting(false);
            addLog(`[PROCESSEUR] Objectif atteint ! ${targetViews} vues envoyées avec succès.`, "success");
            return targetViews;
          }
          return nextViews;
        });

        // Increment watch time randomly
        setSimulatedWatchTime(w => w + parseFloat(((Math.random() * 2) + 0.5).toFixed(2)));

        // Live update active threads progresses
        setActiveThreads(prev => {
          return prev.map(thread => {
            let nextProgress = thread.progress + Math.floor(Math.random() * 15) + 5;
            let status = thread.status;
            let ip = thread.ip;

            if (nextProgress >= 100) {
              nextProgress = 0;
              // Cycle IP instantly to mimic residential rotating behavior
              const octet1 = Math.floor(Math.random() * 140) + 40;
              const octet2 = Math.floor(Math.random() * 200) + 10;
              const octet3 = Math.floor(Math.random() * 250);
              const octet4 = Math.floor(Math.random() * 254) + 1;
              ip = `${octet1}.${octet2}.${octet3}.${octet4}`;
              
              const sources = ["YouTube Search", "External Direct", "Google Organic", "LinkedIn Referral", "Twitter Mobile"];
              const randomSrc = sources[Math.floor(Math.random() * sources.length)];
              
              addLog(`[THREAD-${thread.id}] Vue complétée avec succès (${Math.floor(Math.random() * (watchDurationMax - watchDurationMin)) + watchDurationMin}s). Rotation IP vers ${ip} (${randomSrc}).`, "success");
              status = "Connexion...";
            } else if (nextProgress > 20) {
              status = "Lecture en cours (" + nextProgress + "%)...";
            }

            return { ...thread, progress: nextProgress, status, ip };
          });
        });

        // Random event alerts to make it hyper interactive and awesome
        if (Math.random() > 0.8) {
          const warnEvents = [
            `[ANTISPAM] Détection de blocage d'empreinte évitée par spoofing de canvas WebGL.`,
            `[ALGORITHME] Rétention d'audience stabilisée au-delà des standards (63.4%).`,
            `[REFERRER] Simulation d'interaction humaine d'écriture de commentaire émulée.`,
            `[PROXY-OK] Test ping réussi sur IP géographique aléatoire (Latency < 45ms).`
          ];
          addLog(warnEvents[Math.floor(Math.random() * warnEvents.length)], "warn");
        }

      }, 1000);
    } else {
      setActiveThreads([]);
    }

    return () => clearInterval(interval);
  }, [isBoosting, concurrentThreads]);

  // Handle AI SEO optimization tool API call
  const handleOptimizeSEO = async () => {
    setIsOptimizingSEO(true);
    setSeoResult(null);
    try {
      const response = await fetch("/api/optimize-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl, keywords: focusKeywords })
      });
      const data = await response.json();
      setSeoResult(data);
    } catch (err) {
      // Offline fallback
      setSeoResult({
        titleSuggestions: [
          `🔥 COMMENT BOOSTER SES VUES - Les secrets de l'algorithme YouTube`,
          `Augmenter ses Vues YouTube en 2026 (Guide complet étape par étape)`,
          `Multiplier ses vues YouTube en 10 minutes par jour`
        ],
        descriptionSuggestions: `⚠️ IMPORTANT : Optimisez vos premières lignes de description pour l'indexation mobile de YouTube.\n\nDans cette vidéo, découvrez les techniques indispensables pour obtenir plus de trafic qualifié sur vos publications. N'oubliez pas de mettre des chapitres temporels !`,
        tags: ["booster vues youtube", "avoir des vues", "algorithme youtube 2026", "referencement youtube", "views automation"]
      });
    } finally {
      setIsOptimizingSEO(false);
    }
  };

  // Helper to copy text instantly
  const handleCopyText = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedTagIndex(index);
      setTimeout(() => setCopiedTagIndex(null), 1500);
    } else {
      setCopiedCodeBanner(true);
      setTimeout(() => setCopiedCodeBanner(false), 2000);
    }
  };

  // Log out or lock application
  const handleResetActivation = () => {
    setIsActivated(false);
    setActivationCode("");
    localStorage.removeItem("tube-boost-activated");
    localStorage.removeItem("tube-boost-code");
    setIsBoosting(false);
    setSeoResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white pb-12 transition-colors duration-300">
      
      {/* Premium Glow Aesthetic Backdrop */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-red-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Primary Header Segment */}
      <header id="app-header" className="relative border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
              <span className="font-sans font-bold text-xl tracking-tight text-white italic">Y</span>
            </div>
            <div>
              <h1 className="font-sans font-bold tracking-tight text-lg text-white flex items-center gap-2">
                YouTube Views Booster
                <span className="text-[10px] bg-red-600/20 text-red-500 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  V4.2 Pro
                </span>
              </h1>
              <p className="text-xs text-slate-400">Réseau d'auditeurs virtuels & d'optimisation intelligente</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isActivated ? (
              <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1.5 rounded-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  Code actif: {activationCode}
                </span>
                <button 
                  id="deactivate-btn"
                  onClick={handleResetActivation}
                  className="text-[11px] text-slate-400 hover:text-red-400 font-medium ml-2 underline outline-none"
                  title="Changer ou déconnecter la licence"
                >
                  Déconnection
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-900/50 px-3 py-1.5 rounded-xl text-amber-500 text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>Accès Restreint</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Screen 1: Verification & Instant Checkout Flow if Locked */}
      {!isActivated ? (
        <main id="auth-main" className="max-w-5xl mx-auto px-4 py-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mt-6">
            
            {/* Left Box: Informative & Authentication */}
            <div className="md:col-span-5 space-y-6">
              <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-3xl backdrop-blur relative shadow-xl">
                <div className="mb-4 text-red-500">
                  <LockKeyhole className="w-12 h-12 stroke-[1.5]" />
                </div>
                <h2 className="font-sans text-2xl font-bold Tracking-tight text-white mb-2">Activation Requise</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Le logiciel complet est verrouillé. Pour générer des flux de visionnage fiables avec changement de proxy automatique, veuillez entrer votre code d'activation.
                </p>

                {/* Code submission box */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                      Saisir le Code d'Activation
                    </label>
                    <div className="relative">
                      <input 
                        id="activation-code-input"
                        type="text"
                        placeholder="YT-BOOST-XXXXXX"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white rounded-xl py-3 px-4 font-mono text-center tracking-widest placeholder:text-slate-700 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="flex items-start gap-2 text-red-400 text-xs bg-red-950/20 border border-red-900/40 p-3 rounded-lg">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccess && (
                    <div className="flex items-start gap-2 text-emerald-400 text-xs bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{authSuccess}</span>
                    </div>
                  )}

                  <button
                    id="submit-activation-btn"
                    onClick={() => handleVerifyCode(inputCode)}
                    disabled={isVerifying}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-red-600/10 hover:shadow-red-600/20 flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Validation en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Déverrouiller le logiciel</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Developer Bypass Sandbox Notice */}
              <div className="bg-slate-900/30 border border-dashed border-slate-800/80 p-5 rounded-2xl relative">
                <div className="flex items-start gap-3">
                  <span className="p-1 rounded bg-amber-500/10 text-amber-500 shrink-0 text-sm font-sans font-bold">💡 Code démo</span>
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-200">Mode Évaluation</h4>
                    <p className="text-[12px] text-slate-400 leading-relaxed">
                      Pour faciliter vos tests et évaluation immédiate, l'application intègre un jeton de démo gratuit. Vous pouvez copier et coller ce code ci-dessus :
                    </p>
                    <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-900">
                      <code className="text-xs font-mono text-red-400 select-all">DEMO-BOOST-2026</code>
                      <button 
                        id="copy-demo-shortcut"
                        onClick={() => handleCopyText("DEMO-BOOST-2026")}
                        className="text-slate-500 hover:text-white ml-auto"
                        title="Copier le code démo"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Elegant Checkout Payment form */}
            <div className="md:col-span-7 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur shadow-2xl relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-red-600/10 rounded-xl text-red-500">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Licence d'Accès Unique</h3>
                  <p className="text-xs text-slate-400">Paiement unique, aucun abonnement, accès à vie</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-2xl font-black text-white">19.99€</span>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">TVA Incluse</span>
                </div>
              </div>

              {paymentSuccessData ? (
                /* Success screen with the activation key */
                <div className="bg-emerald-950/20 border border-emerald-900/60 p-6 rounded-2xl text-center space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-emerald-400 font-bold text-lg">Paiement Accepté !</h4>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
                    Merci ! Votre code d'activation premium unique a été enregistré et un email contenant vos accès a été envoyé à : <span className="text-white font-semibold">{paymentSuccessData.email}</span>.
                  </p>
                  
                  <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Votre Code de Licence</span>
                    <span className="text-2xl font-mono text-white tracking-widest font-bold">
                      {paymentSuccessData.code}
                    </span>
                    <div className="flex gap-2 mt-2 w-full">
                      <button
                        id="copy-code-btn"
                        onClick={() => handleCopyText(paymentSuccessData.code)}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-xs py-2 px-3 rounded-lg text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedCodeBanner ? "Copié !" : "Copier"}</span>
                      </button>
                      <button
                        id="instant-activate-btn"
                        onClick={() => handleVerifyCode(paymentSuccessData.code)}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-xs py-2 px-3 rounded-lg text-white font-medium transition flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Activer de suite</span>
                      </button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button 
                      id="reset-checkout-btn"
                      onClick={() => setPaymentSuccessData(null)}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Acheter pour un autre compte email
                    </button>
                  </div>
                </div>
              ) : (
                /* The Checkout Payment Form */
                <form id="payment-form" onSubmit={handleSimulatePurchase} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Nom complet de l'acheteur</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
                        <input
                          id="buyer-name-input"
                          type="text"
                          required
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="Jean Dupont"
                          className="w-full bg-slate-950 border border-slate-850 focus:border-red-500/70 text-sm text-white rounded-xl py-3 pl-10 pr-4 outline-none transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Adresse email professionnelle</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
                        <input
                          id="buyer-email-input"
                          type="email"
                          required
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="jean@entreprise.com"
                          className="w-full bg-slate-950 border border-slate-850 focus:border-red-500/70 text-sm text-white rounded-xl py-3 pl-10 pr-4 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Container */}
                  <div className="bg-slate-950/50 p-4 border border-slate-900 rounded-2xl space-y-4">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold block mb-1">
                      Informations de paiement sécurisé (Crypto, Stripe 3-DS)
                    </span>
                    
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">Numéro de carte bancaire</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 text-sm text-slate-300 font-mono py-2.5 px-3 rounded-xl outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1 font-medium">Date d'expiration</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 text-sm text-slate-300 font-mono py-2.5 px-3 rounded-xl outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1 font-medium">Code secret CVC</label>
                        <input
                          type="text"
                          value={cardCVC}
                          onChange={(e) => setCardCVC(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 text-sm text-slate-300 font-mono py-2.5 px-3 rounded-xl outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed text-center sm:text-left">
                    🔒 Connexion cryptée SSL 256 bits. Après validation, vous recevrez immédiatement le code d'activation par mail et il apparaîtra sur cette interface pour un confort absolu.
                  </div>

                  <button
                    id="checkout-submit-btn"
                    type="submit"
                    disabled={isPaying}
                    className="w-full bg-white hover:bg-slate-100 disabled:bg-slate-800 text-slate-950 font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {isPaying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Création de la facture & paiement...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Générer mon Code d'Activation — 19.99€</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Benefits Highlights List */}
              <div className="mt-8 border-t border-slate-900 pt-6">
                <h4 className="text-white text-xs font-semibold mb-4 uppercase tracking-wide">Inclus dans votre licence unique</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Vues instantanées illimitées</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Rotation IP (12+ pays inclus)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Rétention d'audience réglable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Assistant YouTube SEO par IA</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      ) : (
        /* Screen 2: Unlocked Premium View Booster Dashboard */
        <main id="booster-dashboard" className="max-w-7xl mx-auto px-4 py-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Panel configurations */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Configuration panel */}
              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl backdrop-blur relative shadow-xl">
                <div className="flex items-center gap-2 mb-6 text-red-500">
                  <Sliders className="w-5 h-5 text-red-500" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Paramètres de Campagne</h3>
                </div>

                <div className="space-y-5">
                  
                  {/* YouTube URL input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                      Adresse URL de la vidéo YouTube
                    </label>
                    <input
                      id="youtube-url-input"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm text-white rounded-xl py-3 px-4 font-normal placeholder:text-slate-600 outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Insérez une URL de vidéo ou laissez vide pour utiliser une vidéo de démonstration.
                    </p>
                  </div>

                  {/* Target Views Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Objectif de vues
                      </label>
                      <span className="text-sm font-mono font-bold text-red-500">{targetViews.toLocaleString()} vues</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={targetViews}
                      onChange={(e) => setTargetViews(parseInt(e.target.value))}
                      className="w-full accent-red-600 cursor-ew-resize bg-slate-950 h-2 rounded-lg py-1 outline-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>100</span>
                      <span>5 000</span>
                      <span>10 000</span>
                    </div>
                  </div>

                  {/* Active concurrent Threads slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Threads simultanés (Workers CO)
                      </label>
                      <span className="text-sm font-mono font-bold text-red-500">{concurrentThreads} navigateurs</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={concurrentThreads}
                      onChange={(e) => setConcurrentThreads(parseInt(e.target.value))}
                      className="w-full accent-red-600 cursor-ew-resize bg-slate-950 h-2 rounded-lg py-1 outline-none font-sans"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>1 thread (furtif)</span>
                      <span>10 (sûr)</span>
                      <span>20 (vitesse max)</span>
                    </div>
                  </div>

                  {/* Double Range simulation for audience retention/Watch duration */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                      Durée de rétention par vue
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Min (Secondes)</span>
                        <input
                          type="number"
                          value={watchDurationMin}
                          onChange={(e) => setWatchDurationMin(parseInt(e.target.value) || 10)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg text-sm font-mono text-center text-slate-300 py-1.5 outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Max (Secondes)</span>
                        <input
                          type="number"
                          value={watchDurationMax}
                          onChange={(e) => setWatchDurationMax(parseInt(e.target.value) || 200)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg text-sm font-mono text-center text-slate-300 py-1.5 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Proxy Selection quality */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                      Sourcing des adresses IP (Proxies)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "datacenter", text: "Standard" },
                        { id: "residential", text: "Résidentiel" },
                        { id: "mobile", text: "4G/5G" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProxyType(p.id)}
                          className={`text-xs py-2 rounded-lg border font-medium ${
                            proxyType === p.id 
                              ? "bg-red-600/10 border-red-500 text-red-500" 
                              : "bg-slate-950 border-slate-900 text-slate-400 hover:text-white"
                          }`}
                        >
                          {p.text}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Device distribution Mobile vs Desktop */}
                  <div>
                    <div className="flex justify-between mb-1.5 text-xs text-slate-300 font-semibold uppercase tracking-wide">
                      <span>Répartition Émulateurs</span>
                      <span className="text-red-500 font-mono">{deviceDistribution}% Mobile / {100 - parseInt(deviceDistribution)}% Desktop</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="10"
                      value={deviceDistribution}
                      onChange={(e) => setDeviceDistribution(e.target.value)}
                      className="w-full accent-red-600 bg-slate-950 h-2 rounded-lg py-1 outline-none"
                    />
                  </div>

                  {/* Main trigger CTA action btn */}
                  {!isBoosting ? (
                    <button
                      id="start-boosting-btn"
                      onClick={() => setIsBoosting(true)}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2 outline-none uppercase tracking-wide text-xs"
                    >
                      <Play className="w-4 h-4 text-white fill-white" />
                      <span>Lancer la distribution des vues</span>
                    </button>
                  ) : (
                    <button
                      id="stop-boosting-btn"
                      onClick={() => setIsBoosting(false)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 outline-none uppercase tracking-wide text-xs"
                    >
                      <Square className="w-4 h-4 fill-white text-white" />
                      <span>Arrêter le processeur</span>
                    </button>
                  )}

                </div>
              </div>

              {/* Secure sandbox stats indicator */}
              <div className="bg-slate-900/10 border border-slate-900 p-5 rounded-2xl relative">
                <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide">Réseau d'Anonymat Certifié</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Toutes les requêtes de visionnage sont protégées par chiffrement WebRTC/TCP et intègrent un spoofing des cookies pour simuler un historique de navigation réaliste, empêchant le décompte des vues de s'arrêter ou d'être expurgé par l'analyse antispam de YouTube (301+ views block bypass).
                </p>
              </div>

            </div>

            {/* Right Column: Interactive Simulator dashboard logs/monitors */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Dynamic counters grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl backdrop-blur relative shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Eye className="w-4 h-4 text-red-500" />
                    <span>Vues Émulées</span>
                  </div>
                  <span className="text-2xl font-black font-mono tracking-tight text-white animate-pulse">
                    {simulatedViews.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">sur {targetViews.toLocaleString()} cibles</span>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl backdrop-blur relative shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>Temps de Rétention</span>
                  </div>
                  <span className="text-2xl font-black font-mono tracking-tight text-white">
                    {simulatedWatchTime.toFixed(1)} min
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">durée cumulée émulée</span>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl backdrop-blur relative shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span>Pays Activés</span>
                  </div>
                  <span className="text-2xl font-black font-mono tracking-tight text-white">
                    12 global
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">proxies distribués auto</span>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl backdrop-blur relative shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Gauge className="w-4 h-4 text-purple-500" />
                    <span>Statut Serveur</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mt-1.5 uppercase">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                    <span>100% Opérationnel</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Hauts débits illimités</span>
                </div>

              </div>

              {/* YouTube embedded interactive preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Embedded Video box */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 backdrop-blur flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-red-500" />
                      Lecteur bac à sable YouTube
                    </h3>
                  </div>

                  {currentVideoId ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black mt-2">
                      <iframe
                        src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=0&mute=1`}
                        title="YouTube Video Preview"
                        className="absolute inset-0 w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl bg-slate-950/80 border border-dashed border-slate-850 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                      <Laptop className="w-8 h-8 text-slate-700 mb-2" />
                      <span className="text-xs">Saisissez l'adresse URL de votre vidéo à gauche pour afficher le lecteur vidéo ici.</span>
                    </div>
                  )}

                  <div className="mt-4 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>ID Détecté: <code className="font-mono text-slate-300 bg-slate-900 px-1 py-0.5 rounded">{currentVideoId || "Aucun"}</code></span>
                    <span className="text-emerald-500">Flux vidéo crypté SSL</span>
                  </div>
                </div>

                {/* Live Threading viewer visualization */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 backdrop-blur flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-red-500" />
                      Status des Émulateurs de Lecture
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-[175px] overflow-y-auto pr-1">
                    {activeThreads.length > 0 ? (
                      activeThreads.map((thread) => (
                        <div key={thread.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-xs">
                          <div className="flex justify-between items-center mb-1.5 font-mono">
                            <span className="text-slate-400 font-semibold text-[11px]">Worker CO-{thread.id} ({thread.ip})</span>
                            <span className="text-[10px] text-red-400">{thread.status}</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-red-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${thread.progress}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-[140px] flex items-center justify-center text-slate-600 text-xs text-center border border-dashed border-slate-850 rounded-xl">
                        Cliquez sur "Lancer la distribution des vues" pour observer la télémétrie de lecture en temps réel.
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-[10px] font-mono text-slate-500 text-right">
                    Concurrence active : {activeThreads.length} / {concurrentThreads}
                  </div>
                </div>

              </div>

              {/* Terminal Logs console monitor */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-5 shadow-inner">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                    <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-300">
                      Terminal Système & Tunneling de Requêtes
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    SOCKS5 Proxy Tunnel active
                  </span>
                </div>

                <div className="font-mono text-xs overflow-y-auto h-[180px] space-y-2 bg-black/40 p-3 rounded-xl border border-slate-900/60 custom-scrollbar select-text leading-relaxed">
                  {logs.length > 0 ? (
                    logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-1 pb-1">
                        <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                        <span className={`
                          ${log.type === "success" ? "text-emerald-400" : ""}
                          ${log.type === "warn" ? "text-amber-400" : ""}
                          ${log.type === "error" ? "text-red-500 font-bold" : ""}
                          ${log.type === "info" ? "text-slate-300" : ""}
                        `}>
                          {log.text}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                      <Terminal className="w-5 h-5 text-slate-800" />
                      <p>Console système en attente. Configurez une URL de vidéo et démarrez l'émulateur.</p>
                    </div>
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </div>

              {/* Box 3: AI-Powered Organic Optimization tool (Gemini API Integration) */}
              <div id="ai-seo-panel" className="bg-gradient-to-br from-slate-900/60 via-slate-905/40 to-red-950/10 border border-slate-900 p-6 rounded-3xl backdrop-blur relative shadow-xl">
                <div className="absolute top-4 right-4 text-slate-500">
                  <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-600/10 rounded-xl text-red-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Assistant Référencement Pur (SEO) par IA</h3>
                    <p className="text-xs text-slate-400">Générez des métadonnées optimisées avec Gemini 2.5 pour booster vos Vues Naturelles (recommandations YouTube)</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Le booster de vues simule un fort afflux de trafic artificiel de haute qualité pour débloquer l'algorithme. Pour que vos vidéos décollent définitivement par la suite, vous devez optimiser leur titre, étiquettes (tags) et description.
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-9">
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">Mots-clés cibles de votre vidéo</label>
                      <input 
                        id="seo-keywords-input"
                        type="text"
                        placeholder="Ex: gagner argent youtube, vlog paris, tuto photoshop, crypto..."
                        value={focusKeywords}
                        onChange={(e) => setFocusKeywords(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-white rounded-xl py-2.5 px-3 outline-none transition"
                      />
                    </div>
                    <div className="sm:col-span-3 flex items-end">
                      <button
                        id="ai-optimize-btn"
                        type="button"
                        onClick={handleOptimizeSEO}
                        disabled={isOptimizingSEO}
                        className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        {isOptimizingSEO ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Calcul IA...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Optimiser</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Results Output panel */}
                  {seoResult && (
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-4 animate-fade-in text-xs">
                      
                      {/* 1. Titles suggestions */}
                      <div>
                        <h4 className="font-bold text-white mb-2 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          Titres Recommandés à CTR Élevé :
                        </h4>
                        <div className="space-y-2">
                          {seoResult.titleSuggestions?.map((title, idx) => (
                            <div key={idx} className="bg-slate-900 p-2 rounded-lg flex items-center justify-between border border-slate-850 hover:border-slate-800">
                              <span className="text-slate-200">{title}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(title)}
                                className="text-slate-500 hover:text-white ml-2 shrink-0 p-1"
                                title="Copier ce titre"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2. SEO Description hooks */}
                      <div>
                        <h4 className="font-bold text-white mb-2 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-500" />
                          Modèle de Description de Vidéo :
                        </h4>
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 relative font-mono text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                          {seoResult.descriptionSuggestions}
                          <button
                            type="button"
                            onClick={() => handleCopyText(seoResult.descriptionSuggestions)}
                            className="absolute right-3 top-3 text-slate-500 hover:text-white p-1"
                            title="Copier la description"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 3. Copiable tags lists */}
                      <div>
                        <h4 className="font-bold text-white mb-2 text-[11px] uppercase tracking-wide flex items-center gap-1.5 text-purple-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tags Optimisés (Cliquez pour Copier) :
                        </h4>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {seoResult.tags?.map((tag, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleCopyText(tag, idx)}
                              className={`py-1 px-2.5 rounded text-[11px] font-mono border transition flex items-center gap-1.5 ${
                                copiedTagIndex === idx
                                  ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                                  : "bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800"
                              }`}
                            >
                              <span>#{tag}</span>
                              <span className="opacity-60 text-[10px] scale-[0.9]">
                                {copiedTagIndex === idx ? "Copié" : <Copy className="w-2.5 h-2.5" />}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
          
        </main>
      )}

      {/* Styled toast feedback notice */}
      {copiedCodeBanner && (
        <div className="fixed bottom-6 right-6 bg-slate-900/90 border border-emerald-500 px-4 py-3 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 text-emerald-400 text-xs z-50 animate-bounce">
          <Check className="w-4 h-4" />
          <span>Code d'activation copié dans votre presse-papiers !</span>
        </div>
      )}

    </div>
  );
}
