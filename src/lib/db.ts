// ──────────────────────────────────────────────────────────────
// ResearchHub AI — Database Layer (REST API over MongoDB)
// Keeps the same synchronous-ish API as the old localStorage layer
// but persists all data to our Express/MongoDB backend.
// ──────────────────────────────────────────────────────────────

// ── ID helper ────────────────────────────────────────────────
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── API helper
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`/api${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `API Error: ${response.status}`);
  }
  return response.json();
}

// ─────────────────────────────────────────────────────────────
// ── User type
// ─────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // kept for interface compatibility; not stored client-side
  role: "admin" | "officer" | "auditor";
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// ── Plot ← API
// ─────────────────────────────────────────────────────────────
export type PlotStatus = "compliant" | "pending" | "defaulting" | "closed";
export type SectorType = "Industrial" | "MSME" | "IT/ITES" | "Agro-based" | "Textile" | "Chemical" | "Auto Component";

export interface Plot {
  id: string;
  userId: string;
  plotNumber: string;
  allotteeName: string;
  company: string;
  sector: SectorType;
  area: number;
  location: string;
  allotmentDate: string;
  leaseStartDate: string;
  leaseEndDate: string;
  status: PlotStatus;
  investmentCommitted: number;
  employmentCommitted: number;
  cautionDeposit: number;
  landCostSubsidy: number;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

// In-memory cache so synchronous callers still work after an initial fetch
let _plotCache: Plot[] = [];
export function setPlotCache(plots: Plot[]) { _plotCache = plots; }

export const plotDb = {
  // Synchronous (from cache)
  getAll: (): Plot[] => _plotCache,
  getByUser: (userId: string): Plot[] => _plotCache.filter(p => p.userId === userId),
  getById: (id: string): Plot | undefined => _plotCache.find(p => p.id === id),
  countByUser: (userId: string): number => _plotCache.filter(p => p.userId === userId).length,
  countByStatus: (userId: string, status: PlotStatus): number =>
    _plotCache.filter(p => p.userId === userId && p.status === status).length,

  // Async fetch from API (call on page load)
  async fetchByUser(userId: string): Promise<Plot[]> {
    try {
      const plots = await apiFetch('/plots');
      _plotCache = [..._plotCache.filter(p => p.userId !== userId), ...plots];
      return plots;
    } catch (e) {
      console.error("plotDb.fetchByUser error:", e);
      return [];
    }
  },

  async save(plot: Omit<Plot, "id" | "createdAt" | "updatedAt">): Promise<Plot> {
    const newPlot = await apiFetch('/plots', {
      method: 'POST',
      body: JSON.stringify(plot)
    });
    _plotCache = [..._plotCache, newPlot];
    return newPlot;
  },

  async update(id: string, updates: Partial<Plot>): Promise<void> {
    const updatedPlot = await apiFetch(`/plots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    _plotCache = _plotCache.map(p => p.id === id ? updatedPlot : p);
  },

  async delete(id: string): Promise<void> {
    await apiFetch(`/plots/${id}`, { method: 'DELETE' });
    _plotCache = _plotCache.filter(p => p.id !== id);
  },
};

// ─────────────────────────────────────────────────────────────
// ── ComplianceRecord ← API
// ─────────────────────────────────────────────────────────────
export type CautionStatus = "held" | "refund_due" | "refund_initiated" | "refunded";
export type SubsidyStatus = "not_applied" | "applied" | "approved" | "disbursed" | "rejected";
export type ComplianceItemStatus = "compliant" | "pending" | "overdue" | "na";

export interface ComplianceRecord {
  id: string;
  plotId: string;
  userId: string;
  investmentActual: number;
  investmentAsOn: string;
  investmentStatus: ComplianceItemStatus;
  employmentActual: number;
  employmentAsOn: string;
  employmentStatus: ComplianceItemStatus;
  cautionStatus: CautionStatus;
  cautionRefundDueDate?: string;
  cautionRefundedOn?: string;
  subsidyStatus: SubsidyStatus;
  subsidyAppliedOn?: string;
  subsidyApprovedOn?: string;
  subsidyDisbursedOn?: string;
  subsidyAmountDisbursed?: number;
  constructionStarted: boolean;
  constructionCompleted: boolean;
  productionStarted: boolean;
  productionStartDate?: string;
  leaseRenewalStatus: ComplianceItemStatus;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  inspectionRemarks: string;
  updatedAt: string;
  updatedBy: string;
}

