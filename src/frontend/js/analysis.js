/**
 * File: analysis.js
 * Project: Cloud Cost Intelligence Platform
 * Author: Michael Allen (Project Manager)
 * Created: February 2026
 * Description: Cost analysis engine. Computes waste alerts and optimization
 *              recommendations from usage, service, and budget data using
 *              rule-based thresholds and template maps. No AI/LLM required.
 *
 * FR-04: Cost anomaly detection / waste alerts
 * FR-05: Optimization recommendations with plus/minus analysis
 *
 * Dependencies (loaded via <script> tags before this file):
 *   utils.js - formatCurrency() used in buildRec() for template token replacement
 */

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMENDATION TEMPLATE MAP
// Each service_type + action has pre-written plus/minus text.
// The engine fills in dollar amounts at render time.
// ═══════════════════════════════════════════════════════════════════════════

const RECOMMENDATION_TEMPLATES = {
    'Object Storage': {
        lifecycle: {
            phase: 1,
            action: 'Storage lifecycle + Intelligent-Tiering',
            savingsRate: 0.50,
            effort: { hours: 0.5, cost: 0, downtime: 'None' },
            plus: [
                '{savings}/mo ongoing savings',
                'Auto-tiers cold data to cheaper storage',
                'No application changes required',
            ],
            minus: [
                '30 min to configure via console or CLI',
                'No downtime',
                'Fully reversible',
            ],
            risk: null,
        },
        rightsize: {
            phase: 2,
            action: 'Analyze usage patterns, reduce allocation',
            savingsRate: 0.25,
            effort: { hours: 5, cost: 400, downtime: '15 min' },
            plus: [
                '{savings}/mo ongoing savings',
                'Eliminate over-provisioned capacity',
                'Better visibility into actual usage',
            ],
            minus: [
                '4-6 hrs analysis (CloudWatch metrics, access patterns)',
                '~$400 labor cost',
                'Brief maintenance window for policy changes',
                'If usage spikes after downsizing, need to re-provision',
            ],
            risk: 'Set usage alarms before reducing capacity',
        },
        multicloud: {
            phase: 3,
            action: 'Evaluate multi-cloud distribution',
            savingsRate: 0.05,
            effort: { hours: 25, cost: 3000, downtime: 'Hours' },
            plus: [
                '{savings}/mo rate savings (minimal)',
                'Provider diversification',
                'Reduced single-provider dependency',
                'Redundancy for disaster recovery',
            ],
            minus: [
                '20-30 hrs engineering effort',
                '~$3,000 labor cost',
                'Data transfer out fees (~$0.09/GB)',
                'Application code changes (SDK, auth, endpoints)',
                'Dual-write period overhead during migration',
                'Testing and validation across providers',
            ],
            risk: 'Data loss risk during migration — run parallel, verify checksums',
        },
    },
    'File Storage': {
        lifecycle: {
            phase: 1,
            action: 'Enable Infrequent Access tier',
            savingsRate: 0.50,
            effort: { hours: 0.5, cost: 0, downtime: 'None' },
            plus: [
                '{savings}/mo ongoing savings',
                'Automatic file tiering based on access patterns',
                'No application changes required',
            ],
            minus: [
                '30 min to configure',
                'Slightly higher per-access cost for infrequent files (negligible at current volume)',
                'Fully reversible',
            ],
            risk: null,
        },
        rightsize: {
            phase: 2,
            action: 'Audit mounts, remove stale, reduce capacity',
            savingsRate: 0.25,
            effort: { hours: 5, cost: 400, downtime: '15 min' },
            plus: [
                '{savings}/mo ongoing savings',
                'Cleaner infrastructure, reduced attack surface',
            ],
            minus: [
                '4-6 hrs audit and testing',
                '~$400 labor cost',
                'Brief maintenance window',
                'Removing a mount that an application still references causes downtime',
                'Data loss possible if mount removed without backup',
            ],
            risk: 'Snapshot all mounts before any removal',
        },
    },
    'Compute': {
        reserved: {
            phase: 1,
            action: 'Reserved/committed pricing (1yr)',
            savingsRate: 0.30,
            effort: { hours: 0.25, cost: 0, downtime: 'None' },
            plus: [
                '{savings}/mo savings (30% discount)',
                'Same instances, same performance, lower rate',
                'No migration or architecture change',
            ],
            minus: [
                '15 min to purchase via console',
                '1-year commitment — locked in even if usage drops',
                'Not reversible until term ends',
            ],
            risk: 'Commitment risk: locked for 12 months',
        },
        rightsize: {
            phase: 2,
            action: 'Right-size instances',
            savingsRate: 0.25,
            effort: { hours: 1.5, cost: 100, downtime: '5-10 min' },
            plus: [
                '{savings}/mo savings',
                'Better cost-to-performance ratio',
                'Reversible — can scale back up',
            ],
            minus: [
                '1-2 hrs analysis and testing',
                '~$100 labor cost',
                'Brief downtime during instance resize (minutes)',
                'Undersizing causes performance degradation — monitor after',
            ],
            risk: null,
        },
        multicloud: {
            phase: 3,
            action: 'Multi-cloud distribution',
            savingsRate: 0.05,
            effort: { hours: 10, cost: 1000, downtime: 'Hours' },
            plus: [
                '{savings}/mo (minimal)',
                'Provider diversification',
                'Failover capability',
            ],
            minus: [
                '8-12 hrs engineering effort',
                '~$1,000 labor cost',
                'New provider accounts, IAM, networking',
                'Application refactoring',
                'Ongoing dual-platform operational complexity',
                'Staff training on new provider',
            ],
            risk: 'Value is resilience, not savings — rates may be identical across providers',
        },
    },
    'Databases': {
        ondemand: {
            phase: 1,
            action: 'Switch to on-demand capacity',
            savingsRate: 0.20,
            effort: { hours: 0.25, cost: 0, downtime: 'None' },
            plus: [
                '{savings}/mo savings',
                'Pay only for actual requests',
                'Auto-scales with demand',
            ],
            minus: [
                '15 min config change per service',
                'Cost could spike if usage surges unexpectedly',
                'Reversible',
            ],
            risk: null,
        },
        rightsize: {
            phase: 2,
            action: 'Evaluate instance tier',
            savingsRate: 0.25,
            effort: { hours: 2, cost: 200, downtime: '10 min' },
            plus: [
                '{savings}/mo savings',
                'Right-sized database tier',
            ],
            minus: [
                '2-3 hrs analysis',
                '~$200 labor cost',
                '5-15 min downtime per database during tier change',
                'Undersized DB causes slow queries — test in staging first',
            ],
            risk: null,
        },
        multicloud: {
            phase: 3,
            action: 'Multi-cloud distribution',
            savingsRate: 0.05,
            effort: { hours: 10, cost: 1000, downtime: 'Hours' },
            plus: [
                '{savings}/mo (minimal)',
                'Provider diversification',
            ],
            minus: [
                '8-12 hrs engineering effort',
                '~$1,000 labor cost',
                'Schema migration and compatibility testing',
                'Ongoing operational complexity',
            ],
            risk: 'Database migration carries highest data integrity risk',
        },
    },
    'Containers': {
        rightsize: {
            phase: 2,
            action: 'Right-size container resources',
            savingsRate: 0.25,
            effort: { hours: 2, cost: 150, downtime: '5 min' },
            plus: [
                '{savings}/mo savings',
                'Optimized resource allocation',
            ],
            minus: [
                '2 hrs analysis of container metrics',
                '~$150 labor cost',
                'Brief rolling restart during resize',
            ],
            risk: null,
        },
    },
    'Managed Services': {
        rightsize: {
            phase: 2,
            action: 'Review managed service tier',
            savingsRate: 0.20,
            effort: { hours: 1, cost: 75, downtime: 'None' },
            plus: [
                '{savings}/mo savings',
                'Aligned tier to actual workload',
            ],
            minus: [
                '1 hr review',
                '~$75 labor cost',
                'May lose features at lower tier',
            ],
            risk: null,
        },
    },
};

