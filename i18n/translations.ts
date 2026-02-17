export type Language = 'en' | 'fr' | 'it' | 'de' | 'es';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
  es: 'Español',
};

type TranslationKeys = {
  tabs: { discover: string; create: string; library: string; settings: string; reverse: string };
  create: {
    title: string; quick: string; advanced: string; describeIdea: string;
    generatePrompt: string; generatedPrompt: string; describeWhat: string;
    whatCreating: string; chooseCategory: string; describePrompt: string;
    beSpecific: string; whatAchieve: string; fineTune: string; customizeTone: string;
    tone: string; length: string; outputFormat: string; lighting: string;
    cameraAngle: string; negativePrompt: string; audience: string; constraints: string;
    whoIsFor: string; anyRules: string; style: string; next: string; back: string;
    generate: string; newPrompt: string; assumptions: string; warnings: string;
    suggestions: string; copied: string; saved: string; savedAlert: string;
    emptyPrompt: string; emptyPromptMsg: string; pro: string;
    category: string; details: string; options: string; result: string; generating: string;
  };
  discover: {
    title: string; subtitle: string; searchPlaceholder: string; all: string;
    text: string; image: string; video: string; editorPicks: string;
    noPrompts: string; adjustSearch: string; pick: string;
  };
  library: {
    title: string; searchPlaceholder: string; all: string; favorites: string;
    text: string; image: string; video: string; copy: string; remix: string;
    delete: string; deleteTitle: string; deleteMsg: string; cancel: string;
    noPrompts: string; noPromptsMsg: string; noResults: string; noResultsMsg: string;
  };
  settings: {
    title: string; support: string; contactSupport: string; rateApp: string;
    rateAppSub: string; faq: string; legal: string; privacyPolicy: string;
    termsOfUse: string; data: string; savedPrompts: string; promptsStored: string;
    clearAll: string; clearAllSub: string; clearAllTitle: string; clearAllMsg: string;
    clearHistory: string; clearHistorySub: string;
    cancel: string; appearance: string; darkMode: string; darkModeSub: string;
    language: string; languageSub: string; footer: string; version: string;
    selectLanguage: string;
  };
  reverse: {
    title: string; subtitle: string; pickImage: string; pickDesc: string;
    takePhoto: string; changeImage: string; analyze: string; analyzing: string;
    analyzingSub: string; resultTitle: string; copy: string; save: string;
    retry: string; tip: string;
  };
  detail: {
    promptSegments: string; tags: string; copyFull: string; remixBuilder: string;
    editorPick: string; notFound: string;
  };
  tones: { professional: string; casual: string; creative: string; technical: string; persuasive: string; academic: string };
  lengths: { concise: string; medium: string; detailed: string; exhaustive: string };
};