let _compCache: ComplianceRecord[] = [];
export function setComplianceCache(records: ComplianceRecord[]) { _compCache = records; }

export const complianceDb = {
  getByPlot: (plotId: string): ComplianceRecord | undefined => _compCache.find(c => c.plotId === plotId),
  getByUser: (userId: string): ComplianceRecord[] => _compCache.filter(c => c.userId === userId),

  async fetchByUser(userId: string): Promise<ComplianceRecord[]> {
    try {
      const records = await apiFetch('/compliance');
      _compCache = [..._compCache.filter(c => c.userId !== userId), ...records];
      return records;
    } catch (e) {
      console.error("complianceDb.fetchByUser error:", e);
      return [];
    }
  },

  async upsert(record: Omit<ComplianceRecord, "id" | "updatedAt">): Promise<ComplianceRecord> {
    const result = await apiFetch('/compliance', {
      method: 'POST',
      body: JSON.stringify(record)
    });
    _compCache = [..._compCache.filter(c => c.plotId !== record.plotId), result];
    return result;
  },
};

// ─────────────────────────────────────────────────────────────
// ── PlotDocument ← API
// ─────────────────────────────────────────────────────────────
export type DocumentType =
  | "allotment_order" | "lease_deed" | "noc_pollution" | "noc_fire"
  | "investment_certificate" | "employment_certificate" | "completion_certificate"
  | "subsidy_application" | "subsidy_sanction" | "inspection_report"
  | "caution_receipt" | "other";

export interface PlotDocument {
  id: string;
  plotId: string;
  userId: string;
  type: DocumentType;
  title: string;
  description: string;
  fileDate: string;
  expiryDate?: string;
  status: "valid" | "expired" | "pending_renewal";
  uploadedAt: string;
}

let _docCache: PlotDocument[] = [];
export function setDocCache(docs: PlotDocument[]) { _docCache = docs; }

export const documentDb = {
  getByPlot: (plotId: string): PlotDocument[] => _docCache.filter(d => d.plotId === plotId),
  getByUser: (userId: string): PlotDocument[] => _docCache.filter(d => d.userId === userId),
  countByUser: (userId: string): number => _docCache.filter(d => d.userId === userId).length,

  async fetchByUser(userId: string): Promise<PlotDocument[]> {
    try {
      const docs = await apiFetch('/documents');
      _docCache = [..._docCache.filter(d => d.userId !== userId), ...docs];
      return docs;
    } catch (e) {
      console.error("documentDb.fetchByUser error:", e);
      return [];
    }
  },

  async save(doc: Omit<PlotDocument, "id" | "uploadedAt">): Promise<PlotDocument> {
    const newDoc = await apiFetch('/documents', {
      method: 'POST',
      body: JSON.stringify(doc)
    });
    _docCache = [..._docCache, newDoc];
    return newDoc;
  },

  async delete(id: string): Promise<void> {
    await apiFetch(`/documents/${id}`, { method: 'DELETE' });
    _docCache = _docCache.filter(d => d.id !== id);
  },
};

// ─────────────────────────────────────────────────────────────
// ── ChatMessage ← API
// ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  userId: string;
  plotId?: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

let _chatCache: ChatMessage[] = [];
export function setChatCache(msgs: ChatMessage[]) { _chatCache = msgs; }

