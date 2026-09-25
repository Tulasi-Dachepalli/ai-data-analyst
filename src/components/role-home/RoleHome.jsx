// src/components/role-home/RoleHome.jsx
import React from "react";
import { useRole } from "../../context/RoleContext";
import CEOHome from "./CEOHome";
import HRHome from "./HRHome";
import RecruiterHome from "./RecruiterHome";
import FinanceHome from "./FinanceHome";
import DataAnalystHome from "./DataAnalystHome";
import DataScientistHome from "./DataScientistHome";

export default function RoleHome({ active, activeData = [], activeCols = [], onAskQuestion }) {
  const { activeRole } = useRole();

  switch (activeRole) {
    case "ceo":
      return <CEOHome onAskQuestion={onAskQuestion} />;
    case "hr":
      return <HRHome onAskQuestion={onAskQuestion} />;
    case "recruiter":
      return <RecruiterHome onAskQuestion={onAskQuestion} />;
    case "finance":
      return <FinanceHome onAskQuestion={onAskQuestion} />;
    case "data_analyst":
      return <DataAnalystHome onAskQuestion={onAskQuestion} />;
    case "data_scientist":
      return <DataScientistHome active={active} activeData={activeData} activeCols={activeCols} onAskQuestion={onAskQuestion} />;
    default:
      return <CEOHome onAskQuestion={onAskQuestion} />;
  }
}
