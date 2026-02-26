// ──────────────────────────────────────────────────────────────
// PlotGuardian AI — localStorage Database Layer
// Domain: Plot Allotment Compliance Monitoring
// ──────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────
function get<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; }
  catch { return []; }
}
function set<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${hash}_${btoa(password).slice(0, 8)}`;
}

// ── User ──────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "officer" | "auditor";
  createdAt: string;
}

export const userDb = {
  getAll: (): User[] => get<User>("pg_users"),
  getById: (id: string) => get<User>("pg_users").find(u => u.id === id),
  getByEmail: (email: string) => get<User>("pg_users").find(u => u.email.toLowerCase() === email.toLowerCase()),
  create(name: string, email: string, password: string, role: User["role"] = "officer"): User {
    const users = get<User>("pg_users");
    const user: User = { id: genId(), name, email, passwordHash: hashPassword(password), role, createdAt: new Date().toISOString() };
    set("pg_users", [...users, user]);
    return user;
  },
  login(email: string, password: string): User | null {
    const user = get<User>("pg_users").find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    if (user.passwordHash !== hashPassword(password)) return null;
    return user;
  },
};

// ── Plot ──────────────────────────────────────────────────────
export type PlotStatus = "compliant" | "pending" | "defaulting" | "closed";
export type SectorType = "Industrial" | "MSME" | "IT/ITES" | "Agro-based" | "Textile" | "Chemical" | "Auto Component";

export interface Plot {
  id: string;
  userId: string;                     // monitoring officer
  plotNumber: string;                 // e.g. "SIDCO/CHN/A-14"
  allotteeName: string;
  company: string;
  sector: SectorType;
  area: number;                       // in sq metres
  location: string;
  allotmentDate: string;
  leaseStartDate: string;
  leaseEndDate: string;
  status: PlotStatus;
  investmentCommitted: number;        // in lakhs
  employmentCommitted: number;        // number of employees
  cautionDeposit: number;             // in lakhs
  landCostSubsidy: number;            // in lakhs (eligible amount)
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export const plotDb = {
  getAll: (): Plot[] => get<Plot>("pg_plots"),
  getByUser: (userId: string): Plot[] => get<Plot>("pg_plots").filter(p => p.userId === userId),
  getById: (id: string): Plot | undefined => get<Plot>("pg_plots").find(p => p.id === id),
  countByUser: (userId: string): number => get<Plot>("pg_plots").filter(p => p.userId === userId).length,
  countByStatus: (userId: string, status: PlotStatus): number =>
    get<Plot>("pg_plots").filter(p => p.userId === userId && p.status === status).length,

  save(plot: Omit<Plot, "id" | "createdAt" | "updatedAt">): Plot {
    const all = get<Plot>("pg_plots");
    const now = new Date().toISOString();
    const newPlot: Plot = { ...plot, id: genId(), createdAt: now, updatedAt: now };
    set("pg_plots", [...all, newPlot]);
    return newPlot;
  },
  update(id: string, updates: Partial<Plot>): void {
    const all = get<Plot>("pg_plots");
    set("pg_plots", all.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  },
  delete(id: string): void {
    set("pg_plots", get<Plot>("pg_plots").filter(p => p.id !== id));
  },
};

// ── Compliance Record ─────────────────────────────────────────
export type CautionStatus = "held" | "refund_due" | "refund_initiated" | "refunded";
export type SubsidyStatus = "not_applied" | "applied" | "approved" | "disbursed" | "rejected";
export type ComplianceItemStatus = "compliant" | "pending" | "overdue" | "na";

export interface ComplianceRecord {
  id: string;
  plotId: string;
  userId: string;
  // Investment tracking
  investmentActual: number;           // in lakhs
  investmentAsOn: string;
  investmentStatus: ComplianceItemStatus;
  // Employment tracking
  employmentActual: number;
  employmentAsOn: string;
  employmentStatus: ComplianceItemStatus;
  // Caution deposit
  cautionStatus: CautionStatus;
  cautionRefundDueDate?: string;
  cautionRefundedOn?: string;
  // Land cost subsidy
  subsidyStatus: SubsidyStatus;
  subsidyAppliedOn?: string;
  subsidyApprovedOn?: string;
  subsidyDisbursedOn?: string;
  subsidyAmountDisbursed?: number;
  // Lease compliance
  constructionStarted: boolean;
  constructionCompleted: boolean;
  productionStarted: boolean;
  productionStartDate?: string;
  leaseRenewalStatus: ComplianceItemStatus;
  // Inspection
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  inspectionRemarks: string;
  // Meta
  updatedAt: string;
  updatedBy: string;
}

export const complianceDb = {
  getByPlot: (plotId: string): ComplianceRecord | undefined =>
    get<ComplianceRecord>("pg_compliance").find(c => c.plotId === plotId),
  getByUser: (userId: string): ComplianceRecord[] =>
    get<ComplianceRecord>("pg_compliance").filter(c => c.userId === userId),

  upsert(record: Omit<ComplianceRecord, "id" | "updatedAt">): ComplianceRecord {
    const all = get<ComplianceRecord>("pg_compliance");
    const existing = all.find(c => c.plotId === record.plotId);
    const now = new Date().toISOString();
    if (existing) {
      const updated = { ...existing, ...record, updatedAt: now };
      set("pg_compliance", all.map(c => c.plotId === record.plotId ? updated : c));
      return updated;
    }
    const newRecord: ComplianceRecord = { ...record, id: genId(), updatedAt: now };
    set("pg_compliance", [...all, newRecord]);
    return newRecord;
  },
};

// ── Document ──────────────────────────────────────────────────
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

export const documentDb = {
  getByPlot: (plotId: string): PlotDocument[] =>
    get<PlotDocument>("pg_documents").filter(d => d.plotId === plotId),
  getByUser: (userId: string): PlotDocument[] =>
    get<PlotDocument>("pg_documents").filter(d => d.userId === userId),
  countByUser: (userId: string): number => get<PlotDocument>("pg_documents").filter(d => d.userId === userId).length,

  save(doc: Omit<PlotDocument, "id" | "uploadedAt">): PlotDocument {
    const all = get<PlotDocument>("pg_documents");
    const newDoc: PlotDocument = { ...doc, id: genId(), uploadedAt: new Date().toISOString() };
    set("pg_documents", [...all, newDoc]);
    return newDoc;
  },
  delete(id: string): void {
    set("pg_documents", get<PlotDocument>("pg_documents").filter(d => d.id !== id));
  },
};

// ── Chat Messages ─────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  userId: string;
  plotId?: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export const chatDb = {
  getByUser: (userId: string): ChatMessage[] =>
    get<ChatMessage>("pg_chats").filter(m => m.userId === userId),
  add(msg: Omit<ChatMessage, "id">): ChatMessage {
    const all = get<ChatMessage>("pg_chats");
    const newMsg = { ...msg, id: genId() };
    set("pg_chats", [...all, newMsg]);
    return newMsg;
  },
  countByUser: (userId: string): number =>
    get<ChatMessage>("pg_chats").filter(m => m.userId === userId && m.role === "user").length,
};

// ── Activity Log ──────────────────────────────────────────────
export interface ActivityItem {
  id: string;
  userId: string;
  plotId?: string;
  action: string;
  detail: string;
  time: string;
}

export const activityDb = {
  getByUser: (userId: string): ActivityItem[] =>
    get<ActivityItem>("pg_activity")
      .filter(a => a.userId === userId)
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 20),
  log(userId: string, action: string, detail: string, plotId?: string): void {
    const all = get<ActivityItem>("pg_activity");
    set("pg_activity", [...all, { id: genId(), userId, action, detail, time: new Date().toISOString(), plotId }]);
  },
};

// ── Seed Demo Data ────────────────────────────────────────────
export function seedDemoData(userId: string): void {
  if (plotDb.getByUser(userId).length > 0) return;

  const plots: Omit<Plot, "id" | "createdAt" | "updatedAt">[] = [
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

  plots.forEach(p => {
    const plot = plotDb.save(p);
    // Create matching compliance records
    const compliance: Omit<ComplianceRecord, "id" | "updatedAt"> = {
      plotId: plot.id, userId,
      investmentActual: p.status === "compliant" ? p.investmentCommitted * 0.95 : p.status === "pending" ? p.investmentCommitted * 0.45 : p.investmentCommitted * 0.08,
      investmentAsOn: new Date().toISOString().split("T")[0],
      investmentStatus: p.status === "compliant" ? "compliant" : p.status === "defaulting" ? "overdue" : "pending",
      employmentActual: p.status === "compliant" ? Math.round(p.employmentCommitted * 0.92) : p.status === "pending" ? Math.round(p.employmentCommitted * 0.4) : 0,
      employmentAsOn: new Date().toISOString().split("T")[0],
      employmentStatus: p.status === "compliant" ? "compliant" : p.status === "defaulting" ? "overdue" : "pending",
      cautionStatus: p.status === "compliant" ? "held" : p.status === "closed" ? "refunded" : "held",
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
    };
    complianceDb.upsert(compliance);

    // Add documents
    const docTypes: Omit<PlotDocument, "id" | "uploadedAt">[] = [
      { plotId: plot.id, userId, type: "allotment_order", title: "Allotment Order", description: `Allotment Order for ${plot.plotNumber}`, fileDate: p.allotmentDate, status: "valid" },
      { plotId: plot.id, userId, type: "lease_deed", title: "Lease Deed", description: `Registered Lease Deed`, fileDate: p.leaseStartDate, status: "valid" },
    ];
    if (p.status === "compliant") {
      docTypes.push({ plotId: plot.id, userId, type: "completion_certificate", title: "Completion Certificate", description: "Construction Completion", fileDate: "2022-05-01", status: "valid" });
      docTypes.push({ plotId: plot.id, userId, type: "subsidy_sanction", title: "Subsidy Sanction", description: "Land Cost Subsidy", fileDate: "2022-08-10", status: "valid" });
    }
    docTypes.forEach(d => documentDb.save(d));
  });

  activityDb.log(userId, "System initialized", "Plot monitoring database seeded with demo data");
}