export const chatDb = {
  getByUser: (userId: string): ChatMessage[] => _chatCache.filter(m => m.userId === userId),
  countByUser: (userId: string): number => _chatCache.filter(m => m.userId === userId && m.role === "user").length,

  async fetchByUser(userId: string): Promise<ChatMessage[]> {
    try {
      const msgs = await apiFetch('/chat');
      _chatCache = [..._chatCache.filter(m => m.userId !== userId), ...msgs];
      return msgs;
    } catch (e) {
      console.error("chatDb.fetchByUser error:", e);
      return [];
    }
  },

  add(msg: Omit<ChatMessage, "id">): ChatMessage {
    const newMsg: ChatMessage = { ...msg, id: genId() };
    _chatCache = [..._chatCache, newMsg];

    // Fire-and-forget
    apiFetch('/chat', {
      method: 'POST',
      body: JSON.stringify(msg)
    }).catch(e => console.error("chatDb.add error:", e));

    return newMsg;
  },
};

// ─────────────────────────────────────────────────────────────
// ── ActivityLog ← API
// ─────────────────────────────────────────────────────────────
export interface ActivityItem {
  id: string;
  userId: string;
  plotId?: string;
  action: string;
  detail: string;
  time: string;
}

let _actCache: ActivityItem[] = [];

export const activityDb = {
  getByUser: (userId: string): ActivityItem[] =>
    _actCache.filter(a => a.userId === userId).slice(0, 20),

  async fetchByUser(userId: string): Promise<ActivityItem[]> {
    try {
      const items = await apiFetch('/activity');
      _actCache = [..._actCache.filter(a => a.userId !== userId), ...items];
      return items;
    } catch (e) {
      console.error("activityDb.fetchByUser error:", e);
      return [];
    }
  },

  log(userId: string, action: string, detail: string, plotId?: string): void {
    const item: ActivityItem = { id: genId(), userId, action, detail, time: new Date().toISOString(), plotId };
    _actCache = [item, ..._actCache];

    // Fire-and-forget
    apiFetch('/activity', {
      method: 'POST',
      body: JSON.stringify({ action, detail, time: item.time, plotId })
    }).catch(e => console.error("activityDb.log error:", e));
  },
};