// Default template for service types not explicitly mapped
const DEFAULT_TEMPLATE = {
    rightsize: {
        phase: 2,
        action: 'Review and right-size resources',
        savingsRate: 0.20,
        effort: { hours: 2, cost: 150, downtime: '10 min' },
        plus: [
            '{savings}/mo savings',
            'Optimized resource allocation',
        ],
        minus: [
            '1-2 hrs analysis',
            '~$150 labor cost',
            'Brief maintenance window possible',
        ],
        risk: null,
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// PHASE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const PHASE_DEFS = {
    1: { label: 'Config Changes', tag: 'Now', tagClass: 'now', description: 'No downtime, minimal effort' },
    2: { label: 'Right-Sizing', tag: '30 Days', tagClass: 'soon', description: 'Analysis required, brief maintenance windows' },
    3: { label: 'Multi-Cloud Evaluation', tag: '90 Days', tagClass: 'later', description: 'Architecture changes, migration required' },
};

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute waste alerts for a client's services.
 *
 * @param {Array} usages   - filtered usage records for one client
 * @param {Array} services - all services
 * @param {Array} providers - all providers
 * @param {Object|null} budget  - budget record for this client (from /api/v1/budgets)
 * @returns {Object} { alerts[], summary{} }
 */
function computeWasteAlerts(usages, services, providers, budget) {
    const providerMap = {};
    providers.forEach(p => { providerMap[p.provider_id] = p.provider_name; });

    const serviceMap = {};
    services.forEach(s => { serviceMap[s.service_id] = s; });

    // Budget-driven thresholds (or sensible defaults)
    const budgetAmount = budget ? parseFloat(budget.budget_amount) || 1000 : 1000;
    const monthlyLimit = budget ? parseFloat(budget.monthly_limit) || budgetAmount * 1.1 : budgetAmount * 1.1;
    const alertThreshold = budget ? parseFloat(budget.alert_threshold) || budgetAmount * 0.9 : budgetAmount * 0.9;

    // Group usages by service
    const byService = {};
    usages.forEach(u => {
        const sid = u.service_id;
        if (!byService[sid]) {
            byService[sid] = { units: 0, cost: 0, days: new Set(), records: [] };
        }
        byService[sid].units += u.units_used;
        byService[sid].cost += u.total_cost;
        byService[sid].days.add(u.usage_date);
        byService[sid].records.push(u);
    });

    // Cross-provider rate map
    const typeRates = {};
    services.forEach(svc => {
        const pName = providerMap[svc.provider_id] || 'Unknown';
        const sType = svc.service_type || 'Unknown';
        if (!typeRates[sType]) typeRates[sType] = {};
        typeRates[sType][pName] = {
            name: svc.service_name,
            rate: parseFloat(svc.service_cost) || 0,
            unit: svc.service_unit,
        };
    });

    // Pre-compute peak daily usage per service for dynamic capacity baselines
    const peakUsageByService = {};
    Object.entries(byService).forEach(([sid, data]) => {
        const dailyUnits = {};
        data.records.forEach(r => {
            dailyUnits[r.usage_date] = (dailyUnits[r.usage_date] || 0) + r.units_used;
        });
        peakUsageByService[sid] = Math.max(...Object.values(dailyUnits), 0);
    });

    // Compute per-service metrics
    const alerts = [];
    let totalMonthlyCost = 0;
    const providerCosts = {};

    Object.entries(byService).forEach(([sid, data]) => {
        const svc = serviceMap[parseInt(sid)];
        if (!svc) return;

        const dayCount = data.days.size || 1;
        const dailyCost = data.cost / dayCount;
        const monthlyCost = dailyCost * 30;
        totalMonthlyCost += monthlyCost;

        const pName = providerMap[svc.provider_id] || 'Unknown';
        providerCosts[pName] = (providerCosts[pName] || 0) + monthlyCost;

        // Utilization: derived from peak usage + 20% headroom (industry standard)
        const peakDaily = peakUsageByService[sid] || 0;
        const utilizationBase = peakDaily > 0 ? peakDaily * 1.2 : getCapacityBaseline(svc.service_type, svc.service_unit);
        const avgDailyUnits = data.units / dayCount;
        const utilization = utilizationBase > 0 ? Math.min(avgDailyUnits / utilizationBase, 1.0) : 0.5;

        // Severity badges (visual indicator, still tiered)
        let severity = 'info';
        if (utilization < 0.20 && monthlyCost > 30) {
            severity = 'critical';
        } else if (utilization < 0.50 && monthlyCost > 20) {
            severity = 'warning';
        }

        // Savings rate on a gradient — no cliffs
        // 0% util → 50% recoverable, 50% util → 5%, 75%+ → 0%
        let savingsRate = 0;
        if (utilization < 0.50) {
            savingsRate = 0.50 - (utilization / 0.50) * 0.45;
        } else if (utilization < 0.75) {
            savingsRate = 0.05 - ((utilization - 0.50) / 0.25) * 0.05;
        }

        // Noise filter: don't flag low-cost services
        if (monthlyCost < 20) savingsRate = 0;

        const potentialSavings = monthlyCost * savingsRate;

        // 30-day trend: compare last 15 vs prior 15
        const sortedDates = [...data.days].sort();
        const mid = Math.floor(sortedDates.length / 2);
        const recentDates = sortedDates.slice(mid);
        const priorDates = sortedDates.slice(0, mid);
        const recentAvg = computeDailyAvg(data.records, recentDates);
        const priorAvg = computeDailyAvg(data.records, priorDates);
        const trend = priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0;

        // Cross-provider alternatives
        const altProviders = typeRates[svc.service_type] || {};
        const hasAlternative = Object.keys(altProviders).length > 1;
        const isLocked = Object.keys(altProviders).length <= 1;

        alerts.push({
            service_id: svc.service_id,
            service_name: svc.service_name,
            service_type: svc.service_type,
            provider_name: pName,
            provider_id: svc.provider_id,
            utilization,
            daily_cost: dailyCost,
            monthly_cost: monthlyCost,
            potential_savings: potentialSavings,
            severity,
            trend,
            has_alternative: hasAlternative,
            is_locked: isLocked,
        });
    });

    // Sort: critical first, then by savings desc
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => {
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return b.potential_savings - a.potential_savings;
    });

    // Summary
    const totalSavings = alerts.reduce((s, a) => s + a.potential_savings, 0);
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;

    // Provider concentration
    const providerCount = Object.keys(providerCosts).length;
    const topProvider = Object.entries(providerCosts).sort((a, b) => b[1] - a[1])[0];
    const topProviderPct = topProvider ? (topProvider[1] / totalMonthlyCost) * 100 : 0;

    // Spend by category
    const categorySpend = {};
    alerts.forEach(a => {
        categorySpend[a.service_type] = (categorySpend[a.service_type] || 0) + a.monthly_cost;
    });

    return {
        alerts,
        summary: {
            totalMonthlyCost,
            totalSavings,
            criticalCount,
            warningCount,
            budgetAmount,
            monthlyLimit,
            alertThreshold,
            overBudget: totalMonthlyCost > budgetAmount,
            overBudgetAmount: Math.max(0, totalMonthlyCost - budgetAmount),
            providerCosts,
            providerCount,
            topProvider: topProvider ? topProvider[0] : 'N/A',
            topProviderPct,
            categorySpend,
        },
    };
}

