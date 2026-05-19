import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Scale, Calculator, Shield, Search, Users, TrendingUp, RefreshCcw, Award, AlertCircle } from 'lucide-react';

type Offering = {
  id: number; sku: string; name: string; vertical: string; description: string;
  billing_model: string; base_price_usd: number; unit_price_usd: number | null;
  success_fee_pct: number | null; sla_hours: number; human_review_required: boolean;
  ai_cost_per_unit_usd: number; target_gross_margin_pct: number;
  benchmark_eval: string | null; benchmark_score: number | null;
  status: string; ai_savings_pct: number | null; human_baseline_usd: number;
  estimated_margin_usd: number;
};

type VerticalAgg = {
  vertical: string; offerings_count: number; avg_price_usd: number;
  avg_ai_cost_usd: number; avg_target_margin_pct: number;
  avg_benchmark_score: number; active_count: number;
  human_baseline_usd: number | null; ai_disruption_ratio: number | null;
};

type Step = {
  step_order: number; step_name: string; step_type: string;
  model_used: string | null; expected_minutes: number;
  cost_per_run_usd: number; pass_rate_pct: number;
};

type Benchmark = {
  id: number; eval_name: string; eval_subset: string | null; model_name: string;
  score: number; metric: string; sample_size: number;
  baseline_human_score: number | null; run_date: string;
};

const VERTICAL_META: Record<string, { icon: any; color: string; label: string }> = {
  legal:      { icon: Scale,      color: 'text-blue-400',    label: 'Legal' },
  tax:        { icon: Calculator, color: 'text-emerald-400', label: 'Tax & Accounting' },
  audit:      { icon: Search,     color: 'text-amber-400',   label: 'Audit' },
  compliance: { icon: Shield,     color: 'text-purple-400',  label: 'Compliance' },
  recruiting: { icon: Users,      color: 'text-pink-400',    label: 'Recruiting' },
  consulting: { icon: TrendingUp, color: 'text-cyan-400',    label: 'Consulting' }
};

async function authFetch<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed: ${res.status}`);
  return res.json();
}

function fmtMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  const v = Number(n);
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(2)}`;
}