// ─────────────────────────────────────────────────────────────
// ── Seed Demo Data (async, API-backed)
// ─────────────────────────────────────────────────────────────
export async function seedDemoData(userId: string): Promise<void> {
  const existing = await plotDb.fetchByUser(userId);
  if (existing.length > 0) return;

  const plotDefs: Omit<Plot, "id" | "createdAt" | "updatedAt">[] = [
    {
      userId, plotNumber: "SIDCO/CHN/A-14", allotteeName: "Rajesh Kumar",
      company: "RK Auto Components Pvt Ltd", sector: "Auto Component",
      area: 4500, location: "SIDCO Industrial Estate, Ambattur, Chennai",
      allotmentDate: "2021-03-15", leaseStartDate: "2021-06-01", leaseEndDate: "2041-05-31",
      status: "compliant", investmentCommitted: 450, employmentCommitted: 85,
      cautionDeposit: 9.5, landCostSubsidy: 45, notes: "Production started on schedule. Compliant.",
    },
    {
      userId, plotNumber: "TIDCO/CBE/B-07", allotteeName: "Priya Textiles",
      company: "Priya Textile Mills Ltd", sector: "Textile",
      area: 8200, location: "TIDCO Textile Park, Coimbatore",
      allotmentDate: "2020-08-10", leaseStartDate: "2020-11-01", leaseEndDate: "2040-10-31",
      status: "pending", investmentCommitted: 820, employmentCommitted: 220,
      cautionDeposit: 18.2, landCostSubsidy: 82, notes: "Investment behind schedule. Follow-up needed.",
    },
    {
      userId, plotNumber: "SIPCOT/MDU/C-22", allotteeName: "GreenBio Agro",
      company: "GreenBio Agro Industries", sector: "Agro-based",
      area: 12000, location: "SIPCOT Growth Centre, Madurai",
      allotmentDate: "2019-05-20", leaseStartDate: "2019-09-01", leaseEndDate: "2039-08-31",
      status: "defaulting", investmentCommitted: 1200, employmentCommitted: 310,
      cautionDeposit: 28, landCostSubsidy: 120, notes: "Construction not started. Show-cause notice issued.",
    },
    {
      userId, plotNumber: "SIDCO/TRY/D-03", allotteeName: "Tamil Tech Solutions",
      company: "Tamil Tech Solutions Pvt Ltd", sector: "IT/ITES",
      area: 3200, location: "SIDCO IT Park, Tiruchirappalli",
      allotmentDate: "2022-01-10", leaseStartDate: "2022-04-01", leaseEndDate: "2042-03-31",
      status: "compliant", investmentCommitted: 280, employmentCommitted: 150,
      cautionDeposit: 6.8, landCostSubsidy: 28, notes: "All compliances met. Subsidy disbursed.",
    },
    {
      userId, plotNumber: "TIDCO/VEL/E-11", allotteeName: "Sri Lakshmi Chemicals",
      company: "Sri Lakshmi Chem Industries", sector: "Chemical",
      area: 6800, location: "TIDCO Chemical Zone, Vellore",
      allotmentDate: "2021-11-05", leaseStartDate: "2022-01-15", leaseEndDate: "2042-01-14",
      status: "pending", investmentCommitted: 680, employmentCommitted: 125,
      cautionDeposit: 15, landCostSubsidy: 68, notes: "Pollution NOC pending renewal.",
    },
  ];

  for (const p of plotDefs) {
    try {
      const plot = await plotDb.save(p);
      await complianceDb.upsert({
        plotId: plot.id, userId,
        investmentActual: p.status === "compliant" ? p.investmentCommitted * 0.95 : p.status === "pending" ? p.investmentCommitted * 0.45 : p.investmentCommitted * 0.08,
        investmentAsOn: new Date().toISOString().split("T")[0],
        investmentStatus: p.status === "compliant" ? "compliant" : p.status === "defaulting" ? "overdue" : "pending",
        employmentActual: p.status === "compliant" ? Math.round(p.employmentCommitted * 0.92) : p.status === "pending" ? Math.round(p.employmentCommitted * 0.4) : 0,
        employmentAsOn: new Date().toISOString().split("T")[0],
        employmentStatus: p.status === "compliant" ? "compliant" : p.status === "defaulting" ? "overdue" : "pending",
        cautionStatus: p.status === "compliant" ? "held" : "held",
        subsidyStatus: p.status === "compliant" ? "disbursed" : p.status === "pending" ? "applied" : "not_applied",
        constructionStarted: p.status !== "defaulting",
        constructionCompleted: p.status === "compliant",
        productionStarted: p.status === "compliant",
        productionStartDate: p.status === "compliant" ? "2022-06-01" : undefined,
        leaseRenewalStatus: "compliant",
        lastInspectionDate: "2024-01-15",
        nextInspectionDate: "2025-01-15",
        inspectionRemarks: p.status === "compliant" ? "All terms satisfied." : p.status === "defaulting" ? "Site idle. Show cause issued." : "Partial progress noted.",
        updatedBy: userId,
      });

      const docDefs: Omit<PlotDocument, "id" | "uploadedAt">[] = [
        { plotId: plot.id, userId, type: "allotment_order", title: "Allotment Order", description: `Allotment Order for ${plot.plotNumber}`, fileDate: p.allotmentDate, status: "valid" },
        { plotId: plot.id, userId, type: "lease_deed", title: "Lease Deed", description: "Registered Lease Deed", fileDate: p.leaseStartDate, status: "valid" },
      ];
      if (p.status === "compliant") {
        docDefs.push({ plotId: plot.id, userId, type: "completion_certificate", title: "Completion Certificate", description: "Construction Completion", fileDate: "2022-05-01", status: "valid" });
        docDefs.push({ plotId: plot.id, userId, type: "subsidy_sanction", title: "Subsidy Sanction", description: "Land Cost Subsidy", fileDate: "2022-08-10", status: "valid" });
      }
      for (const d of docDefs) await documentDb.save(d);
    } catch (e) {
      console.error("seedDemoData error:", e);
    }
  }

  activityDb.log(userId, "System initialized", "Plot monitoring database seeded with demo data");
}
