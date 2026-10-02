import React, { useState } from "react";
import DatasetLibrary from "./components/library/DatasetLibrary";
import DatasetImportCenter from "./components/import/DatasetImportCenter";

export default function DatasetsPage({ onOpen }) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div>
      <DatasetLibrary
        onOpenWorkspace={onOpen}
        onOpenImport={() => setImportOpen(true)}
      />
      <DatasetImportCenter
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
