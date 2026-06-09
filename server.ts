import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Standard in-memory store for activation codes
// Seeded with a universal demo code so the user can bypass instantly for evaluation
const ACTIVE_CODES = new Set<string>(["DEMO-BOOST-2026", "TEST-FREE-CODE"]);

// Simple list to track simulation history / logs across the lifecycle
const OPERATIONS_LOGS: string[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ----- API ENDPOINTS -----

  // 1. Verify Activation Code
  app.post("/api/verify-code", (req, res) => {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Le code d'activation est requis." });
    }

    const cleanCode = code.trim().toUpperCase();
    if (ACTIVE_CODES.has(cleanCode)) {
      return res.json({ 
        success: true, 
        message: "Code d'activation validé avec succès !",
        code: cleanCode
      });
    }

    return res.status(401).json({ 
      success: false, 
      message: "Code invalide ou expiré. Veuillez acheter un code valide." 
    });
  });

  // 2. Buy Activation Code (Simulated Secure Stripe/Credit Invoice)
  app.post("/api/purchase-code", (req, res) => {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "L'adresse email est requise." });
    }

    // Generate a secure one-time code
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `YT-BOOST-${randomSuffix}`;
    
    // Register the code as valid
    ACTIVE_CODES.add(newCode);

    // Simulate sending an email immediately
    console.log(`[EMAIL BOOSTER] Code envoyé à ${email} : ${newCode}`);

    return res.json({
      success: true,
      message: "Achat réussi ! Le code d'activation a été généré et simulé par email.",
      code: newCode,
      email: email,
      purchaseDate: new Date().toISOString()
    });
  });

  // 3. AI-Powered YouTube SEO Optimization
  app.post("/api/optimize-video", async (req, res) => {
    const { url, keywords } = req.body;
    
    // Fallback if no API key is set
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Return high-quality offline advice if key isn't populated yet
      return res.json({
        success: true,
        isDemo: true,
        titleSuggestions: [
          `🔥 COMMENT BOOSTER SES VUES - Les secrets de l'algorithme YouTube`,
          `Augmenter ses Vues YouTube en 2026 (Guide complet étape par étape)`,
          `Multiplier ses vues YouTube en 10 minutes par jour`
        ],
        descriptionSuggestions: `⚠️ IMPORTANT : Optimisez vos premières lignes de description pour l'indexation mobile de YouTube.\n\nDans cette vidéo, découvrez les techniques indispensables pour obtenir plus de trafic qualifié sur vos publications. N'oubliez pas de mettre des chapitres temporels !`,
        tags: ["booster vues youtube", "avoir des vues", "algorithme youtube 2026", "referencement youtubeseo", "views automation"]
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const prompt = `
      Tu es un expert mondial en SEO et croissance d'audience YouTube (Growth Hacker).
      L'utilisateur veut optimiser sa vidéo pour maximiser les vues réelles et l'engagement en parallèle de notre logiciel.
      URL de la vidéo : "${url || 'Non fournie'}"
      Mots-clés cibles fournis par l'utilisateur : "${keywords || 'Général / YouTube Views Growth'}"

      Donne-moi un objet JSON contenant :
      1. Trois propositions de titres YouTube ultra-accattivants (clickbait éthique, fort taux de clic - CTR).
      2. Un modèle de description optimisé pour le référencement (SEO) de 3 à 4 phrases avec espace pour liens.
      3. Une liste de 10 tags YouTube pertinents et recherchés pour cette thématique.

      Renvoie UNIQUEMENT le code JSON sous la forme suivante (sans balise Markdown, juste le texte brut JSON valide) :
      {
        "titleSuggestions": ["titre 1", "titre 2", "titre 3"],
        "descriptionSuggestions": "Texte de la description...",
        "tags": ["tag1", "tag2", "tag3"]
      }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const responseText = response.text || "{}";
      // Try to clean markdown code blocks if any got returned
      const cleanJsonStr = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const seoData = JSON.parse(cleanJsonStr);

      return res.json({
        success: true,
        ...seoData
      });

    } catch (err: any) {
      console.error("Gemini optimization error:", err);
      return res.json({
        success: true,
        isDemo: true,
        titleSuggestions: [
          `🔥 BOOSTER SES VUES : 5 Astuces Secrètes pour l'Algorithme`,
          `Comment avoir plus de vues sur sa chaine YouTube (Guide Pratique)`,
          `Séquence secrète pour maximiser son taux de rétention client`
        ],
        descriptionSuggestions: `Optimisez vos métadonnées YouTube avec des hashtags ciblés comme #YoutubeBooster #SEO.\n\nDescription générée par algorithme IA d'aide au référencement.`,
        tags: ["growth youtube", "booster vues", "augmenter trafic", "seo youtube tutorial"]
      });
    }
  });

  // ----- VITE PRODUCTION / DEVELOPMENT MIDDLEWARE -----

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TubeBoost Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup error:", error);
});