/**
 * Compute optimization recommendations grouped by phase with plus/minus.
 *
 * @param {Array} alerts - from computeWasteAlerts()
 * @param {Array} services - all services
 * @param {Object} summary - summary from computeWasteAlerts()
 * @returns {Object} { phases: { 1: {..., items:[]}, 2: {...}, 3: {...} }, totals }
 */
function computeRecommendations(alerts, services, summary) {
    const recs = [];

    // Cross-provider rate map for detecting alternatives
    const serviceMap = {};
    services.forEach(s => { serviceMap[s.service_id] = s; });

    const typeHasMultipleProviders = {};
    services.forEach(s => {
        const t = s.service_type;
        if (!typeHasMultipleProviders[t]) typeHasMultipleProviders[t] = new Set();
        typeHasMultipleProviders[t].add(s.provider_id);
    });

    alerts.forEach(alert => {
        const templates = RECOMMENDATION_TEMPLATES[alert.service_type] || DEFAULT_TEMPLATE;
        const monthlyCost = alert.monthly_cost;

        // Phase 1: Config changes (lifecycle, reserved, on-demand)
        if (templates.lifecycle && monthlyCost > 30) {
            const t = templates.lifecycle;
            const savings = Math.round(monthlyCost * t.savingsRate);
            if (savings > 0) {
                recs.push(buildRec(alert, t, savings));
            }
        }
        if (templates.reserved && monthlyCost > 15) {
            const t = templates.reserved;
            const savings = Math.round(monthlyCost * t.savingsRate);
            if (savings > 0) {
                recs.push(buildRec(alert, t, savings));
            }
        }
        if (templates.ondemand && monthlyCost > 10) {
            const t = templates.ondemand;
            const savings = Math.round(monthlyCost * t.savingsRate);
            if (savings > 0) {
                recs.push(buildRec(alert, t, savings));
            }
        }

        // Phase 2: Right-sizing (if utilization is below 50%)
        if (templates.rightsize && monthlyCost > 15 && alert.utilization < 0.50) {
            const t = templates.rightsize;
            const savings = Math.round(monthlyCost * t.savingsRate);
            if (savings > 0) {
                recs.push(buildRec(alert, t, savings));
            }
        }

        // Phase 3: Multi-cloud (if alternatives exist and cost justifies evaluation)
        const hasMulti = typeHasMultipleProviders[alert.service_type]?.size > 1;
        if (templates.multicloud && hasMulti && monthlyCost > 30) {
            const t = templates.multicloud;
            const savings = Math.round(monthlyCost * t.savingsRate);
            if (savings > 0) {
                recs.push(buildRec(alert, t, savings));
            }
        }
    });

    // Group by phase
    const phases = { 1: [], 2: [], 3: [] };
    recs.forEach(r => {
        phases[r.phase].push(r);
    });

    // Sort within each phase by savings desc
    Object.values(phases).forEach(arr => arr.sort((a, b) => b.savings - a.savings));

    // Compute phase totals
    const phaseTotals = {};
    let runningSpend = summary.totalMonthlyCost;
    const budgetTarget = summary.budgetAmount;

    [1, 2, 3].forEach(p => {
        // Skip Phase 3 if Phases 1+2 already brought spend under budget
        // The goal is solving the 30-40% overspend problem, not squeezing every dollar
        if (p === 3 && runningSpend <= budgetTarget) {
            phaseTotals[p] = {
                ...PHASE_DEFS[p],
                savings: 0, upfront: 0, hours: 0,
                downtime: 'None', payback: 'N/A',
                budgetAmount: budgetTarget,
                spendBefore: Math.round(runningSpend),
                spendAfter: Math.round(runningSpend),
                items: [],
                skipped: true,
                skipReason: 'Already under budget after Phases 1 & 2',
            };
            return;
        }

        const items = phases[p];
        const totalSavings = items.reduce((s, r) => s + r.savings, 0);
        const totalUpfront = items.reduce((s, r) => s + r.effort.cost, 0);
        const totalHours = items.reduce((s, r) => s + r.effort.hours, 0);

        // Max downtime across items in this phase
        const downtimes = items.map(r => r.effort.downtime).filter(d => d !== 'None');
        const maxDowntime = downtimes.length > 0 ? downtimes[downtimes.length - 1] : 'None';

        // Payback period
        let payback = 'Immediate';
        if (totalUpfront > 0 && totalSavings > 0) {
            const months = totalUpfront / totalSavings;
            if (months >= 12) {
                payback = Math.round(months / 12) + '+ years';
            } else {
                payback = '~' + Math.ceil(months) + ' months';
            }
        }

        const spendBefore = runningSpend;
        runningSpend -= totalSavings;
        const spendAfter = Math.max(0, runningSpend);

        phaseTotals[p] = {
            ...PHASE_DEFS[p],
            savings: totalSavings,
            upfront: totalUpfront,
            hours: totalHours,
            downtime: maxDowntime,
            payback,
            budgetAmount: budgetTarget,
            spendBefore: Math.round(spendBefore),
            spendAfter: Math.round(spendAfter),
            items,
        };
    });

    const grandTotals = {
        savings: Object.values(phaseTotals).reduce((s, p) => s + p.savings, 0),
        upfront: Object.values(phaseTotals).reduce((s, p) => s + p.upfront, 0),
        hours: Object.values(phaseTotals).reduce((s, p) => s + p.hours, 0),
    };

    // Flag if optimization can't reach budget — recommend budget increase
    const finalSpend = runningSpend;
    if (finalSpend > budgetTarget) {
        grandTotals.budgetShortfall = finalSpend - budgetTarget;
        grandTotals.recommendedBudget = Math.ceil(finalSpend / 100) * 100; // round up to nearest $100
    }

    return { phases: phaseTotals, totals: grandTotals };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Build a recommendation object from an alert + template */
function buildRec(alert, template, savings) {
    return {
        service_name: alert.service_name,
        service_type: alert.service_type,
        provider_name: alert.provider_name,
        phase: template.phase,
        action: template.action,
        savings,
        monthly_cost: alert.monthly_cost,
        effort: { ...template.effort },
        plus: template.plus.map(t => t.replace('{savings}', formatCurrency(savings))),
        minus: [...template.minus],
        risk: template.risk,
        severity: alert.severity,
    };
}

/** Get a capacity baseline per service type for utilization estimation */
function getCapacityBaseline(serviceType, serviceUnit) {
    const baselines = {
        'Compute': 100,           // 100 hrs/day = full utilization
        'Object Storage': 10000,  // 10,000 GB = full
        'File Storage': 5000,     // 5,000 GB = full
        'Databases': 24,          // 24 hrs/day = full
        'Containers': 50,         // 50 units/day
        'Managed Services': 100,
        'Serverless': 100000,     // 100k requests
    };
    return baselines[serviceType] || 100;
}

/** Compute daily cost average for a set of dates */
function computeDailyAvg(records, dates) {
    if (!dates || dates.length === 0) return 0;
    const dateSet = new Set(dates);
    const matching = records.filter(r => dateSet.has(r.usage_date));
    const total = matching.reduce((s, r) => s + r.total_cost, 0);
    return total / dates.length;
}

/**
 * Get the client's budget record from the budgets array.
 * @param {Array} budgets - all budget records
 * @param {number} clientId - target client ID
 * @returns {Object|null}
 */
function getBudgetForClient(budgets, clientId) {
    return budgets.find(b => b.client_id === parseInt(clientId)) || null;
}
