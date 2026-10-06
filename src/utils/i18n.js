// src/utils/i18n.js
import { useState, useEffect, useCallback } from "react";

export const SUPPORTED_LANGUAGES = {
  en: { code: "en", name: "English", label: "English 🇺🇸" },
  te: { code: "te", name: "Telugu", label: "Telugu 🇮🇳 (తెలుగు)" },
  hi: { code: "hi", name: "Hindi", label: "Hindi 🇮🇳 (हिंदी)" },
  es: { code: "es", name: "Spanish", label: "Spanish 🇪🇸 (Español)" },
  fr: { code: "fr", name: "French", label: "French 🇫🇷 (Français)" },
  de: { code: "de", name: "German", label: "German 🇩🇪 (Deutsch)" },
  ja: { code: "ja", name: "Japanese", label: "Japanese 🇯🇵 (日本語)" }
};

export const TRANSLATIONS = {
  en: {
    language_label: "AI & Report Language:",
    language_notice: "Interface and AI responses set to English",
    fullscreen: "⛶ Fullscreen",
    exit_fullscreen: "↙ Exit Fullscreen",
    chart_theme: "Chart Theme",
    share: "💼 Share",
    sync_sheet: "🔄 Sync Sheet",
    download_report: "⬇ Download Report",
    executive_pdf: "📕 Executive PDF Deck",
    excel_export: "📊 Excel (.xlsx)",
    html_report: "🌐 HTML Report",
    word_doc: "📄 Word (.doc)",
    drop_file: "Drop file to analyze",
    stage_1: "Stage 1: Upload Data",
    stage_2: "Stage 2: Schema & Quality",
    stage_3: "Stage 3: Cleaning & Prep",
    stage_4: "Stage 4: Exploratory Analysis",
    stage_5: "Stage 5: Visualizations & BI",
    stage_6: "Stage 6: SQL & Metrics",
    stage_7: "Stage 7: ML Modeling",
    stage_8: "Stage 8: Forecasting",
    stage_9: "Stage 9: Executive Reports",
    rows: "Rows",
    columns: "Columns",
    data_quality: "Data Quality",
    missing_cells: "missing cells",
    health_score: "Health Score",
    not_assessed: "Not assessed",
    prompt_placeholder_active: "Ask anything about your dataset (e.g. 'Predict Q4 revenue', 'Find anomalies')...",
    prompt_placeholder_empty: "Upload a tabular dataset (.csv, .xlsx) to begin analysis...",
    credits_left: "Credits Left",
    one_credit_query: "1 Credit / Query",
    analyzing_query: "Analyzing query…",
    dataset_connected: "✓ Dataset connected",
    no_tabular_data: "No tabular data was detected. Upload a supported dataset or select a table to continue."
  },
  te: {
    language_label: "AI & నివేదిక భాష:",
    language_notice: "ఇంటర్‌ఫేస్ మరియు AI ప్రతిస్పందనలు తెలుగుకు మార్చబడ్డాయి",
    fullscreen: "⛶ పూర్తి స్క్రీన్",
    exit_fullscreen: "↙ నిష్క్రమించు",
    chart_theme: "చార్ట్ థీమ్",
    share: "💼 భాగస్వామ్యం",
    sync_sheet: "🔄 షీట్ సమకాలీకరణ",
    download_report: "⬇ నివేదిక డౌన్‌లోడ్",
    executive_pdf: "📕 ఎగ్జిక్యూటివ్ PDF డెక్",
    excel_export: "📊 ఎక్సెల్ (.xlsx)",
    html_report: "🌐 HTML నివేదిక",
    word_doc: "📄 వర్డ్ (.doc)",
    drop_file: "విశ్లేషించడానికి ఫైల్ ఇక్కడ వేయండి",
    stage_1: "దశ 1: డేటా అప్‌లోడ్",
    stage_2: "దశ 2: స్కీమా & నాణ్యత",
    stage_3: "దశ 3: క్లీనింగ్ & ప్రిపరేషన్",
    stage_4: "దశ 4: విశ్లేషణ పరిశోధన",
    stage_5: "దశ 5: విజువలైజేషన్లు & BI",
    stage_6: "దశ 6: SQL & కొలమానాలు",
    stage_7: "దశ 7: మెషిన్ లెర్నింగ్ మోడలింగ్",
    stage_8: "దశ 8: సూచన & అంచనా",
    stage_9: "దశ 9: కార్యనిర్వాహక నివేదికలు",
    rows: "వరుసలు",
    columns: "నిలువు వరుసలు",
    data_quality: "డేటా నాణ్యత",
    missing_cells: "తప్పిపోయిన సెల్‌లు",
    health_score: "ఆరోగ్య స్కోర్",
    not_assessed: "అంచనా వేయబడలేదు",
    prompt_placeholder_active: "మీ డేటాసెట్ గురించి ఏదైనా అడగండి (ఉదా. 'రాబడి అంచనా', 'తేడాలు కనుగొనండి')...",
    prompt_placeholder_empty: "విశ్లేషణ ప్రారంభించడానికి పట్టిక డేటాను (.csv, .xlsx) అప్‌లోడ్ చేయండి...",
    credits_left: "క్రెడిట్‌లు మిగిలి ఉన్నాయి",
    one_credit_query: "ప్రతి ప్రశ్నకు 1 క్రెడిట్",
    analyzing_query: "ప్రశ్న విశ్లేషిస్తోంది…",
    dataset_connected: "✓ డేటాసెట్ కనెక్ట్ చేయబడింది",
    no_tabular_data: "పట్టిక డేటా కనుగొనబడలేదు. మద్దతు ఉన్న ఫైల్‌ను అప్‌లోడ్ చేయండి."
  },
  hi: {
    language_label: "AI और रिपोर्ट भाषा:",
    language_notice: "इंटरफ़ेस और AI उत्तर हिंदी में सेट किए गए हैं",
    fullscreen: "⛶ फुल स्क्रीन",
    exit_fullscreen: "↙ बाहर निकलें",
    chart_theme: "चार्ट थीम",
    share: "💼 शेयर करें",
    sync_sheet: "🔄 शीट सिंक करें",
    download_report: "⬇ रिपोर्ट डाउनलोड करें",
    executive_pdf: "📕 कार्यकारी पीडीएफ डेक",
    excel_export: "📊 एक्सेल (.xlsx)",
    html_report: "🌐 एचटीएमएल रिपोर्ट",
    word_doc: "📄 वर्ड (.doc)",
    drop_file: "विश्लेषण के लिए फ़ाइल यहाँ छोड़ें",
    stage_1: "चरण 1: डेटा अपलोड",
    stage_2: "चरण 2: स्कीमा और गुणवत्ता",
    stage_3: "चरण 3: सफाई और तैयारी",
    stage_4: "चरण 4: खोजपूर्ण विश्लेषण",
    stage_5: "चरण 5: विज़ुअलाइज़ेशन और बीआई",
    stage_6: "चरण 6: एसक्यूएल और मेट्रिक्स",
    stage_7: "चरण 7: एमएल मॉडलिंग",
    stage_8: "चरण 8: पूर्वानुमान",
    stage_9: "चरण 9: कार्यकारी रिपोर्ट",
    rows: "पंक्तियाँ",
    columns: "कॉलम",
    data_quality: "डेटा गुणवत्ता",
    missing_cells: "लापता सेल",
    health_score: "स्वास्थ्य स्कोर",
    not_assessed: "मूल्यांकन नहीं किया गया",
    prompt_placeholder_active: "अपने डेटा के बारे में कुछ भी पूछें (उदा. 'आय का पूर्वानुमान करें', 'विसंगतियाँ खोजें')...",
    prompt_placeholder_empty: "विश्लेषण शुरू करने के लिए सारणीबद्ध डेटा (.csv, .xlsx) अपलोड करें...",
    credits_left: "क्रेडिट शेष",
    one_credit_query: "प्रति प्रश्न 1 क्रेडिट",
    analyzing_query: "प्रश्न का विश्लेषण हो रहा है…",
    dataset_connected: "✓ डेटासेट जुड़ा हुआ है",
    no_tabular_data: "कोई सारणीबद्ध डेटा नहीं मिला। कृपया समर्थित डेटासेट अपलोड करें।"
  },
  es: {
    language_label: "Idioma de IA e Informes:",
    language_notice: "Interfaz y respuestas de IA configuradas en español",
    fullscreen: "⛶ Pantalla completa",
    exit_fullscreen: "↙ Salir de pantalla completa",
    chart_theme: "Tema de gráficos",
    share: "💼 Compartir",
    sync_sheet: "🔄 Sincronizar hoja",
    download_report: "⬇ Descargar informe",
    executive_pdf: "📕 Presentación ejecutiva en PDF",
    excel_export: "📊 Excel (.xlsx)",
    html_report: "🌐 Informe HTML",
    word_doc: "📄 Word (.doc)",
    drop_file: "Suelte el archivo para analizar",
    stage_1: "Etapa 1: Cargar datos",
    stage_2: "Etapa 2: Esquema y calidad",
    stage_3: "Etapa 3: Limpieza y preparación",
    stage_4: "Etapa 4: Análisis exploratorio",
    stage_5: "Etapa 5: Visualizaciones y BI",
    stage_6: "Etapa 6: SQL y métricas",
    stage_7: "Etapa 7: Modelado ML",
    stage_8: "Etapa 8: Pronóstico",
    stage_9: "Etapa 9: Informes ejecutivos",
    rows: "Filas",
    columns: "Columnas",
    data_quality: "Calidad de datos",
    missing_cells: "celdas faltantes",
    health_score: "Puntaje de salud",
    not_assessed: "No evaluado",
    prompt_placeholder_active: "Pregunta cualquier cosa sobre tus datos (ej. 'Predecir ingresos Q4', 'Buscar anomalías')...",
    prompt_placeholder_empty: "Cargue un conjunto de datos tabular (.csv, .xlsx) para comenzar el análisis...",
    credits_left: "Créditos restantes",
    one_credit_query: "1 crédito / consulta",
    analyzing_query: "Analizando consulta…",
    dataset_connected: "✓ Conjunto de datos conectado",
    no_tabular_data: "No se detectaron datos tabulares. Cargue un conjunto de datos compatible."
  },
  fr: {
    language_label: "Langue de l'IA et des rapports :",
    language_notice: "Interface et réponses IA configurées en français",
    fullscreen: "⛶ Plein écran",
    exit_fullscreen: "↙ Quitter le plein écran",
    chart_theme: "Thème du graphique",
    share: "💼 Partager",
    sync_sheet: "🔄 Synchroniser la feuille",
    download_report: "⬇ Télécharger le rapport",
    executive_pdf: "📕 Présentation PDF pour dirigeants",
    excel_export: "📊 Excel (.xlsx)",
    html_report: "🌐 Rapport HTML",
    word_doc: "📄 Word (.doc)",
    drop_file: "Déposez le fichier pour l'analyser",
    stage_1: "Étape 1: Importer des données",
    stage_2: "Étape 2: Schéma et qualité",
    stage_3: "Étape 3: Nettoyage et préparation",
    stage_4: "Étape 4: Analyse exploratoire",
    stage_5: "Étape 5: Visualisations et BI",
    stage_6: "Étape 6: SQL et métriques",
    stage_7: "Étape 7: Modélisation ML",
    stage_8: "Étape 8: Prévisions",
    stage_9: "Étape 9: Rapports pour dirigeants",
    rows: "Lignes",
    columns: "Colonnes",
    data_quality: "Qualité des données",
    missing_cells: "cellules manquantes",
    health_score: "Score de santé",
    not_assessed: "Non évalué",
    prompt_placeholder_active: "Posez n'importe quelle question sur vos données (ex. 'Prédire les revenus Q4')...",
    prompt_placeholder_empty: "Importez un jeu de données tabulaire (.csv, .xlsx) pour commencer l'analyse...",
    credits_left: "Crédits restants",
    one_credit_query: "1 crédit / requête",
    analyzing_query: "Analyse de la requête…",
    dataset_connected: "✓ Données connectées",
    no_tabular_data: "Aucune donnée tabulaire détectée. Importez un fichier pris en charge."
  },
  de: {
    language_label: "KI- und Berichtssprache:",
    language_notice: "Benutzeroberfläche und KI-Antworten auf Deutsch eingestellt",
    fullscreen: "⛶ Vollbild",
    exit_fullscreen: "↙ Vollbild beenden",
    chart_theme: "Diagramm-Design",
    share: "💼 Teilen",
    sync_sheet: "🔄 Tabelle synchronisieren",
    download_report: "⬇ Bericht herunterladen",
    executive_pdf: "📕 Vorstandsbericht als PDF",
    excel_export: "📊 Excel (.xlsx)",
    html_report: "🌐 HTML-Bericht",
    word_doc: "📄 Word (.doc)",
    drop_file: "Datei zur Analyse hier ablegen",
    stage_1: "Stufe 1: Daten hochladen",
    stage_2: "Stufe 2: Schema & Qualität",
    stage_3: "Stufe 3: Bereinigung & Vorbereitung",
    stage_4: "Stufe 4: Explorative Analyse",
    stage_5: "Stufe 5: Visualisierungen & BI",
    stage_6: "Stufe 6: SQL & Kennzahlen",
    stage_7: "Stufe 7: ML-Modellierung",
    stage_8: "Stufe 8: Prognose",
    stage_9: "Stufe 9: Führungsberichte",
    rows: "Zeilen",
    columns: "Spalten",
    data_quality: "Datenqualität",
    missing_cells: "Fehlende Zellen",
    health_score: "Gesundheitswert",
    not_assessed: "Nicht bewertet",
    prompt_placeholder_active: "Stellen Sie eine Frage zu Ihren Daten (z. B. 'Q4-Umsatz prognostizieren')...",
    prompt_placeholder_empty: "Laden Sie tabellarische Daten (.csv, .xlsx) hoch, um die Analyse zu starten...",
    credits_left: "Verbleibende Credits",
    one_credit_query: "1 Credit / Abfrage",
    analyzing_query: "Anfrage wird analysiert…",
    dataset_connected: "✓ Datensatz verbunden",
    no_tabular_data: "Keine tabellarischen Daten gefunden. Bitte unterstütztes Format hochladen."
  },
  ja: {
    language_label: "AIおよびレポートの言語:",
    language_notice: "インターフェースとAIの回答が日本語に設定されました",
    fullscreen: "⛶ フルスクリーン",
    exit_fullscreen: "↙ 終了",
    chart_theme: "グラフテーマ",
    share: "💼 共有",
    sync_sheet: "🔄 シート同期",
    download_report: "⬇ レポートダウンロード",
    executive_pdf: "📕 エグゼクティブPDFデック",
    excel_export: "📊 Excel (.xlsx)",
    html_report: "🌐 HTMLレポート",
    word_doc: "📄 Word (.doc)",
    drop_file: "分析するファイルをドロップ",
    stage_1: "ステージ 1: データアップロード",
    stage_2: "ステージ 2: スキーマと品質",
    stage_3: "ステージ 3: クリーニングと準備",
    stage_4: "ステージ 4: 探索的分析",
    stage_5: "ステージ 5: 可視化とBI",
    stage_6: "ステージ 6: SQLとメトリクス",
    stage_7: "ステージ 7: 機械学習モデリング",
    stage_8: "ステージ 8: 予測",
    stage_9: "ステージ 9: エグゼクティブレポート",
    rows: "行数",
    columns: "列数",
    data_quality: "データ品質",
    missing_cells: "欠損セル",
    health_score: "ヘルススコア",
    not_assessed: "未評価",
    prompt_placeholder_active: "データセットについて質問してください（例：「Q4売上の予測」「異常値の検出」）...",
    prompt_placeholder_empty: "分析を開始するには表形式データ（.csv、.xlsx）をアップロードしてください...",
    credits_left: "残りクレジット",
    one_credit_query: "1クエリあたり1クレジット",
    analyzing_query: "クエリを分析中…",
    dataset_connected: "✓ データセット接続済み",
    no_tabular_data: "表形式データが検出されませんでした。サポートされているファイルをアップロードしてください。"
  }
};