export default function ServiceCatalog() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [verticals, setVerticals] = useState<VerticalAgg[]>([]);
  const [activeVertical, setActiveVertical] = useState<string>('');
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ offering: Offering; workflow_steps: Step[]; benchmarks: Benchmark[]; computed: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadCatalog() {
    setLoading(true); setError('');
    try {
      const [o, v] = await Promise.all([
        authFetch<Offering[]>('/cf-service-productize/'),
        authFetch<{ verticals: VerticalAgg[] }>('/cf-service-productize/catalog/by-vertical')
      ]);
      setOfferings(o); setVerticals(v.verticals);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function loadDetail(sku: string) {
    setSelectedSku(sku);
    try {
      const d = await authFetch<any>(`/cf-service-productize/${encodeURIComponent(sku)}`);
      setDetail(d);
    } catch (e: any) { setError(e.message); setDetail(null); }
  }

  useEffect(() => { loadCatalog(); }, []);

  const filtered = useMemo(
    () => activeVertical ? offerings.filter(o => o.vertical === activeVertical) : offerings,
    [offerings, activeVertical]
  );

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-blue-400" />Service Catalog
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Productized AI-native services replacing human-delivered work in legal, tax, audit, compliance, recruiting & consulting.
              All offerings benchmarked against published evals (CUAD, LegalBench, FinanceBench, SWE-bench, TaxLLM).
            </p>
          </div>
          <button onClick={loadCatalog} disabled={loading}
            className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1">
            {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
          </button>
        </div>

        {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{error}</div>}

        {/* Vertical pills with disruption ratio */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <button onClick={() => setActiveVertical('')}
            className={`p-3 rounded-xl border text-left ${!activeVertical ? 'bg-slate-700 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
            <div className="text-xs text-slate-400">All verticals</div>
            <div className="text-lg font-bold text-white">{offerings.length}</div>
            <div className="text-xs text-slate-500">offerings</div>
          </button>
          {verticals.map(v => {
            const meta = VERTICAL_META[v.vertical] || { icon: Briefcase, color: 'text-slate-300', label: v.vertical };
            const Icon = meta.icon;
            return (
              <button key={v.vertical} onClick={() => setActiveVertical(v.vertical)}
                className={`p-3 rounded-xl border text-left ${activeVertical === v.vertical ? 'bg-slate-700 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Icon className={`w-3.5 h-3.5 ${meta.color}`} />{meta.label}
                </div>
                <div className="text-lg font-bold text-white mt-0.5">{v.offerings_count}</div>
                {v.ai_disruption_ratio && (
                  <div className="text-xs text-emerald-400 mt-0.5">{v.ai_disruption_ratio}× cheaper</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Offerings list */}
          <div className="lg:col-span-2 space-y-2">
            {filtered.map(o => {
              const meta = VERTICAL_META[o.vertical] || { icon: Briefcase, color: 'text-slate-300', label: o.vertical };
              const Icon = meta.icon;
              const price = Number(o.base_price_usd || 0) + Number(o.unit_price_usd || 0);
              const isActive = selectedSku === o.sku;
              return (
                <button key={o.id} onClick={() => loadDetail(o.sku)}
                  className={`w-full text-left p-4 rounded-xl border transition ${isActive ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                        <span className="text-xs uppercase tracking-wide text-slate-500">{o.sku}</span>
                        {o.status === 'beta' && <span className="text-[10px] px-1.5 py-0.5 bg-amber-900/50 text-amber-300 rounded">BETA</span>}
                      </div>
                      <div className="text-white font-semibold text-sm">{o.name}</div>
                      <div className="text-xs text-slate-400 mt-1 line-clamp-2">{o.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-white font-bold">{fmtMoney(price)}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{o.billing_model.replace('_', ' ')}</div>
                      {o.ai_savings_pct !== null && (
                        <div className="text-xs text-emerald-400 mt-1">−{o.ai_savings_pct}% vs human</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2.5 text-[11px]">
                    {o.benchmark_eval && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        {o.benchmark_eval}: <span className="text-amber-300 font-medium">{o.benchmark_score}%</span>
                      </span>
                    )}
                    <span className="text-slate-500">SLA: {o.sla_hours}h</span>
                    <span className="text-slate-500">AI cost: {fmtMoney(o.ai_cost_per_unit_usd)}</span>
                    {o.human_review_required && <span className="text-purple-400">HITL</span>}
                  </div>
                </button>
              );
            })}
            {!filtered.length && !loading && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-400 text-sm">
                No offerings match this filter. Seed sample data to populate the catalog.
              </div>
            )}
          </div>

          {/* Detail pane */}
          <div className="lg:col-span-1">
            {!detail && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center text-slate-400 text-sm sticky top-4">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                Select an offering to see workflow, benchmarks, and economics.
              </div>
            )}
            {detail && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sticky top-4 max-h-[85vh] overflow-y-auto">
                <div className="mb-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{detail.offering.sku}</div>
                  <div className="text-white font-bold">{detail.offering.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-slate-900/50 rounded p-2">
                    <div className="text-slate-500">Pipeline cost</div>
                    <div className="text-white font-semibold">{fmtMoney(detail.computed.total_pipeline_cost_usd)}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <div className="text-slate-500">Pipeline time</div>
                    <div className="text-white font-semibold">{detail.computed.total_pipeline_minutes}m</div>
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <div className="text-slate-500">AI steps</div>
                    <div className="text-white font-semibold">{detail.computed.ai_steps}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded p-2">
                    <div className="text-slate-500">Human gates</div>
                    <div className="text-white font-semibold">{detail.computed.human_steps}</div>
                  </div>
                </div>

                <h3 className="text-xs uppercase tracking-wide text-slate-400 mb-2">Pipeline</h3>
                <ol className="space-y-1 mb-4">
                  {detail.workflow_steps.map(s => (
                    <li key={s.step_order} className="text-xs flex items-center gap-2 py-1 border-b border-slate-700/40">
                      <span className="w-5 text-slate-500">{s.step_order}.</span>
                      <span className="flex-1 text-slate-200">{s.step_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        s.step_type === 'human_review' ? 'bg-purple-900/40 text-purple-300' :
                        s.step_type === 'ai_inference' ? 'bg-blue-900/40 text-blue-300' :
                        'bg-slate-700/60 text-slate-400'
                      }`}>{s.step_type.replace('_', ' ')}</span>
                      <span className="text-slate-500 w-12 text-right">{fmtMoney(s.cost_per_run_usd)}</span>
                    </li>
                  ))}
                </ol>

                {detail.benchmarks.length > 0 && (
                  <>
                    <h3 className="text-xs uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-400" />Benchmarks
                    </h3>
                    <div className="space-y-1 mb-2">
                      {detail.benchmarks.slice(0, 6).map(b => (
                        <div key={b.id} className="text-xs flex items-center gap-2 py-1">
                          <span className="text-slate-300 flex-1">{b.eval_name}{b.eval_subset ? ` · ${b.eval_subset}` : ''}</span>
                          <span className="text-amber-300 font-semibold">{b.score}%</span>
                          {b.baseline_human_score && (
                            <span className={`text-[10px] ${Number(b.score) >= Number(b.baseline_human_score) ? 'text-emerald-400' : 'text-orange-400'}`}>
                              {Number(b.score) >= Number(b.baseline_human_score) ? '↑' : '↓'} {Math.abs(Number(b.score) - Number(b.baseline_human_score)).toFixed(1)}pp
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {detail.computed.human_baseline_usd && (
                  <div className="mt-4 bg-emerald-900/20 border border-emerald-700/40 rounded p-3 text-xs">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                      <div>
                        <div className="text-emerald-300 font-medium">Disrupting human delivery</div>
                        <div className="text-slate-300 mt-1">
                          Typical human-delivered baseline: <span className="text-white">{fmtMoney(detail.computed.human_baseline_usd)}</span>.
                          This offering: <span className="text-emerald-300">{fmtMoney(Number(detail.offering.base_price_usd) + Number(detail.offering.unit_price_usd || 0))}</span>.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