const en: TranslationKeys = {
  tabs: { discover: 'Discover', create: 'Create', library: 'Library', settings: 'Settings', reverse: 'Reverse' },
  create: {
    title: 'Create', quick: 'Quick', advanced: 'Advanced',
    describeIdea: 'Describe your idea in detail...',
    generatePrompt: 'Generate Prompt', generatedPrompt: 'Generated Prompt',
    describeWhat: 'Describe what you need', whatCreating: 'What are you creating?',
    chooseCategory: 'Choose a category to get started',
    describePrompt: 'Describe your prompt',
    beSpecific: 'Be as specific as possible for better results',
    whatAchieve: 'What do you want to achieve?',
    fineTune: 'Fine-tune options', customizeTone: 'Customize tone, length, and more',
    tone: 'Tone', length: 'Length', outputFormat: 'Output Format',
    lighting: 'Lighting', cameraAngle: 'Camera Angle', negativePrompt: 'Negative Prompt',
    audience: 'Audience', constraints: 'Constraints', whoIsFor: 'Who is this for?',
    anyRules: 'Any specific rules or limitations...', style: 'Style',
    next: 'Next', back: 'Back', generate: 'Generate', newPrompt: 'New Prompt',
    assumptions: 'Assumptions', warnings: 'Warnings', suggestions: 'Suggestions',
    copied: 'Copied!', saved: 'Saved', savedAlert: 'Prompt saved to your library.',
    emptyPrompt: 'Empty Prompt', emptyPromptMsg: 'Please describe what you want to create.',
    pro: 'Pro', category: 'Category', details: 'Details', options: 'Options', result: 'Result', generating: 'Generating…',
  },
  reverse: {
    title: 'Reverse Prompt', subtitle: 'Upload an image and AI will reverse-engineer the perfect prompt to recreate it',
    pickImage: 'Choose from Library', pickDesc: 'Select any image from your photo library',
    takePhoto: 'Take a Photo', changeImage: 'Change', analyze: 'Analyze Image',
    analyzing: 'Analyzing your image...', analyzingSub: 'AI is studying every detail',
    resultTitle: 'Reconstructed Prompt', copy: 'Copy', save: 'Save', retry: 'Retry',
    tip: 'Tip: Paste this prompt into Midjourney, DALL-E, or Stable Diffusion to recreate similar results',
  },
  discover: {
    title: 'Discover', subtitle: 'Explore Prompts',
    searchPlaceholder: 'Search prompts, tags, models...',
    all: 'All', text: 'Text', image: 'Image', video: 'Video',
    editorPicks: 'Editor Picks', noPrompts: 'No prompts found',
    adjustSearch: 'Try adjusting your search or filters', pick: 'Pick',
  },
  library: {
    title: 'Library', searchPlaceholder: 'Search your prompts...',
    all: 'All', favorites: 'Favorites', text: 'Text', image: 'Image', video: 'Video',
    copy: 'Copy', remix: 'Remix', delete: 'Delete', deleteTitle: 'Delete Prompt',
    deleteMsg: 'Are you sure you want to delete this prompt?', cancel: 'Cancel',
    noPrompts: 'No prompts yet', noPromptsMsg: 'Create your first prompt and it will appear here',
    noResults: 'No results', noResultsMsg: 'Try a different search term or filter',
  },
  settings: {
    title: 'Settings', support: 'Support', contactSupport: 'Contact Support',
    rateApp: 'Rate the App', rateAppSub: 'Help us improve', faq: 'FAQ & Help Center',
    legal: 'Legal', privacyPolicy: 'Privacy Policy', termsOfUse: 'Terms of Use',
    data: 'Data', savedPrompts: 'Saved Prompts', promptsStored: 'prompts stored locally',
    clearAll: 'Clear All Data', clearAllSub: 'Delete all saved prompts',
    clearAllTitle: 'Clear All Data',
    clearAllMsg: 'This will permanently delete all saved prompts. This action cannot be undone.',
    clearHistory: 'Clear Generation History', clearHistorySub: 'Remove all recent generations',
    cancel: 'Cancel', appearance: 'Appearance', darkMode: 'Dark Mode',
    darkModeSub: 'Switch to dark theme', language: 'Language',
    languageSub: 'Choose your language',
    footer: 'All data is stored locally on your device.', version: 'Version',
    selectLanguage: 'Select Language',
  },
  detail: {
    promptSegments: 'Prompt Segments', tags: 'Tags', copyFull: 'Copy Full Prompt',
    remixBuilder: 'Remix in Builder', editorPick: 'Editor Pick', notFound: 'Prompt not found',
  },
  tones: { professional: 'Professional', casual: 'Casual', creative: 'Creative', technical: 'Technical', persuasive: 'Persuasive', academic: 'Academic' },
  lengths: { concise: 'Concise', medium: 'Medium', detailed: 'Detailed', exhaustive: 'Exhaustive' },
};

