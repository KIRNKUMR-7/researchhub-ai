// ─────────────────────────────────────────────────────────────────
// PlotGuardian AI — Automation Engine
// Runs compliance checks automatically and generates prioritised alerts
// ─────────────────────────────────────────────────────────────────

import { plotDb, complianceDb, documentDb, type Plot, type ComplianceRecord } from "./db";

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertCategory =
    | "investment"
    | "employment"
    | "lease_expiry"
    | "caution_deposit"
    | "subsidy"
    | "production"
    | "document"
    | "construction";

export interface ComplianceAlert {
    id: string;
    plotId: string;
    plotNumber: string;
    company: string;
    severity: AlertSeverity;
    category: AlertCategory;
    title: string;
    description: string;
    generatedAt: string;
    actionRequired: string;
}

// Calculate days between now and a date string
function daysUntil(dateStr: string): number {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function daysAgo(dateStr: string): number {
    return Math.ceil((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function alertId(): string {
    return `ALT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Main automation function — runs all compliance rules against all plots
 * and returns a prioritised list of alerts.
 */
export function runAutomationChecks(userId: string): ComplianceAlert[] {
    const plots = plotDb.getByUser(userId);
    const alerts: ComplianceAlert[] = [];

    for (const plot of plots) {
        if (plot.status === "closed") continue; // skip closed plots

        const comp = complianceDb.getByPlot(plot.id);

        // ── 1. LEASE EXPIRY ────────────────────────────────────────
        if (plot.leaseEndDate) {
            const days = daysUntil(plot.leaseEndDate);
            if (days < 0) {
                alerts.push({
                    id: alertId(), plotId: plot.id,
                    plotNumber: plot.plotNumber, company: plot.company,
                    severity: "critical", category: "lease_expiry",
                    title: "Lease Expired",
                    description: `Lease for ${plot.plotNumber} expired ${Math.abs(days)} days ago (${plot.leaseEndDate}).`,
                    generatedAt: new Date().toISOString(),
                    actionRequired: "Initiate lease renewal or cancellation proceedings immediately.",
                });
            } else if (days <= 90) {
                alerts.push({
                    id: alertId(), plotId: plot.id,
                    plotNumber: plot.plotNumber, company: plot.company,
                    severity: days <= 30 ? "critical" : "warning", category: "lease_expiry",
                    title: `Lease Expiring in ${days} days`,
                    description: `Lease for ${plot.plotNumber} (${plot.company}) expires on ${plot.leaseEndDate}.`,
                    generatedAt: new Date().toISOString(),
                    actionRequired: `Send renewal notice to ${plot.allotteeName} within ${days <= 30 ? "5" : "30"} days.`,
                });
            }
        }

        if (!comp) continue; // No compliance record filed yet

        // ── 2. INVESTMENT COMMITMENT ───────────────────────────────
        const investPct = plot.investmentCommitted > 0
            ? Math.round((comp.investmentActual / plot.investmentCommitted) * 100)
            : 100;

        if (investPct < 50) {
            alerts.push({
                id: alertId(), plotId: plot.id,
                plotNumber: plot.plotNumber, company: plot.company,
                severity: investPct < 25 ? "critical" : "warning", category: "investment",
                title: `Investment Only ${investPct}% Achieved`,
                description: `${plot.company} has invested ₹${comp.investmentActual}L of the committed ₹${plot.investmentCommitted}L (${investPct}%).`,
                generatedAt: new Date().toISOString(),
                actionRequired: "Issue show-cause notice for investment shortfall per allotment order Clause 4.",
            });
        } else if (investPct < 80) {
            alerts.push({
                id: alertId(), plotId: plot.id,
                plotNumber: plot.plotNumber, company: plot.company,
                severity: "info", category: "investment",
                title: `Investment at ${investPct}% — Below Target`,
                description: `${plot.company} has achieved ${investPct}% of investment commitment. ₹${plot.investmentCommitted - comp.investmentActual}L remaining.`,
                generatedAt: new Date().toISOString(),
                actionRequired: "Schedule compliance meeting with allottee to review investment timeline.",
            });
        }

        // ── 3. EMPLOYMENT COMMITMENT ───────────────────────────────
        const empPct = plot.employmentCommitted > 0
            ? Math.round((comp.employmentActual / plot.employmentCommitted) * 100)
            : 100;

        if (empPct < 60) {
            alerts.push({
                id: alertId(), plotId: plot.id,
                plotNumber: plot.plotNumber, company: plot.company,
                severity: empPct < 30 ? "critical" : "warning", category: "employment",
                title: `Employment Only ${empPct}% of Target`,
                description: `${plot.company} has created ${comp.employmentActual} of the committed ${plot.employmentCommitted} jobs.`,
                generatedAt: new Date().toISOString(),
                actionRequired: "Request employment certificate and verify on-site headcount within 30 days.",
            });
        }

        // ── 4. CAUTION DEPOSIT ─────────────────────────────────────
        if (comp.cautionStatus === "refund_due") {
            const daysPending = comp.cautionRefundDueDate
                ? daysAgo(comp.cautionRefundDueDate)
                : 0;
            alerts.push({
                id: alertId(), plotId: plot.id,
                plotNumber: plot.plotNumber, company: plot.company,
                severity: daysPending > 30 ? "critical" : "warning", category: "caution_deposit",
                title: "Caution Deposit Refund Overdue",
                description: `Caution deposit refund of ₹${plot.cautionDeposit}L for ${plot.company} is due${daysPending > 0 ? ` — ${daysPending} days overdue` : ""}.`,
                generatedAt: new Date().toISOString(),
                actionRequired: "Process refund via treasury — delay attracts interest liability under Section 12.",
            });
        }

        // ── 5. LAND COST SUBSIDY ───────────────────────────────────
        if (comp.subsidyStatus === "not_applied" && investPct >= 80) {
            alerts.push({
                id: alertId(), plotId: plot.id,
                plotNumber: plot.plotNumber, company: plot.company,
                severity: "info", category: "subsidy",
                title: "Subsidy Not Applied — Eligible",
                description: `${plot.company} has achieved ${investPct}% investment but hasn't applied for land cost subsidy (₹${plot.landCostSubsidy}L eligible).`,
                generatedAt: new Date().toISOString(),
                actionRequired: "Prompt allottee to file subsidy application with Form G2 and investment proof.",
            });
        }
        if (comp.subsidyStatus === "applied" && comp.subsidyAppliedOn) {
            const daysWaiting = daysAgo(comp.subsidyAppliedOn);
            if (daysWaiting > 90) {
                alerts.push({
                    id: alertId(), plotId: plot.id,
                    plotNumber: plot.plotNumber, company: plot.company,
                    severity: "warning", category: "subsidy",
                    title: `Subsidy Application Pending ${daysWaiting} Days`,
                    description: `Subsidy of ₹${plot.landCostSubsidy}L for ${plot.company} applied ${daysWaiting} days ago, still pending approval.`,
                    generatedAt: new Date().toISOString(),
                    actionRequired: "Follow up with DIC/SIPCOT HQ for expedited clearance.",
                });
            }
        }

        // ── 6. PRODUCTION NOT STARTED ──────────────────────────────
        if (!comp.productionStarted && comp.constructionCompleted) {
            alerts.push({
                id: alertId(), plotId: plot.id,
                plotNumber: plot.plotNumber, company: plot.company,
                severity: "warning", category: "production",
                title: "Construction Done but Production Not Started",
                description: `${plot.company} (${plot.plotNumber}) has completed construction but production has not commenced.`,
                generatedAt: new Date().toISOString(),
                actionRequired: "Inspect site and issue commencement notice. Verify machinery installation.",
            });
        }
        if (!comp.constructionStarted) {
            alerts.push({
                id: alertId(), plotId: plot.id,
                plotNumber: plot.plotNumber, company: plot.company,
                severity: "critical", category: "construction",
                title: "Construction Not Yet Started",
                description: `${plot.company} has not commenced construction on plot ${plot.plotNumber}.`,
                generatedAt: new Date().toISOString(),
                actionRequired: "Issue notice to allottee — failure to construct within stipulated time may result in plot cancellation.",
            });
        }

        // ── 7. EXPIRING DOCUMENTS ──────────────────────────────────
        const docs = documentDb.getByPlot(plot.id);
        for (const doc of docs) {
            if (!doc.expiryDate) continue;
            const days = daysUntil(doc.expiryDate);
            if (days < 0) {
                alerts.push({
                    id: alertId(), plotId: plot.id,
                    plotNumber: plot.plotNumber, company: plot.company,
                    severity: "critical", category: "document",
                    title: `Document Expired: ${doc.title}`,
                    description: `"${doc.title}" for ${plot.company} expired ${Math.abs(days)} days ago.`,
                    generatedAt: new Date().toISOString(),
                    actionRequired: "Obtain renewed document immediately — expired docs constitute a compliance breach.",
                });
            } else if (days <= 30) {
                alerts.push({
                    id: alertId(), plotId: plot.id,
                    plotNumber: plot.plotNumber, company: plot.company,
                    severity: "warning", category: "document",
                    title: `Document Expiring in ${days} Days: ${doc.title}`,
                    description: `"${doc.title}" for ${plot.company} expires on ${doc.expiryDate}.`,
                    generatedAt: new Date().toISOString(),
                    actionRequired: "Notify allottee to renew document before expiry.",
                });
            }
        }
    }

    // Sort: critical first, then warning, then info
    const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

// Severity styling helpers
export const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string; label: string }> = {
    critical: { color: "#FF3B30", bg: "rgba(255,59,48,0.1)", label: "Critical" },
    warning: { color: "#FF9F0A", bg: "rgba(255,159,10,0.1)", label: "Warning" },
    info: { color: "#007AFF", bg: "rgba(0,122,255,0.1)", label: "Info" },
};

export const CATEGORY_LABEL: Record<AlertCategory, string> = {
    investment: "Investment",
    employment: "Employment",
    lease_expiry: "Lease",
    caution_deposit: "Caution Deposit",
    subsidy: "Subsidy",
    production: "Production",
    document: "Document",
    construction: "Construction",
};
