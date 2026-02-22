# Guide Complet : Déploiement App Store Connect & RevenueCat

Étant donné que ton application fonctionne **sans authentification** et **sans base de données externes** concernant les utilisateurs (tout est fait avec l'ID anonyme de l'appareil par RevenueCat), le processus de soumission est très simplifié. 

Il n'y a **aucun tracking**, et donc aucune popup ATT n'est nécessaire. Voici les étapes exactes de A à Z.

---

## 🟢 ÉTAPE 1 : Configuration sur App Store Connect

### 1. Création de l'App Store App
- Rend-toi sur **App Store Connect** > **Apps** > **+ Nouvelle app**.
- **Plateformes** : iOS
- **Nom** : Promptia — AI Prompt Builder *(ou juste "Promptia" si c'est pris)*
- **Langue Principale** : Anglais (US) ou Français, en fonction de ta cible première.
- **Référence (SKU)** : `promptia.app.001` (ce que tu veux, c'est interne).
- **ID de lot (Bundle ID)** : `app.rork.promptia-prompt-builder` (Celui que tu as dans ton `app.json`).

### 2. Formulaire de Confidentialité de l'App (App Privacy)
Comme tu n'as ni tracking ni base de données, tu ne collectes PRESQUE rien.
- Va dans l'onglet **Confidentialité de l'app (App Privacy)** de ton app.
- Clique sur **Commencer (Get Started)**.
- Collectez-vous des données ? **OUI** (car RevenueCat collecte les données d'achat).
- Coche uniquement : **Achats (Purchases)**.
- Ensuite, la plateforme te demande si ces achats sont liés à l'identité de l'utilisateur. Tu réponds : **NON** (car c'est 100% anonyme sur l'appareil).
- Est-ce que ces données servent pour le suivi (Tracking) ? **NON**.
- N'oublie pas de fournir une **URL de Politique de Confidentialité** (crée vite une petite page Notion publique ou un site simple avec les conditions, tu peux le faire en 5 min).

### 3. Les Achats Intégrés (In-App Purchases) - Création
Tu dois créer 3 abonnements depuis la section **App Store > Abonnements (Subscriptions)** sur App Store Connect.
- Crée un **Groupe d'Abonnement** : "Promptia Pro"
- Crée les 3 abonnements (renouvellement automatique) un par un avec tes prix.
- Les champs **Product ID** sont VITALEMENT IMPORTANTS. Par exemple :
  - Hebdomadaire : `promptia_weekly`
  - Mensuel : `promptia_monthly`
  - Annuel : `promptia_annual`
- Tu devras ajouter une petite description et un nom (ex: "Promptia Pro Monthly") pour chaque, validés par l'équipe Apple.

### 4. Le Graal : L'App-Specific Shared Secret 🔑
- Va dans **Utilisateurs et accès** (en haut de l'écran App Store Connect) puis onglet **Intégrations > Achats intégrés**.
- Clique sur **Générer le secret partagé pour les achats intégrés de cette app**.
- **Copie ce code**. Il va servir pour RevenueCat !

---

## 🟣 ÉTAPE 2 : Configuration sur RevenueCat

Tu utilises déjà RevenueCat, mais la liaison avec Apple est obligatoire.

### 1. Ajout de l'App (iOS)
- Connecte-toi sur le dashboard RevenueCat.
- Va dans ton projet, puis **Project Settings > Apps > Add New App > iOS**.
- Renseigne le nom de l'app et ton **Bundle ID** (`app.rork.promptia-prompt-builder`).
- Colle le **Shared Secret** que tu as obtenu à l'étape d'avant.

### 2. Configuration des Products
- Va dans l'onglet **Products** sur RevenueCat.
- Ajoute tes 3 abonnements en rentrant **exactement le même Product ID** que dans App Store Connect (ex: `promptia_weekly`, `promptia_monthly`, `promptia_annual`).

### 3. Configuration de l'Entitlement
- Va dans l'onglet **Entitlements**. C'est ce qui définit si l'utilisateur a débloqué le "Pro".
- Ajoute un Entitlement (ex: `Pro`).
- Associe tes 3 Products à cet Entitlement `Pro`.

### 4. Configuration de l'Offering
- Va de l'onglet **Offerings**. C'est le "pack" que tu pousses dans l'appli.
- Crée une Offering (l'identifiant standard est souvent `default`).
- Dans cette Offering, ajoute des "Packages". Un pour chaque abonnement (Weekly, Monthly, Annual).
- Attache chaque Package au Product RevenueCat correspondant.

**➡️ La boucle est bouclée ! Ton application en appelant RevenueCat recevra bien les 3 packages et pourra demander à Apple de procéder au paiement.**

---

## 🚀 ÉTAPE 3 : Remplissage de la Fiche et Envoi

Retourne sur la fiche de ton app dans App Store Connect.

### Textes pour App Store (Anglais)

**Titre de l'app:** Promptia: AI Prompt Builder
**Sous-titre:** Reverse-engineer any image.

**Description:**
> Welcome to Promptia, the ultimate tool to give you an unfair advantage in AI. Whether you are generating images, writing copy, or crafting video scripts, the quality of your output depends entirely on the quality of your prompt. 
> 
> Promptia helps you effortlessly build, organize, and reverse-engineer the perfect prompts so you never stare at a blank screen again.
> 
> Features:
> • Prompt Library: Save, organize, and remix your best prompts for Midjourney, ChatGPT, SDXL, and Video models.
> • Image-to-Prompt (Reverse Prompt): Drop any image into the app and instantly extract the exact prompt needed to recreate it. 
> • Lightning Fast: Native and designed for power users with a premium glassmorphic interface.
> • Copy & Share: Grab your prompts in one tap and send them straight to your favorite AI generator.
> 
> Upgrade to Promptia Pro for unlimited prompt generations, infinite reverse image processing, and full library access.

**Mots clés:** AI prompt, midjourney, chatgpt, image generation, reverse prompt, productivity, utilities

### Instructions pour l'équipe de validation (Notes for Review)
Quand tu soumettras l'app, Apple voudra un compte de test. **Désactive l'option "Sign-in required"** et mets ce texte dans la case "Notes" (c'est très important pour éviter les refus de ceux qui ne comprennent pas l'app) :

> *"Our application does not require user authentication or any database connection. We use RevenueCat's anonymous device-based IDs to sync subscription states. 
> 
> Please skip the onboarding to view the Paywall. The app offers standard Auto-Renewable Subscriptions. Once simulated as 'Pro', you can test the reverse prompt system (give it any image and it creates a text prompt for it) and test saving prompts into the local device library. Thank you!"*

### Finalisation
- Ajoute les **Screenshots** (Fais des belles maquettes de ton app pour la taille 6.5 pouces).
- Pousse ton build via **EAS Build** (`npx eas build --platform ios --profile production`)
- Récupère le sur **TestFlight**, installe le sur ton téléphone pour un ultime test en sandbox.
- Clique sur **Send for Review** ! 🎉