const fr: TranslationKeys = {
  tabs: { discover: 'Explorer', create: 'Créer', library: 'Bibliothèque', settings: 'Réglages', reverse: 'Reverse' },
  create: {
    title: 'Créer', quick: 'Rapide', advanced: 'Avancé',
    describeIdea: 'Décrivez votre idée en détail...',
    generatePrompt: 'Générer le Prompt', generatedPrompt: 'Prompt Généré',
    describeWhat: 'Décrivez ce dont vous avez besoin',
    whatCreating: 'Que créez-vous ?',
    chooseCategory: 'Choisissez une catégorie pour commencer',
    describePrompt: 'Décrivez votre prompt',
    beSpecific: 'Soyez aussi précis que possible',
    whatAchieve: 'Que voulez-vous accomplir ?',
    fineTune: 'Affiner les options', customizeTone: 'Personnalisez le ton, la longueur et plus',
    tone: 'Ton', length: 'Longueur', outputFormat: 'Format de sortie',
    lighting: 'Éclairage', cameraAngle: 'Angle de caméra', negativePrompt: 'Prompt négatif',
    audience: 'Public cible', constraints: 'Contraintes', whoIsFor: 'Pour qui est-ce ?',
    anyRules: 'Règles ou limitations spécifiques...', style: 'Style',
    next: 'Suivant', back: 'Retour', generate: 'Générer', newPrompt: 'Nouveau Prompt',
    assumptions: 'Hypothèses', warnings: 'Avertissements', suggestions: 'Suggestions',
    copied: 'Copié !', saved: 'Sauvegardé', savedAlert: 'Prompt sauvegardé dans votre bibliothèque.',
    emptyPrompt: 'Prompt vide', emptyPromptMsg: 'Veuillez décrire ce que vous voulez créer.',
    pro: 'Pro', category: 'Catégorie', details: 'Détails', options: 'Options', result: 'Résultat', generating: 'Génération…',
  },
  reverse: {
    title: 'Reverse Prompt', subtitle: "Importez une image et l'IA retrouvera le prompt parfait pour la recréer",
    pickImage: 'Choisir depuis la galerie', pickDesc: 'Sélectionnez une image de votre bibliothèque',
    takePhoto: 'Prendre une photo', changeImage: 'Changer', analyze: 'Analyser l\'image',
    analyzing: 'Analyse en cours...', analyzingSub: "L'IA étudie chaque détail",
    resultTitle: 'Prompt reconstruit', copy: 'Copier', save: 'Sauvegarder', retry: 'Réessayer',
    tip: 'Astuce : Collez ce prompt dans Midjourney, DALL-E ou Stable Diffusion pour recréer des résultats similaires',
  },
  discover: {
    title: 'Explorer', subtitle: 'Explorer les Prompts',
    searchPlaceholder: 'Rechercher prompts, tags, modèles...',
    all: 'Tout', text: 'Texte', image: 'Image', video: 'Vidéo',
    editorPicks: 'Sélection', noPrompts: 'Aucun prompt trouvé',
    adjustSearch: 'Essayez de modifier votre recherche', pick: 'Choix',
  },
  library: {
    title: 'Bibliothèque', searchPlaceholder: 'Rechercher vos prompts...',
    all: 'Tout', favorites: 'Favoris', text: 'Texte', image: 'Image', video: 'Vidéo',
    copy: 'Copier', remix: 'Remixer', delete: 'Supprimer', deleteTitle: 'Supprimer le Prompt',
    deleteMsg: 'Êtes-vous sûr de vouloir supprimer ce prompt ?', cancel: 'Annuler',
    noPrompts: 'Aucun prompt', noPromptsMsg: 'Créez votre premier prompt',
    noResults: 'Aucun résultat', noResultsMsg: 'Essayez un autre terme de recherche',
  },
  settings: {
    title: 'Réglages', support: 'Assistance', contactSupport: 'Contacter le support',
    rateApp: "Noter l'application", rateAppSub: 'Aidez-nous à nous améliorer',
    faq: "FAQ & Centre d'aide", legal: 'Mentions légales',
    privacyPolicy: 'Politique de confidentialité', termsOfUse: "Conditions d'utilisation",
    data: 'Données', savedPrompts: 'Prompts sauvegardés', promptsStored: 'prompts stockés localement',
    clearAll: 'Effacer toutes les données', clearAllSub: 'Supprimer tous les prompts',
    clearAllTitle: 'Effacer toutes les données',
    clearAllMsg: 'Cela supprimera définitivement tous les prompts. Cette action est irréversible.',
    clearHistory: "Effacer l'historique", clearHistorySub: 'Supprimer les générations récentes',
    cancel: 'Annuler', appearance: 'Apparence', darkMode: 'Mode sombre',
    darkModeSub: 'Passer au thème sombre', language: 'Langue',
    languageSub: 'Choisissez votre langue',
    footer: 'Toutes les données sont stockées localement.', version: 'Version',
    selectLanguage: 'Choisir la langue',
  },
  detail: {
    promptSegments: 'Segments du Prompt', tags: 'Tags', copyFull: 'Copier le prompt complet',
    remixBuilder: 'Remixer dans le Builder', editorPick: "Choix de l'éditeur", notFound: 'Prompt introuvable',
  },
  tones: { professional: 'Professionnel', casual: 'Décontracté', creative: 'Créatif', technical: 'Technique', persuasive: 'Persuasif', academic: 'Académique' },
  lengths: { concise: 'Concis', medium: 'Moyen', detailed: 'Détaillé', exhaustive: 'Exhaustif' },
};

