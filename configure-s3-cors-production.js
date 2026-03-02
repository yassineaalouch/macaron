/**
 * Script pour configurer CORS sur le bucket S3 de PRODUCTION
 * 
 * Exécuter avec: node configure-s3-cors-production.js
 * 
 * Ce script configure CORS sur le bucket R2 (AWS_BUCKET_NAME).
 *
 * Assurez-vous d'avoir les variables d'environnement configurées:
 * - AWS_ACCESS_KEY_ID (credentials R2)
 * - AWS_SECRET_ACCESS_KEY (credentials R2)
 * - AWS_BUCKET_NAME (ex: macaron)
 * - R2_ENDPOINT (endpoint Cloudflare R2)
 */

const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

// Fonction pour charger les variables d'environnement depuis .env
function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  
  if (!fs.existsSync(envPath)) {
    console.log("⚠️  Fichier .env non trouvé. Utilisation des variables d'environnement système.");
    return;
  }

  try {
    // Essayer d'abord avec dotenv si disponible
    require("dotenv").config();
    console.log("✅ Variables d'environnement chargées via dotenv");
  } catch (e) {
    // Si dotenv n'est pas disponible, parser manuellement le fichier .env
    console.log("📝 Lecture manuelle du fichier .env...");
    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split("\n");

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      // Ignorer les lignes vides et les commentaires
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const equalIndex = trimmedLine.indexOf("=");
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          let value = trimmedLine.substring(equalIndex + 1).trim();
          
          // Enlever les guillemets si présents
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          // Ne pas écraser les variables d'environnement système si elles existent déjà
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    console.log("✅ Variables d'environnement chargées depuis .env");
  }
}

// Charger les variables d'environnement
loadEnvFile();

const r2Endpoint = process.env.R2_ENDPOINT?.trim();
const PRODUCTION_BUCKET = process.env.AWS_BUCKET_NAME || "macaron";

const s3 = new S3Client({
  region: process.env.AWS_REGION?.trim() || "auto",
  endpoint: r2Endpoint || undefined,
  forcePathStyle: !!r2Endpoint,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function configureCORS() {
  try {
    // Vérifier que les credentials sont présents
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error("❌ AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY sont requis");
      console.error("💡 Assurez-vous d'utiliser les credentials AWS de PRODUCTION");
      process.exit(1);
    }

    console.log("🔧 Configuration CORS pour le bucket R2:", PRODUCTION_BUCKET);
    console.log("📍 Région:", process.env.AWS_REGION?.trim() || "auto");
    console.log("🔑 Access Key ID:", process.env.AWS_ACCESS_KEY_ID?.substring(0, 8) + "...");

    const corsConfigPath = path.join(__dirname, "s3-cors-config.json");
    const corsConfig = JSON.parse(fs.readFileSync(corsConfigPath, "utf8"));

    const command = new PutBucketCorsCommand({
      Bucket: PRODUCTION_BUCKET,
      CORSConfiguration: corsConfig
    });

    await s3.send(command);
    console.log("\n✅ Configuration CORS appliquée avec succès sur le bucket:", PRODUCTION_BUCKET);
    console.log("🌐 Origines autorisées:", corsConfig.CORSRules[0].AllowedOrigins.join(", "));
    console.log("\n✨ Les uploads depuis votre site devraient maintenant fonctionner!");
  } catch (error) {
    console.error("\n❌ Erreur lors de la configuration CORS:", error.message);
    if (error.name === "AccessDenied") {
      console.error("💡 Vérifiez que vos credentials R2 ont les permissions nécessaires (s3:PutBucketCors)");
    } else if (error.name === "NoSuchBucket") {
      console.error("💡 Le bucket", PRODUCTION_BUCKET, "n'existe pas ou n'est pas accessible");
    }
    process.exit(1);
  }
}

configureCORS();
