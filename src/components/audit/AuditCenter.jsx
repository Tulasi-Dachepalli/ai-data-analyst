import React, { useState } from 'react';
import { useActivity } from '../../context/ActivityContext';
import { useDataset } from '../../context/DatasetContext';

export default function AuditCenter() {
  const { logs = [] } = useActivity();
  const { currentDataset } = useDataset();
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  // Default initial audit entries if activity log is fresh
  const defaultAuditLogs = [
    {
      id: 'aud-001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: 'Tulasi (Data Analyst)',
      action: 'DATASET_MUTATION',
      category: 'Lineage',
      severity: 'INFO',
      details: 'Created Version 2 (Cleaned) via Automated Cleaning Pipeline.',
      resource: currentDataset?.name ? `${currentDataset.name} (v1)` : 'No Dataset Selected',
      ip: '192.168.1.42',
      metadata: { rowsBefore: 5000, rowsAfter: 4988, duplicatesRemoved: 12 }
    },
    {
      id: 'aud-002',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: 'Tulasi (Data Analyst)',
      action: 'SENSITIVE_DATA_ACCESS',
      category: 'Security',
      severity: 'WARNING',
      details: 'Viewed sensitive column [Salary] under Masked Policy (AES-256 hash).',
      resource: 'Column: Salary',
      ip: '192.168.1.42',
      metadata: { policy: 'Masked', role: 'DATA_ANALYST', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
    },
    {
      id: 'aud-003',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      user: 'System Bot',
      action: 'AI_MODEL_TRAINING',
      category: 'Intelligence',
      severity: 'INFO',
      details: 'Trained Random Forest Regressor candidate model (R² = 0.942).',
      resource: 'Model Registry',
      ip: '10.0.0.1',
      metadata: { model: 'Random Forest', metric: 'R2: 0.942', features: 6 }
    },
    {
      id: 'aud-004',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      user: 'Tulasi (Data Analyst)',
      action: 'REPORT_EXPORT',
      category: 'Compliance',
      severity: 'INFO',
      details: 'Exported Executive Summary Report in PDF format with watermark.',
      resource: 'Executive_Summary_v2.pdf',
      ip: '192.168.1.42',
      metadata: { format: 'PDF', watermarked: true, pages: 4 }
    }
  ];

  // Merge context logs with defaults
  const combinedLogs = [...logs.map((l, idx) => ({
    id: `aud-ctx-${idx}`,
    timestamp: l.timestamp || new Date().toISOString(),
    user: l.user || 'Tulasi (Data Analyst)',
    action: l.action || 'SYSTEM_ACTIVITY',
    category: l.category || 'System',
    severity: l.severity || 'INFO',
    details: l.description || l.message || JSON.stringify(l),
    resource: l.resource || currentDataset?.name || 'Workspace',
    ip: '192.168.1.42',
    metadata: l.metadata || l
  })), ...defaultAuditLogs];

  const filteredLogs = combinedLogs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const handleExportAuditCSV = () => {
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Category', 'Severity', 'Details', 'IP'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.user}"`,
      l.action,
      l.category,
      l.severity,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ip
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enterprise_audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="audit-center" style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'sans-serif' }}>
      {/* Header & Controls */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🛡️</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Enterprise Audit & Compliance Center</h2>
            </div>
            <p style={{ color: '#64748B', fontSize: 13, marginTop: 4, margin: 0 }}>
              Immutable security, lineage, and access compliance log repository.
            </p>
          </div>
          <button
            data-testid="audit-export-csv-btn"
            onClick={handleExportAuditCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <span>📥</span>
            <span>Export Compliance CSV</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            data-testid="audit-search-input"
            type="text"
            placeholder="Search audit actions, users, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: 240, padding: '8px 14px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }}
          />

          <select
            data-testid="audit-filter-severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px', backgroundColor: '#FFF', color: '#334155' }}
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          <select
            data-testid="audit-filter-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px', backgroundColor: '#FFF', color: '#334155' }}
          >
            <option value="ALL">All Categories</option>
            <option value="Lineage">Lineage</option>
            <option value="Security">Security</option>
            <option value="Intelligence">Intelligence</option>
            <option value="Compliance">Compliance</option>
            <option value="System">System</option>
          </select>
        </div>
      </div>

      {/* Log Table & Drawer Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedLog ? '2fr 1fr' : '1fr', gap: 24 }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', color: '#475569', fontWeight: 700, borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px' }}>User</th>
                  <th style={{ padding: '12px 16px' }}>Action</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Severity</th>
                  <th style={{ padding: '12px 16px' }}>Details</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    data-testid={`audit-row-${log.id}`}
                    style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', backgroundColor: selectedLog?.id === log.id ? '#EEF2FF' : 'transparent' }}
                    onClick={() => setSelectedLog(log)}
                  >
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: 11.5, color: '#64748B' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A', fontSize: 12 }}>
                      {log.user}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#2563EB' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12 }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, backgroundColor: '#F1F5F9', color: '#334155', fontWeight: 600 }}>
                        {log.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12 }}>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: 12, 
                        fontWeight: 700, 
                        fontSize: 11,
                        backgroundColor: log.severity === 'WARNING' ? '#FEF3C7' : log.severity === 'CRITICAL' ? '#FEE2E2' : '#D1FAE5',
                        color: log.severity === 'WARNING' ? '#92400E' : log.severity === 'CRITICAL' ? '#991B1B' : '#065F46'
                      }}>
                        {log.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#334155', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button 
                        data-testid={`audit-inspect-btn-${log.id}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 14 }}
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Log JSON Drawer */}
        {selectedLog && (
          <div data-testid="audit-json-inspector" style={{ backgroundColor: '#0F172A', borderRadius: 12, padding: 20, color: '#E2E8F0', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                🔒 Audit Inspector Payload
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}
              >
                [Close]
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Log ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{selectedLog.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>User:</span>
                <span>{selectedLog.user}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>IP Address:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.ip}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Resource:</span>
                <span>{selectedLog.resource}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: 6 }}>Raw Metadata JSON</span>
              <pre style={{ backgroundColor: '#020617', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 11, color: '#34D399', overflowX: 'auto', border: '1px solid #1E293B', margin: 0 }}>
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