const it: TranslationKeys = {
  tabs: { discover: 'Scopri', create: 'Crea', library: 'Libreria', settings: 'Impostazioni', reverse: 'Reverse' },
  create: {
    title: 'Crea', quick: 'Rapido', advanced: 'Avanzato',
    describeIdea: 'Descrivi la tua idea in dettaglio...',
    generatePrompt: 'Genera Prompt', generatedPrompt: 'Prompt Generato',
    describeWhat: 'Descrivi cosa ti serve', whatCreating: 'Cosa stai creando?',
    chooseCategory: 'Scegli una categoria per iniziare',
    describePrompt: 'Descrivi il tuo prompt',
    beSpecific: 'Sii il più specifico possibile',
    whatAchieve: 'Cosa vuoi ottenere?',
    fineTune: 'Opzioni avanzate', customizeTone: 'Personalizza tono, lunghezza e altro',
    tone: 'Tono', length: 'Lunghezza', outputFormat: 'Formato output',
    lighting: 'Illuminazione', cameraAngle: 'Angolo camera', negativePrompt: 'Prompt negativo',
    audience: 'Pubblico', constraints: 'Vincoli', whoIsFor: 'Per chi è?',
    anyRules: 'Regole o limitazioni specifiche...', style: 'Stile',
    next: 'Avanti', back: 'Indietro', generate: 'Genera', newPrompt: 'Nuovo Prompt',
    assumptions: 'Ipotesi', warnings: 'Avvisi', suggestions: 'Suggerimenti',
    copied: 'Copiato!', saved: 'Salvato', savedAlert: 'Prompt salvato nella tua libreria.',
    emptyPrompt: 'Prompt vuoto', emptyPromptMsg: 'Descrivi cosa vuoi creare.',
    pro: 'Pro', category: 'Categoria', details: 'Dettagli', options: 'Opzioni', result: 'Risultato', generating: 'Generazione…',
  },
  reverse: {
    title: 'Reverse Prompt', subtitle: 'Carica un\'immagine e l\'IA ricostruirà il prompt perfetto per ricrearla',
    pickImage: 'Scegli dalla libreria', pickDesc: 'Seleziona un\'immagine dalla tua libreria foto',
    takePhoto: 'Scatta una foto', changeImage: 'Cambia', analyze: 'Analizza immagine',
    analyzing: 'Analisi in corso...', analyzingSub: "L'IA sta studiando ogni dettaglio",
    resultTitle: 'Prompt ricostruito', copy: 'Copia', save: 'Salva', retry: 'Riprova',
    tip: 'Suggerimento: Incolla questo prompt in Midjourney, DALL-E o Stable Diffusion per ricreare risultati simili',
  },
  discover: {
    title: 'Scopri', subtitle: 'Esplora i Prompt',
    searchPlaceholder: 'Cerca prompt, tag, modelli...',
    all: 'Tutti', text: 'Testo', image: 'Immagine', video: 'Video',
    editorPicks: 'Scelti', noPrompts: 'Nessun prompt trovato',
    adjustSearch: 'Prova a modificare la ricerca', pick: 'Scelto',
  },
  library: {
    title: 'Libreria', searchPlaceholder: 'Cerca i tuoi prompt...',
    all: 'Tutti', favorites: 'Preferiti', text: 'Testo', image: 'Immagine', video: 'Video',
    copy: 'Copia', remix: 'Remix', delete: 'Elimina', deleteTitle: 'Elimina Prompt',
    deleteMsg: 'Sei sicuro di voler eliminare questo prompt?', cancel: 'Annulla',
    noPrompts: 'Nessun prompt', noPromptsMsg: 'Crea il tuo primo prompt',
    noResults: 'Nessun risultato', noResultsMsg: 'Prova con un altro termine',
  },
  settings: {
    title: 'Impostazioni', support: 'Supporto', contactSupport: 'Contatta il supporto',
    rateApp: "Valuta l'app", rateAppSub: 'Aiutaci a migliorare',
    faq: 'FAQ & Centro assistenza', legal: 'Legale',
    privacyPolicy: 'Informativa sulla privacy', termsOfUse: 'Termini di utilizzo',
    data: 'Dati', savedPrompts: 'Prompt salvati', promptsStored: 'prompt archiviati localmente',
    clearAll: 'Cancella tutti i dati', clearAllSub: 'Elimina tutti i prompt',
    clearAllTitle: 'Cancella tutti i dati',
    clearAllMsg: 'Questo eliminerà permanentemente tutti i prompt. Azione irreversibile.',
    clearHistory: 'Cancella cronologia', clearHistorySub: 'Rimuovi le generazioni recenti',
    cancel: 'Annulla', appearance: 'Aspetto', darkMode: 'Modalità scura',
    darkModeSub: 'Passa al tema scuro', language: 'Lingua',
    languageSub: 'Scegli la tua lingua',
    footer: 'Tutti i dati sono archiviati localmente.', version: 'Versione',
    selectLanguage: 'Seleziona lingua',
  },
  detail: {
    promptSegments: 'Segmenti del Prompt', tags: 'Tag', copyFull: 'Copia prompt completo',
    remixBuilder: 'Remix nel Builder', editorPick: "Scelta dell'editore", notFound: 'Prompt non trovato',
  },
  tones: { professional: 'Professionale', casual: 'Informale', creative: 'Creativo', technical: 'Tecnico', persuasive: 'Persuasivo', academic: 'Accademico' },
  lengths: { concise: 'Conciso', medium: 'Medio', detailed: 'Dettagliato', exhaustive: 'Esaustivo' },
};

