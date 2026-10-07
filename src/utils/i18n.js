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
    stage_4: "Stage 4: Cleaned Data",
    stage_5: "Stage 5: Exploratory Analysis",
    stage_6: "Stage 6: AI Insights",
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
    no_tabular_data: "No tabular data was detected. Upload a supported dataset or select a table to continue.",
    sign_out: "Sign Out",

    // Tabs
    tab_dashboard: "📊 Power BI Dashboard",
    tab_data: "📁 01 Raw Data",
    tab_quality: "🛡️ 02 Data Quality",
    tab_cleaning: "🧹 03 Data Cleaning",
    tab_cleaned: "✨ 04 Cleaned Data",
    tab_eda: "🔍 05 Exploratory Analysis",
    tab_insights: "💡 06 AI Insights",
    tab_ml: "🤖 07 ML Modeling",
    tab_forecast: "🔮 08 Forecasting",
    tab_stats: "📑 09 Executive Report",

    // Sidebar & Navigation
    nav_new_analysis: "+ New analysis",
    nav_import_sheet: "🔗 Import Google Sheet",
    nav_recent: "Recent",
    nav_no_recent: "No recent files",
    cloud_warming_up: "Cloud sync warming up • In-browser engine active",

    // KPI Cards
    kpi_total_revenue: "Total Revenue",
    kpi_net_profit: "Net Profit",
    kpi_operating_margin: "Operating Margin",
    kpi_profit_margin: "Profit Margin",
    kpi_total_orders: "Total Records / Orders",
    kpi_total_records: "Dataset Records",
    kpi_data_health: "Data Health",
    kpi_ai_findings: "AI Findings",
    kpi_transformations: "Transformations",
    kpi_forecast_trajectory: "Forecast Trajectory",
    kpi_trained_models: "Trained ML Models",
    kpi_operating_cost: "Operating Cost",
    kpi_budget_variance: "Budget Variance",
    kpi_gross_margin: "Gross Margin",

    // Action Buttons
    btn_inspect_quality: "Inspect Quality",
    btn_explore_data: "Explore Data",
    btn_investigate: "Investigate",
    btn_view_lineage: "View Lineage",
    btn_open_forecast: "Open Forecast",
    btn_compare_models: "Compare Models",
    btn_ask_copilot: "Ask Copilot",
    btn_upload_dataset: "Upload Dataset",
    btn_generate_report: "Generate PDF Report",
    btn_explain_charts: "Explain My Charts",
    btn_reset_filters: "Reset All Filters",
    btn_return_bi: "Return to BI Workspace",

    // Headers & Sections
    hdr_executive_dashboard: "Executive Analytics Dashboard",
    hdr_executive_command_center: "Executive Command Center",
    hdr_finance_command_center: "Finance Command Center",
    hdr_workspace_command_center: "Workspace Command Center",
    sec_key_metrics: "Key Business Performance Metrics",
    sec_financial_metrics: "Financial Performance Metrics",
    sec_ai_brief: "AI Executive Brief",
    sec_needs_attention: "Needs Attention",
    sec_interactive_filters: "Interactive Slicers & Filters",
    sec_try_asking: "Try asking:",
    sec_recommended_action: "Recommended Action:",
    lbl_status_healthy: "🟢 Business Healthy",
    lbl_status_live: "🟢 Live Grounded Data",
    lbl_status_preview: "⚪ Illustrative Preview",
    lbl_calculated_from: "Calculated from",
    lbl_illustrative_template: "⚠️ Illustrative Template (Upload dataset to calculate live KPIs)",

    // Beginner Mode
    lbl_beginner_guided_mode: "Beginner Guided Mode",
    lbl_recommended_next_action: "Recommended Next Action",
    beginner_subtitle: "One clear recommended action at each stage • Plain English without formulas",
    step_connect_data: "Connect Data",
    step_quality_privacy: "Data Quality & Privacy Check",
    step_explore_trends: "Explore Visual Trends",
    step_ask_questions: "Ask Plain-English Questions",
    step_exec_report: "Generate Executive Report",
    glossary_btn: "📖 Plain-English Glossary",
    copilot_ask_anything: "💬 Ask your Executive AI Copilot anything...",

    // Charts & Slicers
    chart_revenue_by_cat: "Revenue by Category",
    chart_orders_by_region: "Orders by Region",
    chart_sales_over_time: "Sales Over Time",
    slicer_all_regions: "All Regions",
    filter_by: "Filter by"
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
    stage_4: "దశ 4: శుభ్రపరచిన డేటా",
    stage_5: "దశ 5: విశ్లేషణ పరిశోధన",
    stage_6: "దశ 6: AI అంతర్దృష్టులు",
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
    no_tabular_data: "పట్టిక డేటా కనుగొనబడలేదు. మద్దతు ఉన్న ఫైల్‌ను అప్‌లోడ్ చేయండి.",
    sign_out: "లాగ్ అవుట్",

    // Tabs
    tab_dashboard: "📊 పవర్ BI డాష్‌బోర్డ్",
    tab_data: "📁 01 ముడి డేటా",
    tab_quality: "🛡️ 02 డేటా నాణ్యత",
    tab_cleaning: "🧹 03 డేటా క్లీనింగ్",
    tab_cleaned: "✨ 04 శుభ్రపరచిన డేటా",
    tab_eda: "🔍 05 విశ్లేషణ పరిశోధన",
    tab_insights: "💡 06 AI అంతర్దృష్టులు",
    tab_ml: "🤖 07 ML మోడలింగ్",
    tab_forecast: "🔮 08 భవిష్యత్తు అంచనా",
    tab_stats: "📑 09 ఎగ్జిక్యూటివ్ నివేదిక",

    // Sidebar & Navigation
    nav_new_analysis: "+ కొత్త విశ్లేషణ",
    nav_import_sheet: "🔗 గూగుల్ షీట్ దిగుమతి",
    nav_recent: "ఇటీవలి ఫైళ్ళు",
    nav_no_recent: "ఇటీవలి ఫైళ్ళు లేవు",
    cloud_warming_up: "క్లౌడ్ ఇంజిన్ సిద్ధమవుతోంది • స్థానిక ఇంజిన్ చురుకుగా ఉంది",

    // KPI Cards
    kpi_total_revenue: "మొత్తం రాబడి",
    kpi_net_profit: "నికర లాభం",
    kpi_operating_margin: "నిర్వహణ మార్జిన్",
    kpi_profit_margin: "లాభ మార్జిన్",
    kpi_total_orders: "మొత్తం ఆర్డర్‌లు / రికార్డులు",
    kpi_total_records: "డేటా రికార్డులు",
    kpi_data_health: "డేటా ఆరోగ్యం",
    kpi_ai_findings: "AI పరిశీలనలు",
    kpi_transformations: "మార్పులు & రూపాంతరాలు",
    kpi_forecast_trajectory: "వృద్ధి అంచనా",
    kpi_trained_models: "శిక్షణ పొందిన మోడల్స్",
    kpi_operating_cost: "నిర్వహణ ఖర్చు",
    kpi_budget_variance: "బడ్జెట్ వ్యత్యాసం",
    kpi_gross_margin: "స్థూల మార్జిన్",

    // Action Buttons
    btn_inspect_quality: "నాణ్యతను తనిఖీ చేయండి",
    btn_explore_data: "డేటాను అన్వేషించండి",
    btn_investigate: "దర్యాప్తు చేయండి",
    btn_view_lineage: "డేటా చరిత్ర చూడండి",
    btn_open_forecast: "అంచనా తెరవండి",
    btn_compare_models: "మోడల్స్ పోల్చండి",
    btn_ask_copilot: "కోపైలట్‌ని అడగండి",
    btn_upload_dataset: "డేటాసెట్ అప్‌లోడ్ చేయండి",
    btn_generate_report: "PDF నివేదికను రూపొందించండి",
    btn_explain_charts: "నా చార్ట్‌లను వివరించండి",
    btn_reset_filters: "అన్ని ఫిల్టర్‌లను రీసెట్ చేయండి",
    btn_return_bi: "BI వర్క్‌స్పేస్‌కి తిరిగి వెళ్ళండి",

    // Headers & Sections
    hdr_executive_dashboard: "ఎగ్జిక్యూటివ్ విశ్లేషణ డాష్‌బోర్డ్",
    hdr_executive_command_center: "ఎగ్జిక్యూటివ్ కమాండ్ సెంటర్",
    hdr_finance_command_center: "ఫైనాన్స్ కమాండ్ సెంటర్",
    hdr_workspace_command_center: "వర్క్‌స్పేస్ కమాండ్ సెంటర్",
    sec_key_metrics: "కీలక వ్యాపార పనితీరు కొలమానాలు",
    sec_financial_metrics: "ఆర్థిక పనితీరు కొలమానాలు",
    sec_ai_brief: "AI ఎగ్జిక్యూటివ్ సారాంశం",
    sec_needs_attention: "శ్రద్ధ అవసరమైన అంశాలు",
    sec_interactive_filters: "ఇంటరాక్టివ్ ఫిల్టర్‌లు & స్లైసర్‌లు",
    sec_try_asking: "ఇలా అడగండి:",
    sec_recommended_action: "సిఫార్సు చేయబడిన చర్య:",
    lbl_status_healthy: "🟢 వ్యాపారం ఆరోగ్యంగా ఉంది",
    lbl_status_live: "🟢 ప్రత్యక్ష డేటా",
    lbl_status_preview: "⚪ ఉదాహరణ ప్రివ్యూ",
    lbl_calculated_from: "నుండి లెక్కించబడింది",
    lbl_illustrative_template: "⚠️ ఉదాహరణ టెంప్లేట్ (ప్రత్యక్ష కొలమానాల కోసం డేటాను అప్‌లోడ్ చేయండి)",

    // Beginner Mode
    lbl_beginner_guided_mode: "ప్రారంభ మార్గదర్శక మోడ్",
    lbl_recommended_next_action: "సిఫార్సు చేయబడిన తదుపరి చర్య",
    beginner_subtitle: "ప్రతి దశలో స్పష్టమైన సిఫార్సు చేయబడిన చర్య • సూత్రాలు లేని సులభమైన భాష",
    step_connect_data: "డేటాను కనెక్ట్ చేయండి",
    step_quality_privacy: "డేటా నాణ్యత & గోప్యతా తనిఖీ",
    step_explore_trends: "చార్ట్‌లు & ట్రెండ్‌లను అన్వేషించండి",
    step_ask_questions: "సులభమైన ప్రశ్నలను అడగండి",
    step_exec_report: "ఎగ్జిక్యూటివ్ నివేదికను రూపొందించండి",
    glossary_btn: "📖 పదకోశం",
    copilot_ask_anything: "💬 మీ AI కోపైలట్‌ని ఏదైనా అడగండి...",

    // Charts & Slicers
    chart_revenue_by_cat: "వర్గం వారీగా రాబడి",
    chart_orders_by_region: "ప్రాంతం వారీగా ఆర్డర్‌లు",
    chart_sales_over_time: "సమయంతో అమ్మకాల సరళి",
    slicer_all_regions: "అన్ని ప్రాంతాలు",
    filter_by: "ఫిల్టర్ చేయండి"
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
    stage_4: "चरण 4: स्वच्छ डेटा",
    stage_5: "चरण 5: खोजपूर्ण विश्लेषण",
    stage_6: "चरण 6: AI अंतर्दृष्टि",
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
    no_tabular_data: "कोई सारणीबद्ध डेटा नहीं मिला। कृपया समर्थित डेटासेट अपलोड करें।",
    sign_out: "साइन आउट",

    // Tabs
    tab_dashboard: "📊 पावर बीआई डैशबोर्ड",
    tab_data: "📁 01 कच्चा डेटा",
    tab_quality: "🛡️ 02 डेटा गुणवत्ता",
    tab_cleaning: "🧹 03 डेटा सफाई",
    tab_cleaned: "✨ 04 स्वच्छ डेटा",
    tab_eda: "🔍 05 खोजपूर्ण विश्लेषण",
    tab_insights: "💡 06 AI अंतर्दृष्टि",
    tab_ml: "🤖 07 एमएल मॉडलिंग",
    tab_forecast: "🔮 08 पूर्वानुमान",
    tab_stats: "📑 09 कार्यकारी रिपोर्ट",

    // Sidebar & Navigation
    nav_new_analysis: "+ नया विश्लेषण",
    nav_import_sheet: "🔗 गूगल शीट आयात करें",
    nav_recent: "हाल की फ़ाइलें",
    nav_no_recent: "कोई हालिया फ़ाइल नहीं",
    cloud_warming_up: "क्लाउड सिंक चालू हो रहा है • इन-ब्राउज़र इंजन सक्रिय है",

    // KPI Cards
    kpi_total_revenue: "कुल राजस्व",
    kpi_net_profit: "शुद्ध लाभ",
    kpi_operating_margin: "ऑपरेटिंग मार्जिन",
    kpi_profit_margin: "लाभ मार्जिन",
    kpi_total_orders: "कुल ऑर्डर / रिकॉर्ड",
    kpi_total_records: "डेटा रिकॉर्ड्स",
    kpi_data_health: "डेटा स्वास्थ्य",
    kpi_ai_findings: "AI निष्कर्ष",
    kpi_transformations: "डेटा रूपांतरण",
    kpi_forecast_trajectory: "पूर्वानुमान रुझान",
    kpi_trained_models: "प्रशिक्षित मॉडल",
    kpi_operating_cost: "परिचालन लागत",
    kpi_budget_variance: "बजट विचरण",
    kpi_gross_margin: "सकल मार्जिन",

    // Action Buttons
    btn_inspect_quality: "गुणवत्ता जाँचें",
    btn_explore_data: "डेटा एक्सप्लोर करें",
    btn_investigate: "जाँच करें",
    btn_view_lineage: "डेटा इतिहास देखें",
    btn_open_forecast: "पूर्वानुमान खोलें",
    btn_compare_models: "मॉडल तुलना करें",
    btn_ask_copilot: "कोपायलट से पूछें",
    btn_upload_dataset: "डेटासेट अपलोड करें",
    btn_generate_report: "पीडीएफ रिपोर्ट बनाएं",
    btn_explain_charts: "चार्ट समझाएं",
    btn_reset_filters: "सभी फ़िल्टर रीसेट करें",
    btn_return_bi: "BI कार्यक्षेत्र पर लौटें",

    // Headers & Sections
    hdr_executive_dashboard: "कार्यकारी विश्लेषण डैशबोर्ड",
    hdr_executive_command_center: "कार्यकारी कमांड सेंटर",
    hdr_finance_command_center: "वित्त कमांड सेंटर",
    hdr_workspace_command_center: "कार्यक्षेत्र कमांड सेंटर",
    sec_key_metrics: "प्रमुख व्यावसायिक प्रदर्शन मेट्रिक्स",
    sec_financial_metrics: "वित्तीय प्रदर्शन मेट्रिक्स",
    sec_ai_brief: "AI कार्यकारी सारांश",
    sec_needs_attention: "ध्यान देने योग्य बातें",
    sec_interactive_filters: "इंटरैक्टिव स्लाइसर और फ़िल्टर",
    sec_try_asking: "यह पूछें:",
    sec_recommended_action: "अनुशंसित कार्रवाई:",
    lbl_status_healthy: "🟢 व्यवसाय स्वस्थ है",
    lbl_status_live: "🟢 लाइव डेटा",
    lbl_status_preview: "⚪ उदाहरणात्मक पूर्वावलोकन",
    lbl_calculated_from: "से गणना की गई",
    lbl_illustrative_template: "⚠️ उदाहरणात्मक टेम्पलेट (लाइव मेट्रिक्स के लिए डेटासेट अपलोड करें)",

    // Beginner Mode
    lbl_beginner_guided_mode: "शुरुआती मार्गदर्शित मोड",
    lbl_recommended_next_action: "अनुशंसित अगला कदम",
    beginner_subtitle: "प्रत्येक चरण में स्पष्ट कार्रवाई • बिना सूत्रों की सरल भाषा",
    step_connect_data: "डेटा कनेक्ट करें",
    step_quality_privacy: "डेटा गुणवत्ता और गोपनीयता जांच",
    step_explore_trends: "विज़ुअल रुझान एक्सप्लोर करें",
    step_ask_questions: "सरल भाषा में प्रश्न पूछें",
    step_exec_report: "कार्यकारी रिपोर्ट बनाएं",
    glossary_btn: "📖 शब्दावली",
    copilot_ask_anything: "💬 अपने AI कोपायलट से कुछ भी पूछें...",

    // Charts & Slicers
    chart_revenue_by_cat: "श्रेणी अनुसार राजस्व",
    chart_orders_by_region: "क्षेत्र अनुसार ऑर्डर",
    chart_sales_over_time: "समय के साथ बिक्री",
    slicer_all_regions: "सभी क्षेत्र",
    filter_by: "फ़िल्टर करें"
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
    stage_4: "Etapa 4: Datos limpios",
    stage_5: "Etapa 5: Análisis exploratorio",
    stage_6: "Etapa 6: Perspectivas de IA",
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
    no_tabular_data: "No se detectaron datos tabulares. Cargue un conjunto de datos compatible.",
    sign_out: "Cerrar sesión",

    // Tabs
    tab_dashboard: "📊 Panel Power BI",
    tab_data: "📁 01 Datos sin procesar",
    tab_quality: "🛡️ 02 Calidad de datos",
    tab_cleaning: "🧹 03 Limpieza de datos",
    tab_cleaned: "✨ 04 Datos limpios",
    tab_eda: "🔍 05 Análisis exploratorio",
    tab_insights: "💡 06 Perspectivas de IA",
    tab_ml: "🤖 07 Modelado ML",
    tab_forecast: "🔮 08 Pronóstico",
    tab_stats: "📑 09 Informe ejecutivo",

    // Sidebar & Navigation
    nav_new_analysis: "+ Nuevo análisis",
    nav_import_sheet: "🔗 Importar Google Sheet",
    nav_recent: "Recientes",
    nav_no_recent: "Sin archivos recientes",
    cloud_warming_up: "Sincronización en la nube iniciando • Motor local activo",

    // KPI Cards
    kpi_total_revenue: "Ingresos totales",
    kpi_net_profit: "Beneficio neto",
    kpi_operating_margin: "Margen operativo",
    kpi_profit_margin: "Margen de beneficio",
    kpi_total_orders: "Pedidos / Registros totales",
    kpi_total_records: "Registros del conjunto",
    kpi_data_health: "Salud de datos",
    kpi_ai_findings: "Hallazgos de IA",
    kpi_transformations: "Transformaciones",
    kpi_forecast_trajectory: "Trayectoria de pronóstico",
    kpi_trained_models: "Modelos ML entrenados",
    kpi_operating_cost: "Costo operativo",
    kpi_budget_variance: "Variación presupuestaria",
    kpi_gross_margin: "Margen bruto",

    // Action Buttons
    btn_inspect_quality: "Inspeccionar calidad",
    btn_explore_data: "Explorar datos",
    btn_investigate: "Investigar",
    btn_view_lineage: "Ver linaje",
    btn_open_forecast: "Abrir pronóstico",
    btn_compare_models: "Comparar modelos",
    btn_ask_copilot: "Preguntar a Copilot",
    btn_upload_dataset: "Subir conjunto de datos",
    btn_generate_report: "Generar informe PDF",
    btn_explain_charts: "Explicar mis gráficos",
    btn_reset_filters: "Restablecer filtros",
    btn_return_bi: "Volver al espacio BI",

    // Headers & Sections
    hdr_executive_dashboard: "Panel de análisis ejecutivo",
    hdr_executive_command_center: "Centro de comando ejecutivo",
    hdr_finance_command_center: "Centro de comando financiero",
    hdr_workspace_command_center: "Centro de comando del espacio",
    sec_key_metrics: "Métricas clave de rendimiento empresarial",
    sec_financial_metrics: "Métricas de rendimiento financiero",
    sec_ai_brief: "Resumen ejecutivo de IA",
    sec_needs_attention: "Requiere atención",
    sec_interactive_filters: "Segmentadores y filtros interactivos",
    sec_try_asking: "Intente preguntar:",
    sec_recommended_action: "Acción recomendada:",
    lbl_status_healthy: "🟢 Negocio saludable",
    lbl_status_live: "🟢 Datos en vivo conectados",
    lbl_status_preview: "⚪ Vista previa ilustrativa",
    lbl_calculated_from: "Calculado a partir de",
    lbl_illustrative_template: "⚠️ Plantilla ilustrativa (Cargue datos para calcular métricas en vivo)",

    // Beginner Mode
    lbl_beginner_guided_mode: "Modo guiado para principiantes",
    lbl_recommended_next_action: "Siguiente acción recomendada",
    beginner_subtitle: "Una acción clara recomendada en cada etapa • Lenguaje sencillo sin fórmulas",
    step_connect_data: "Conectar datos",
    step_quality_privacy: "Comprobación de calidad y privacidad",
    step_explore_trends: "Explorar tendencias visuales",
    step_ask_questions: "Hacer preguntas en lenguaje natural",
    step_exec_report: "Generar informe ejecutivo",
    glossary_btn: "📖 Glosario en lenguaje sencillo",
    copilot_ask_anything: "💬 Pregunte cualquier cosa a su Copilot...",

    // Charts & Slicers
    chart_revenue_by_cat: "Ingresos por categoría",
    chart_orders_by_region: "Pedidos por región",
    chart_sales_over_time: "Ventas a lo largo del tiempo",
    slicer_all_regions: "Todas las regiones",
    filter_by: "Filtrar por"
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
    stage_4: "Étape 4: Données nettoyées",
    stage_5: "Étape 5: Analyse exploratoire",
    stage_6: "Étape 6: Perspectives IA",
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
    no_tabular_data: "Aucune donnée tabulaire détectée. Importez un fichier pris en charge.",
    sign_out: "Se déconnecter",

    // Tabs
    tab_dashboard: "📊 Tableau de bord Power BI",
    tab_data: "📁 01 Données brutes",
    tab_quality: "🛡️ 02 Qualité des données",
    tab_cleaning: "🧹 03 Nettoyage des données",
    tab_cleaned: "✨ 04 Données nettoyées",
    tab_eda: "🔍 05 Analyse exploratoire",
    tab_insights: "💡 06 Perspectives IA",
    tab_ml: "🤖 07 Modélisation ML",
    tab_forecast: "🔮 08 Prévisions",
    tab_stats: "📑 09 Rapport exécutif",

    // Sidebar & Navigation
    nav_new_analysis: "+ Nouvelle analyse",
    nav_import_sheet: "🔗 Importer Google Sheet",
    nav_recent: "Récents",
    nav_no_recent: "Aucun fichier récent",
    cloud_warming_up: "Démarrage cloud en cours • Moteur local actif",

    // KPI Cards
    kpi_total_revenue: "Revenu total",
    kpi_net_profit: "Bénéfice net",
    kpi_operating_margin: "Marge opérationnelle",
    kpi_profit_margin: "Marge bénéficiaire",
    kpi_total_orders: "Total commandes / lignes",
    kpi_total_records: "Enregistrements",
    kpi_data_health: "Santé des données",
    kpi_ai_findings: "Observations IA",
    kpi_transformations: "Transformations",
    kpi_forecast_trajectory: "Trajectoire prévisionnelle",
    kpi_trained_models: "Modèles ML entraînés",
    kpi_operating_cost: "Coût opérationnel",
    kpi_budget_variance: "Écart budgétaire",
    kpi_gross_margin: "Marge brute",

    // Action Buttons
    btn_inspect_quality: "Inspecter la qualité",
    btn_explore_data: "Explorer les données",
    btn_investigate: "Enquêter",
    btn_view_lineage: "Voir le lignage",
    btn_open_forecast: "Ouvrir prévisions",
    btn_compare_models: "Comparer les modèles",
    btn_ask_copilot: "Demander au Copilot",
    btn_upload_dataset: "Téléverser données",
    btn_generate_report: "Générer rapport PDF",
    btn_explain_charts: "Expliquer mes graphiques",
    btn_reset_filters: "Réinitialiser les filtres",
    btn_return_bi: "Retourner à l'espace BI",

    // Headers & Sections
    hdr_executive_dashboard: "Tableau de bord analytique exécutif",
    hdr_executive_command_center: "Centre de commande exécutif",
    hdr_finance_command_center: "Centre de commande finance",
    hdr_workspace_command_center: "Centre de commande de l'espace",
    sec_key_metrics: "Indicateurs clés de performance",
    sec_financial_metrics: "Indicateurs financiers",
    sec_ai_brief: "Synthèse IA pour dirigeants",
    sec_needs_attention: "Points d'attention",
    sec_interactive_filters: "Filtres et segments interactifs",
    sec_try_asking: "Essayez de demander :",
    sec_recommended_action: "Action recommandée :",
    lbl_status_healthy: "🟢 Entreprise saine",
    lbl_status_live: "🟢 Données en direct",
    lbl_status_preview: "⚪ Aperçu illustratif",
    lbl_calculated_from: "Calculé à partir de",
    lbl_illustrative_template: "⚠️ Modèle illustratif (Téléversez des données pour calculer les KPIs)",

    // Beginner Mode
    lbl_beginner_guided_mode: "Mode guidé débutant",
    lbl_recommended_next_action: "Prochaine action recommandée",
    beginner_subtitle: "Une action claire recommandée à chaque étape • Langage clair sans formules",
    step_connect_data: "Connecter les données",
    step_quality_privacy: "Vérification qualité & confidentialité",
    step_explore_trends: "Explorer les tendances visuelles",
    step_ask_questions: "Poser des questions en français simple",
    step_exec_report: "Générer rapport exécutif",
    glossary_btn: "📖 Glossaire simplifié",
    copilot_ask_anything: "💬 Posez n'importe quelle question à votre Copilot...",

    // Charts & Slicers
    chart_revenue_by_cat: "Revenu par catégorie",
    chart_orders_by_region: "Commandes par région",
    chart_sales_over_time: "Évolution des ventes",
    slicer_all_regions: "Toutes les régions",
    filter_by: "Filtrer par"
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
    stage_4: "Stufe 4: Bereinigte Daten",
    stage_5: "Stufe 5: Explorative Analyse",
    stage_6: "Stufe 6: KI-Erkenntnisse",
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
    no_tabular_data: "Keine tabellarischen Daten gefunden. Bitte unterstütztes Format hochladen.",
    sign_out: "Abmelden",

    // Tabs
    tab_dashboard: "📊 Power BI Dashboard",
    tab_data: "📁 01 Rohdaten",
    tab_quality: "🛡️ 02 Datenqualität",
    tab_cleaning: "🧹 03 Datenbereinigung",
    tab_cleaned: "✨ 04 Bereinigte Daten",
    tab_eda: "🔍 05 Explorative Analyse",
    tab_insights: "💡 06 KI-Erkenntnisse",
    tab_ml: "🤖 07 ML-Modellierung",
    tab_forecast: "🔮 08 Prognosen",
    tab_stats: "📑 09 Vorstandsbericht",

    // Sidebar & Navigation
    nav_new_analysis: "+ Neue Analyse",
    nav_import_sheet: "🔗 Google Sheet importieren",
    nav_recent: "Zuletzt verwendet",
    nav_no_recent: "Keine aktuellen Dateien",
    cloud_warming_up: "Cloud-Synchronisierung startet • Lokaler Browser-Motor aktiv",

    // KPI Cards
    kpi_total_revenue: "Gesamtumsatz",
    kpi_net_profit: "Nettogewinn",
    kpi_operating_margin: "Betriebsmarge",
    kpi_profit_margin: "Gewinnmarge",
    kpi_total_orders: "Bestellungen / Datensätze gesamt",
    kpi_total_records: "Datensätze",
    kpi_data_health: "Datengesundheit",
    kpi_ai_findings: "KI-Erkenntnisse",
    kpi_transformations: "Transformationen",
    kpi_forecast_trajectory: "Prognosetrend",
    kpi_trained_models: "Trainierte ML-Modelle",
    kpi_operating_cost: "Betriebskosten",
    kpi_budget_variance: "Budgetabweichung",
    kpi_gross_margin: "Bruttomarge",

    // Action Buttons
    btn_inspect_quality: "Qualität prüfen",
    btn_explore_data: "Daten erkunden",
    btn_investigate: "Untersuchen",
    btn_view_lineage: "Herkunft anzeigen",
    btn_open_forecast: "Prognose öffnen",
    btn_compare_models: "Modelle vergleichen",
    btn_ask_copilot: "Copilot fragen",
    btn_upload_dataset: "Datensatz hochladen",
    btn_generate_report: "PDF-Bericht erstellen",
    btn_explain_charts: "Diagramme erklären",
    btn_reset_filters: "Filter zurücksetzen",
    btn_return_bi: "Zurück zum BI-Bereich",

    // Headers & Sections
    hdr_executive_dashboard: "Vorstands-Analytics-Dashboard",
    hdr_executive_command_center: "Vorstands-Kommandozentrale",
    hdr_finance_command_center: "Finanz-Kommandozentrale",
    hdr_workspace_command_center: "Arbeitsbereich-Kommandozentrale",
    sec_key_metrics: "Wichtigste Geschäftskennzahlen",
    sec_financial_metrics: "Finanzielle Leistungskennzahlen",
    sec_ai_brief: "KI-Vorstandsbriefing",
    sec_needs_attention: "Erfordert Aufmerksamkeit",
    sec_interactive_filters: "Interaktive Filter & Slicer",
    sec_try_asking: "Probieren Sie:",
    sec_recommended_action: "Empfohlene Maßnahme:",
    lbl_status_healthy: "🟢 Geschäft stabil",
    lbl_status_live: "🟢 Live-Daten verbunden",
    lbl_status_preview: "⚪ Ansichtsmuster",
    lbl_calculated_from: "Berechnet aus",
    lbl_illustrative_template: "⚠️ Ansichtsmuster (Laden Sie Daten hoch, um Live-KPIs zu berechnen)",

    // Beginner Mode
    lbl_beginner_guided_mode: "Geführter Einsteigermodus",
    lbl_recommended_next_action: "Empfohlener nächster Schritt",
    beginner_subtitle: "Ein klarer Schritt pro Stufe • Einfache Sprache ohne Formeln",
    step_connect_data: "Daten verbinden",
    step_quality_privacy: "Qualitäts- & Datenschutzprüfung",
    step_explore_trends: "Visuelle Trends erkunden",
    step_ask_questions: "Fragen in Alltagssprache stellen",
    step_exec_report: "Vorstandsbericht erstellen",
    glossary_btn: "📖 Einfaches Glossar",
    copilot_ask_anything: "💬 Fragen Sie Ihren KI-Copilot...",

    // Charts & Slicers
    chart_revenue_by_cat: "Umsatz nach Kategorie",
    chart_orders_by_region: "Bestellungen nach Region",
    chart_sales_over_time: "Umsatzverlauf im Zeitablauf",
    slicer_all_regions: "Alle Regionen",
    filter_by: "Filtern nach"
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
    stage_4: "ステージ 4: クリーニング済みデータ",
    stage_5: "ステージ 5: 探索的分析",
    stage_6: "ステージ 6: AIインサイト",
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
    no_tabular_data: "表形式データが検出されませんでした。サポートされているファイルをアップロードしてください。",
    sign_out: "サインアウト",

    // Tabs
    tab_dashboard: "📊 Power BI ダッシュボード",
    tab_data: "📁 01 生データ",
    tab_quality: "🛡️ 02 データ品質",
    tab_cleaning: "🧹 03 データクリーニング",
    tab_cleaned: "✨ 04 クリーニング済みデータ",
    tab_eda: "🔍 05 探索的分析",
    tab_insights: "💡 06 AIインサイト",
    tab_ml: "🤖 07 機械学習モデリング",
    tab_forecast: "🔮 08 予測分析",
    tab_stats: "📑 09 経営サマリーレポート",

    // Sidebar & Navigation
    nav_new_analysis: "+ 新規分析",
    nav_import_sheet: "🔗 Googleスプレッドシート連携",
    nav_recent: "最近のファイル",
    nav_no_recent: "最近のファイルはありません",
    cloud_warming_up: "クラウド同期起動中 • ブラウザ内エンジン稼働中",

    // KPI Cards
    kpi_total_revenue: "総売上高",
    kpi_net_profit: "純利益",
    kpi_operating_margin: "営業利益率",
    kpi_profit_margin: "利益率",
    kpi_total_orders: "総注文数 / レコード数",
    kpi_total_records: "データ件数",
    kpi_data_health: "データヘルス",
    kpi_ai_findings: "AI検知項目",
    kpi_transformations: "データ変換履歴",
    kpi_forecast_trajectory: "予測トレンド",
    kpi_trained_models: "学習済みMLモデル",
    kpi_operating_cost: "営業費用",
    kpi_budget_variance: "予算差異",
    kpi_gross_margin: "売上総利益率",

    // Action Buttons
    btn_inspect_quality: "品質を確認",
    btn_explore_data: "データを探索",
    btn_investigate: "詳細を調査",
    btn_view_lineage: "リネージを確認",
    btn_open_forecast: "予測を開く",
    btn_compare_models: "モデルを比較",
    btn_ask_copilot: "Copilotに質問",
    btn_upload_dataset: "データをアップロード",
    btn_generate_report: "PDFレポートを作成",
    btn_explain_charts: "グラフを解説",
    btn_reset_filters: "フィルターをリセット",
    btn_return_bi: "BIワークスペースに戻る",

    // Headers & Sections
    hdr_executive_dashboard: "経営分析ダッシュボード",
    hdr_executive_command_center: "エグゼクティブ・コマンドセンター",
    hdr_finance_command_center: "財務コマンドセンター",
    hdr_workspace_command_center: "ワークスペース・コマンドセンター",
    sec_key_metrics: "主要ビジネス業績指標",
    sec_financial_metrics: "財務実績メトリクス",
    sec_ai_brief: "AIエグゼクティブブリーフ",
    sec_needs_attention: "要確認アラート",
    sec_interactive_filters: "インタラクティブフィルター",
    sec_try_asking: "質問の例：",
    sec_recommended_action: "推奨アクション：",
    lbl_status_healthy: "🟢 事業健全",
    lbl_status_live: "🟢 実データ接続中",
    lbl_status_preview: "⚪ サンプルプレビュー",
    lbl_calculated_from: "算出元：",
    lbl_illustrative_template: "⚠️ サンプルテンプレート（実データをアップロードして算出）",

    // Beginner Mode
    lbl_beginner_guided_mode: "初心者向けガイドモード",
    lbl_recommended_next_action: "おすすめの次のステップ",
    beginner_subtitle: "各ステージで迷わない1つの推奨アクション • 数式不要の分かりやすい言葉",
    step_connect_data: "データを接続",
    step_quality_privacy: "データ品質＆プライバシー確認",
    step_explore_trends: "視覚的トレンドを探索",
    step_ask_questions: "自然言語で質問する",
    step_exec_report: "経営レポートを作成",
    glossary_btn: "📖 用語集",
    copilot_ask_anything: "💬 AI Copilotに自由に質問...",

    // Charts & Slicers
    chart_revenue_by_cat: "カテゴリ別売上高",
    chart_orders_by_region: "地域別注文数",
    chart_sales_over_time: "売上推移",
    slicer_all_regions: "全地域",
    filter_by: "絞り込み"
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
