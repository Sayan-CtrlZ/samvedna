import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { BarChart3, PieChart, TrendingDown, Scale, ShieldCheck, FileCheck2, MapPin } from 'lucide-react';

export default function AnalyticsView({ metrics, cases = [] }) {
  const stageChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const impactChartRef = useRef(null);

  const stageChartInstance = useRef(null);
  const pieChartInstance = useRef(null);
  const impactChartInstance = useRef(null);

  useEffect(() => {
    // 1. Legal Stage Vulnerability Bar Chart
    if (stageChartRef.current) {
      if (stageChartInstance.current) stageChartInstance.current.destroy();

      const ctx = stageChartRef.current.getContext('2d');
      stageChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [
            'Witness Deposition',
            'Bail Hearing',
            'Compensation Pending',
            'Investigation Stage',
            'Chargesheet Filed'
          ],
          datasets: [
            {
              label: 'Average Distress Score (DDS)',
              data: [84.0, 74.0, 76.5, 68.5, 54.0],
              backgroundColor: [
                'rgba(225, 29, 72, 0.85)',   // Crimson Red
                'rgba(245, 158, 11, 0.85)',  // Amber
                'rgba(168, 85, 247, 0.85)',  // Purple
                'rgba(249, 115, 22, 0.85)',  // Orange
                'rgba(59, 130, 246, 0.85)'   // Blue
              ],
              borderColor: [
                '#be123c',
                '#d97706',
                '#9333ea',
                '#c2410c',
                '#2563eb'
              ],
              borderWidth: 1.5,
              borderRadius: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Distress Index: ${ctx.parsed.y}/100`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: '#f1f5f9' },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
            }
          }
        }
      });
    }

    // 2. Risk Level Distribution Doughnut Chart
    if (pieChartRef.current) {
      if (pieChartInstance.current) pieChartInstance.current.destroy();

      const ctx = pieChartRef.current.getContext('2d');
      const crit = metrics?.critical_cases ?? 2;
      const high = metrics?.high_risk_cases ?? 3;
      const mod = metrics?.moderate_risk_cases ?? 1;
      const low = metrics?.stable_cases ?? 0;

      pieChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Critical (DDS ≥ 80)', 'High Risk (DDS 65-79)', 'Moderate (DDS 45-64)', 'Stable (DDS < 45)'],
          datasets: [
            {
              data: [crit, high, mod, low || 0.1],
              backgroundColor: [
                '#e11d48', // Red
                '#f59e0b', // Amber
                '#eab308', // Yellow
                '#10b981'  // Emerald
              ],
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: 'Plus Jakarta Sans', size: 11 },
                boxWidth: 12,
                padding: 12
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // 3. Statutory Intervention Efficacy (Pre vs Post 30-Day Impact)
    if (impactChartRef.current) {
      if (impactChartInstance.current) impactChartInstance.current.destroy();

      const ctx = impactChartRef.current.getContext('2d');
      impactChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [
            'Armed Police Picket',
            'Safe House Relocation',
            'Tele-MANAS Care',
            'Interim Relief DBT'
          ],
          datasets: [
            {
              label: 'Pre-Intervention Distress',
              data: [84.0, 78.0, 72.0, 69.0],
              backgroundColor: 'rgba(239, 68, 68, 0.75)',
              borderColor: '#dc2626',
              borderWidth: 1,
              borderRadius: 6
            },
            {
              label: 'Post-Intervention (30-Day Followup)',
              data: [38.0, 32.0, 41.0, 44.0],
              backgroundColor: 'rgba(16, 185, 129, 0.75)',
              borderColor: '#059669',
              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { font: { family: 'Plus Jakarta Sans', size: 11 } }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: '#f1f5f9' },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
            }
          }
        }
      });
    }

    return () => {
      if (stageChartInstance.current) stageChartInstance.current.destroy();
      if (pieChartInstance.current) pieChartInstance.current.destroy();
      if (impactChartInstance.current) impactChartInstance.current.destroy();
    };
  }, [metrics, cases]);

  return (
    <div className="space-y-6">
      {/* Overview Analytics Header Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="mat-card p-4 flex items-center justify-between border-l-4 border-l-indigo-600">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Trial Hostility Avoided</span>
            <span className="text-2xl font-black text-indigo-900">89.4%</span>
            <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">↑ +24% vs Historical Avg</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="mat-card p-4 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Acute Crisis Prevention</span>
            <span className="text-2xl font-black text-rose-600">100%</span>
            <span className="text-[11px] text-rose-600 font-bold block mt-0.5">0 Fatal Escalations</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="mat-card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Avg Distress Drop</span>
            <span className="text-2xl font-black text-emerald-700">-38.2 pts</span>
            <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">Post Statutory Directives</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="mat-card p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Annexure I DBT Speed</span>
            <span className="text-2xl font-black text-amber-700">4.2 Days</span>
            <span className="text-[11px] text-amber-600 font-bold block mt-0.5">Reduced from 60+ Days</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Distress Vulnerability by Legal Stage (7 cols) */}
        <div className="lg:col-span-7 mat-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Distress Vulnerability by Criminal Trial Stage</span>
              </h3>
              <p className="text-xs text-slate-500">
                Identifies critical procedural phases where witnesses face highest coercive pressure.
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              SC/ST PoA Act
            </span>
          </div>
          <div className="h-72 relative">
            <canvas ref={stageChartRef}></canvas>
          </div>
        </div>

        {/* Chart 2: Priority Risk Tier Distribution (5 cols) */}
        <div className="lg:col-span-5 mat-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-600" />
                <span>Caseload Risk Tier Distribution</span>
              </h3>
              <p className="text-xs text-slate-500">
                Breakdown of all active monitored cases by severity threshold.
              </p>
            </div>
          </div>
          <div className="h-72 relative flex items-center justify-center">
            <canvas ref={pieChartRef}></canvas>
          </div>
        </div>

        {/* Chart 3: Statutory Intervention Efficacy (Full width / 12 cols) */}
        <div className="lg:col-span-12 mat-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <span>Section 15A Protection Directives Efficacy (Pre vs Post 30-Day Distress)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Empirical impact of statutory interventions on survivor psychological stability and trial confidence.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Average 52% Distress Reduction
            </span>
          </div>
          <div className="h-72 relative">
            <canvas ref={impactChartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