const de: TranslationKeys = {
  tabs: { discover: 'Entdecken', create: 'Erstellen', library: 'Bibliothek', settings: 'Einstellungen', reverse: 'Reverse' },
  create: {
    title: 'Erstellen', quick: 'Schnell', advanced: 'Erweitert',
    describeIdea: 'Beschreibe deine Idee im Detail...',
    generatePrompt: 'Prompt generieren', generatedPrompt: 'Generierter Prompt',
    describeWhat: 'Beschreibe, was du brauchst', whatCreating: 'Was erstellst du?',
    chooseCategory: 'Wähle eine Kategorie',
    describePrompt: 'Beschreibe deinen Prompt',
    beSpecific: 'Sei so spezifisch wie möglich',
    whatAchieve: 'Was möchtest du erreichen?',
    fineTune: 'Feinabstimmung', customizeTone: 'Ton, Länge und mehr anpassen',
    tone: 'Ton', length: 'Länge', outputFormat: 'Ausgabeformat',
    lighting: 'Beleuchtung', cameraAngle: 'Kamerawinkel', negativePrompt: 'Negativer Prompt',
    audience: 'Zielgruppe', constraints: 'Einschränkungen', whoIsFor: 'Für wen ist das?',
    anyRules: 'Bestimmte Regeln oder Einschränkungen...', style: 'Stil',
    next: 'Weiter', back: 'Zurück', generate: 'Generieren', newPrompt: 'Neuer Prompt',
    assumptions: 'Annahmen', warnings: 'Warnungen', suggestions: 'Vorschläge',
    copied: 'Kopiert!', saved: 'Gespeichert', savedAlert: 'Prompt in Bibliothek gespeichert.',
    emptyPrompt: 'Leerer Prompt', emptyPromptMsg: 'Beschreibe bitte, was du erstellen möchtest.',
    pro: 'Pro', category: 'Kategorie', details: 'Details', options: 'Optionen', result: 'Ergebnis', generating: 'Generierung…',
  },
  reverse: {
    title: 'Reverse Prompt', subtitle: 'Lade ein Bild hoch und die KI rekonstruiert den perfekten Prompt',
    pickImage: 'Aus Bibliothek wählen', pickDesc: 'Wähle ein Bild aus deiner Fotobibliothek',
    takePhoto: 'Foto aufnehmen', changeImage: 'Ändern', analyze: 'Bild analysieren',
    analyzing: 'Bild wird analysiert...', analyzingSub: 'KI untersucht jedes Detail',
    resultTitle: 'Rekonstruierter Prompt', copy: 'Kopieren', save: 'Speichern', retry: 'Wiederholen',
    tip: 'Tipp: Füge diesen Prompt in Midjourney, DALL-E oder Stable Diffusion ein, um ähnliche Ergebnisse zu erzielen',
  },
  discover: {
    title: 'Entdecken', subtitle: 'Prompts erkunden',
    searchPlaceholder: 'Prompts, Tags, Modelle suchen...',
    all: 'Alle', text: 'Text', image: 'Bild', video: 'Video',
    editorPicks: 'Empfohlen', noPrompts: 'Keine Prompts gefunden',
    adjustSearch: 'Versuche deine Suche anzupassen', pick: 'Tipp',
  },
  library: {
    title: 'Bibliothek', searchPlaceholder: 'Deine Prompts suchen...',
    all: 'Alle', favorites: 'Favoriten', text: 'Text', image: 'Bild', video: 'Video',
    copy: 'Kopieren', remix: 'Remix', delete: 'Löschen', deleteTitle: 'Prompt löschen',
    deleteMsg: 'Bist du sicher, dass du diesen Prompt löschen möchtest?', cancel: 'Abbrechen',
    noPrompts: 'Noch keine Prompts', noPromptsMsg: 'Erstelle deinen ersten Prompt',
    noResults: 'Keine Ergebnisse', noResultsMsg: 'Versuche einen anderen Suchbegriff',
  },
  settings: {
    title: 'Einstellungen', support: 'Support', contactSupport: 'Support kontaktieren',
    rateApp: 'App bewerten', rateAppSub: 'Hilf uns, uns zu verbessern',
    faq: 'FAQ & Hilfecenter', legal: 'Rechtliches',
    privacyPolicy: 'Datenschutzrichtlinie', termsOfUse: 'Nutzungsbedingungen',
    data: 'Daten', savedPrompts: 'Gespeicherte Prompts', promptsStored: 'Prompts lokal gespeichert',
    clearAll: 'Alle Daten löschen', clearAllSub: 'Alle Prompts löschen',
    clearAllTitle: 'Alle Daten löschen',
    clearAllMsg: 'Dies löscht dauerhaft alle Prompts. Nicht rückgängig machbar.',
    clearHistory: 'Verlauf löschen', clearHistorySub: 'Aktuelle Generierungen entfernen',
    cancel: 'Abbrechen', appearance: 'Erscheinungsbild', darkMode: 'Dunkelmodus',
    darkModeSub: 'Zum dunklen Thema wechseln', language: 'Sprache',
    languageSub: 'Wähle deine Sprache',
    footer: 'Alle Daten werden lokal gespeichert.', version: 'Version',
    selectLanguage: 'Sprache auswählen',
  },
  detail: {
    promptSegments: 'Prompt-Segmente', tags: 'Tags', copyFull: 'Vollständigen Prompt kopieren',
    remixBuilder: 'Im Builder remixen', editorPick: 'Redaktionsempfehlung', notFound: 'Prompt nicht gefunden',
  },
  tones: { professional: 'Professionell', casual: 'Locker', creative: 'Kreativ', technical: 'Technisch', persuasive: 'Überzeugend', academic: 'Akademisch' },
  lengths: { concise: 'Kurz', medium: 'Mittel', detailed: 'Detailliert', exhaustive: 'Ausführlich' },
};

