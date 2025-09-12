# Railway Backend Environment Variables - UPDATED

## ✅ **Use these variables for Railway (Backend)**

```bash
# Database
MONGODB_URI=mongodb+srv://vrfans11:LZa9dOgq3PhS0zxN@vrfanscluster.lt8bt55.mongodb.net/MedusaFriendly?retryWrites=true&w=majority
DB_NAME=MedusaFriendly

# Application
APP_ENV=production
AI_BEHAVIOR_PROMPT=Stay in character
NODE_ENV=production
PORT=5002

# JWT
JWT_SECRET=2bc8cb947bb92f53f388e9988dd60e7b418e7f4dba1eaa44a392275bf5f1bfce
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./service-account.json
FIREBASE_PROJECT_ID=vrfans-firebase
GOOGLE_CLIENT_ID=84702763507-leeq3psd8njuou9jb5knc9evi2ccs5ri.apps.googleusercontent.com

# AI Services
REPLICATE_API_TOKEN=r8_SS5XtncE37XJIkvS260OSS04M8yyTwN3J00Mu
OPENROUTER_API_KEY=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
VOICE_AI_MODEL=mistralai/mistral-nemo
MODELSLAB_API=0TojvyqnZWHhjGxfgh3FOLjwXkgU8PpD61VtcOZowRSFrRCB8buBtmwst4ZL

# Payment
NOWPAYMENTS_API_KEY=AW2EC3D-5W6MVX4-NSAGFPA-PGP4451
NOWPAYMENTS_IPN_SECRET=1kj1zyaEdWCjKevFkQ8zSuEUKEVdjdC3

# Voice AI
DEEPGRAM_PROJECT_ID=65e4cdff-3f8d-4742-b0aa-dd1ad7d4dda1
DEEPGRAM_API_KEY=2e367cdd836ccbef9a919f0e0138c25988a2cf38
DEEPGRAM_EMAIL=aregar20012001@gmail.com

# RunPod
RUNPOD_REALISTIC_URL=https://znyodao3q2vg1g-7860.proxy.runpod.net
RUNPOD_ANIME_CARTOON_FANTASY_URL=https://znyodao3q2vg1g-7861.proxy.runpod.net
RUNPOD_WEBUI_URL=https://znyodao3q2vg1g-7861.proxy.runpod.net

# Bunny CDN
BUNNY_API_KEY=6b2b0772-f53d-4d92-84f8-cbc06e0485a604e6e5d7-709a-49ce-93e9-525d8d0e8f0a
BUNNY_PASSWORD=7Fb*_ja6cs-nbQ5
BUNNY_EMAIL=vrfans11@gmail.com
BUNNY_ACCESS_KEY=a2653876-2781-44bf-a09ce3b45f20-51d9-4063
BUNNY_FTP_AND_API_PASSWORD=a2653876-2781-44bf-a09ce3b45f20-51d9-4063
BUNNY_STORAGE_API_HOST=https://storage.bunnycdn.com
BUNNY_STORAGE_ZONE_NAME=medusavr
BUNNY_LINKED_HOSTNAMES=medusavr.b-cdn.net

# Twilio
TWILIO_RECOVERY_CODE=MXJN8ZAF4E8JH76ANU9GMA18

# CORS - UPDATED WITH YOUR VERCEL URL
FRONTEND_URL=https://medusa-vrfriendly.vercel.app
```

## 🔧 **Key Changes Made:**

1. **Database**: Changed to use `MedusaFriendly` database
2. **Environment**: Set to `production`
3. **CORS**: Updated `FRONTEND_URL` to your actual Vercel URL: `https://medusa-vrfriendly.vercel.app`
4. **Removed**: All `VITE_*` variables (these are for frontend only)
