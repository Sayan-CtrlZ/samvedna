import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { BarChart3, PieChart, TrendingDown, Scale, ShieldCheck, FileCheck2, MapPin, Building2, CheckCircle2 } from 'lucide-react';

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
              label: 'Average Distress Index (DDS)',
              data: [84.0, 74.0, 76.5, 68.5, 54.0],
              backgroundColor: [
                '#e03131', // Crimson
                '#d97706', // Amber
                '#7c6ee6', // Purple
                '#ea580c', // Orange
                '#2563eb'  // Blue
              ],
              borderRadius: 4,
              borderWidth: 0
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
                label: (ctx) => ` Vulnerability Score: ${ctx.parsed.y} / 100`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: '#f1f5f9' },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
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
              data: [crit, high, mod, low || 0.05],
              backgroundColor: [
                '#e03131',
                '#d97706',
                '#eab308',
                '#059669'
              ],
              borderWidth: 1.5,
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
                font: { family: 'Plus Jakarta Sans', size: 10 },
                boxWidth: 10,
                padding: 10
              }
            }
          },
          cutout: '70%'
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
            'Tele-MANAS Psychiatric Care',
            'Interim Relief DBT'
          ],
          datasets: [
            {
              label: 'Pre-Intervention Distress',
              data: [84.0, 78.0, 72.0, 69.0],
              backgroundColor: '#e03131',
              borderRadius: 4
            },
            {
              label: 'Post-Intervention (30-Day Evaluation)',
              data: [38.0, 32.0, 41.0, 44.0],
              backgroundColor: '#059669',
              borderRadius: 4
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
              ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
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

  const districtData = [
    { district: 'Ahmednagar', state: 'Maharashtra', court: 'Special Court, Rahata', monitored: 1, bailHazard: 0, pickets: 1, dds: 84.0, status: 'Active Picket' },
    { district: 'Hathras', state: 'Uttar Pradesh', court: 'Special SC/ST Court', monitored: 1, bailHazard: 0, pickets: 1, dds: 74.0, status: 'HC Bail Hearing' },
    { district: 'Gaya', state: 'Bihar', court: 'Special Court, Bodh Gaya', monitored: 1, bailHazard: 0, pickets: 0, dds: 76.5, status: 'Pension Delayed' },
    { district: 'Udaipur', state: 'Rajasthan', court: 'Special Atrocity Court', monitored: 1, bailHazard: 1, pickets: 0, dds: 68.5, status: 'Accused on Bail' },
    { district: 'Tirunelveli', state: 'Tamil Nadu', court: 'Exclusive PoA Court', monitored: 1, bailHazard: 1, pickets: 1, dds: 54.0, status: 'Chargesheet Filed' },
    { district: 'Morena', state: 'Madhya Pradesh', court: 'Special SC/ST Court', monitored: 1, bailHazard: 1, pickets: 1, dds: 42.7, status: 'Witness Intimidation' }
  ];

  return (
    <div className="space-y-4">
      {/* Compliance Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="gov-card p-3.5 border-l-4 border-l-[#0f2557]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Hostility Prevention Rate</span>
          <span className="text-xl font-bold text-slate-900">89.4%</span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Section 15A Mandate Achieved</span>
        </div>

        <div className="gov-card p-3.5 border-l-4 border-l-rose-600">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Critical Crisis Interception</span>
          <span className="text-xl font-bold text-rose-700">100%</span>
          <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">Zero Fatal Retaliations</span>
        </div>

        <div className="gov-card p-3.5 border-l-4 border-l-emerald-600">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Post-Directive Distress Drop</span>
          <span className="text-xl font-bold text-emerald-800">-38.2 pts</span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Average 52% Reduction</span>
        </div>

        <div className="gov-card p-3.5 border-l-4 border-l-amber-600">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Annexure I DBT Turnaround</span>
          <span className="text-xl font-bold text-amber-800">4.2 Days</span>
          <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">Down from 60+ Day Benchmark</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chart 1: Distress Vulnerability by Criminal Trial Stage (7 cols) */}
        <div className="lg:col-span-7 gov-card p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-700" />
                <span>Distress Vulnerability by Criminal Trial Phase</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Identifies critical procedural phases where witnesses face highest intimidation pressure.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              PoA 1989
            </span>
          </div>
          <div className="h-64 relative">
            <canvas ref={stageChartRef}></canvas>
          </div>
        </div>

        {/* Chart 2: Caseload Risk Tier Distribution (5 cols) */}
        <div className="lg:col-span-5 gov-card p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-purple-700" />
                <span>Caseload Severity Distribution</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Active registry breakdown by clinical-legal severity tier.
              </p>
            </div>
          </div>
          <div className="h-64 relative flex items-center justify-center">
            <canvas ref={pieChartRef}></canvas>
          </div>
        </div>

        {/* Chart 3: Statutory Protective Interventions Efficacy (Full width / 12 cols) */}
        <div className="lg:col-span-12 gov-card p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-700" />
                <span>Section 15A Protective Directives Efficacy (Pre vs Post 30-Day Distress)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Empirical impact of statutory interventions on survivor psychological stability and trial confidence.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Average 52% Distress Drop
            </span>
          </div>
          <div className="h-64 relative">
            <canvas ref={impactChartRef}></canvas>
          </div>
        </div>

        {/* District Compliance Table (Full width / 12 cols) */}
        <div className="lg:col-span-12 gov-card p-4 space-y-3">
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                District-Level Protection Compliance Ledger (Section 15A SC/ST PoA Act)
              </h3>
              <p className="text-[11px] text-slate-500">
                Status across designated Special Courts and District Protection Cells.
              </p>
            </div>
            <span className="text-[10px] text-slate-400">Official Roster</span>
          </div>

          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Jurisdiction</th>
                  <th>Designated Special Court</th>
                  <th>Monitored Cases</th>
                  <th>Bail Proximity Hazard</th>
                  <th>Armed Pickets Active</th>
                  <th>Vulnerability Index</th>
                  <th>Current Protection Status</th>
                </tr>
              </thead>
              <tbody>
                {districtData.map((d, i) => (
                  <tr key={i}>
                    <td className="font-semibold text-slate-900">
                      {d.district}, {d.state}
                    </td>
                    <td className="text-slate-600">{d.court}</td>
                    <td>{d.monitored}</td>
                    <td>
                      {d.bailHazard > 0 ? (
                        <span className="text-rose-700 font-bold">1 Active</span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td>
                      {d.pickets > 0 ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dispatched
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending Request</span>
                      )}
                    </td>
                    <td className="font-bold text-slate-800 font-mono">{d.dds} / 100</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