const es: TranslationKeys = {
  tabs: { discover: 'Descubrir', create: 'Crear', library: 'Biblioteca', settings: 'Ajustes', reverse: 'Reverse' },
  create: {
    title: 'Crear', quick: 'Rápido', advanced: 'Avanzado',
    describeIdea: 'Describe tu idea en detalle...',
    generatePrompt: 'Generar Prompt', generatedPrompt: 'Prompt Generado',
    describeWhat: 'Describe lo que necesitas', whatCreating: '¿Qué estás creando?',
    chooseCategory: 'Elige una categoría para empezar',
    describePrompt: 'Describe tu prompt',
    beSpecific: 'Sé lo más específico posible',
    whatAchieve: '¿Qué quieres lograr?',
    fineTune: 'Ajuste fino', customizeTone: 'Personaliza tono, longitud y más',
    tone: 'Tono', length: 'Longitud', outputFormat: 'Formato de salida',
    lighting: 'Iluminación', cameraAngle: 'Ángulo de cámara', negativePrompt: 'Prompt negativo',
    audience: 'Audiencia', constraints: 'Restricciones', whoIsFor: '¿Para quién es?',
    anyRules: 'Reglas o limitaciones específicas...', style: 'Estilo',
    next: 'Siguiente', back: 'Atrás', generate: 'Generar', newPrompt: 'Nuevo Prompt',
    assumptions: 'Suposiciones', warnings: 'Advertencias', suggestions: 'Sugerencias',
    copied: '¡Copiado!', saved: 'Guardado', savedAlert: 'Prompt guardado en tu biblioteca.',
    emptyPrompt: 'Prompt vacío', emptyPromptMsg: 'Describe lo que quieres crear.',
    pro: 'Pro', category: 'Categoría', details: 'Detalles', options: 'Opciones', result: 'Resultado', generating: 'Generando…',
  },
  reverse: {
    title: 'Reverse Prompt', subtitle: 'Sube una imagen y la IA reconstruirá el prompt perfecto para recrearla',
    pickImage: 'Elegir de la galería', pickDesc: 'Selecciona una imagen de tu biblioteca de fotos',
    takePhoto: 'Tomar una foto', changeImage: 'Cambiar', analyze: 'Analizar imagen',
    analyzing: 'Analizando tu imagen...', analyzingSub: 'La IA estudia cada detalle',
    resultTitle: 'Prompt reconstruido', copy: 'Copiar', save: 'Guardar', retry: 'Reintentar',
    tip: 'Consejo: Pega este prompt en Midjourney, DALL-E o Stable Diffusion para recrear resultados similares',
  },
  discover: {
    title: 'Descubrir', subtitle: 'Explorar Prompts',
    searchPlaceholder: 'Buscar prompts, tags, modelos...',
    all: 'Todos', text: 'Texto', image: 'Imagen', video: 'Video',
    editorPicks: 'Destacados', noPrompts: 'No se encontraron prompts',
    adjustSearch: 'Intenta ajustar tu búsqueda', pick: 'Top',
  },
  library: {
    title: 'Biblioteca', searchPlaceholder: 'Buscar tus prompts...',
    all: 'Todos', favorites: 'Favoritos', text: 'Texto', image: 'Imagen', video: 'Video',
    copy: 'Copiar', remix: 'Remix', delete: 'Eliminar', deleteTitle: 'Eliminar Prompt',
    deleteMsg: '¿Seguro que quieres eliminar este prompt?', cancel: 'Cancelar',
    noPrompts: 'Sin prompts', noPromptsMsg: 'Crea tu primer prompt',
    noResults: 'Sin resultados', noResultsMsg: 'Prueba con otro término',
  },
  settings: {
    title: 'Ajustes', support: 'Soporte', contactSupport: 'Contactar soporte',
    rateApp: 'Valorar la app', rateAppSub: 'Ayúdanos a mejorar',
    faq: 'FAQ & Centro de ayuda', legal: 'Legal',
    privacyPolicy: 'Política de privacidad', termsOfUse: 'Términos de uso',
    data: 'Datos', savedPrompts: 'Prompts guardados', promptsStored: 'prompts almacenados',
    clearAll: 'Borrar todos los datos', clearAllSub: 'Eliminar todos los prompts',
    clearAllTitle: 'Borrar todos los datos',
    clearAllMsg: 'Esto eliminará permanentemente todos los prompts. No se puede deshacer.',
    clearHistory: 'Borrar historial', clearHistorySub: 'Eliminar generaciones recientes',
    cancel: 'Cancelar', appearance: 'Apariencia', darkMode: 'Modo oscuro',
    darkModeSub: 'Cambiar al tema oscuro', language: 'Idioma',
    languageSub: 'Elige tu idioma',
    footer: 'Todos los datos se almacenan localmente.', version: 'Versión',
    selectLanguage: 'Seleccionar idioma',
  },
  detail: {
    promptSegments: 'Segmentos del Prompt', tags: 'Etiquetas', copyFull: 'Copiar prompt completo',
    remixBuilder: 'Remix en Builder', editorPick: 'Selección del editor', notFound: 'Prompt no encontrado',
  },
  tones: { professional: 'Profesional', casual: 'Informal', creative: 'Creativo', technical: 'Técnico', persuasive: 'Persuasivo', academic: 'Académico' },
  lengths: { concise: 'Conciso', medium: 'Medio', detailed: 'Detallado', exhaustive: 'Exhaustivo' },
};

export const translations: Record<Language, TranslationKeys> = { en, fr, it, de, es };