/**
 * Get current active language object
 */
export function getCurrentLanguage() {
  if (typeof window === "undefined") return SUPPORTED_LANGUAGES.en;
  try {
    const code = localStorage.getItem("aida_lang") || "en";
    if (SUPPORTED_LANGUAGES[code]) return SUPPORTED_LANGUAGES[code];
  } catch (e) {}
  return SUPPORTED_LANGUAGES.en;
}

/**
 * Translate a key with optional fallback text
 */
export function translate(key, fallback = "") {
  const current = getCurrentLanguage();
  const langDict = TRANSLATIONS[current.code] || TRANSLATIONS.en;
  return langDict[key] || TRANSLATIONS.en[key] || fallback || key;
}

/**
 * Set application language and broadcast change
 */
export function setAppLanguage(code) {
  if (typeof window === "undefined") return;
  const langObj = SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES.en;
  localStorage.setItem("aida_lang", langObj.code);
  window.dispatchEvent(new CustomEvent("aida_language_change", { detail: langObj }));
  window.dispatchEvent(new Event("storage"));
  return langObj;
}

/**
 * React hook for live translation and language synchronization
 */
export function useLanguage() {
  const [lang, setLangState] = useState(() => getCurrentLanguage());

  const sync = useCallback(() => {
    setLangState(getCurrentLanguage());
  }, []);

  useEffect(() => {
    sync();

    const handleLanguageChange = (e) => {
      if (e?.detail?.code && SUPPORTED_LANGUAGES[e.detail.code]) {
        setLangState(SUPPORTED_LANGUAGES[e.detail.code]);
      } else {
        sync();
      }
    };

    window.addEventListener("aida_language_change", handleLanguageChange);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("aida_language_change", handleLanguageChange);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const t = useCallback((key, fallback = "") => {
    const langDict = TRANSLATIONS[lang.code] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || fallback || key;
  }, [lang.code]);

  const changeLanguage = useCallback((code) => {
    return setAppLanguage(code);
  }, []);

  return {
    lang,
    langCode: lang.code,
    setLanguage: changeLanguage,
    t
  };
}
