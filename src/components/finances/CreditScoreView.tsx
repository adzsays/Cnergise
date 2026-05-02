import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  ExternalLink,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { toast } from 'sonner';

type Provider = 'clearscore' | 'experian' | 'transunion' | 'equifax';

interface ProviderConfig {
  id: Provider;
  name: string;
  bureau: string;
  maxScore: number;
  url: string;
  brand: string; // tailwind text color
}

const PROVIDERS: ProviderConfig[] = [
  { id: 'clearscore', name: 'ClearScore', bureau: 'Equifax', maxScore: 1000, url: 'https://www.clearscore.com/', brand: 'text-emerald-600' },
  { id: 'experian', name: 'Experian', bureau: 'Experian', maxScore: 999, url: 'https://www.experian.co.uk/consumer/login.html', brand: 'text-sky-600' },
  { id: 'transunion', name: 'Credit Karma', bureau: 'TransUnion', maxScore: 710, url: 'https://www.creditkarma.co.uk/', brand: 'text-violet-600' },
  { id: 'equifax', name: 'Equifax', bureau: 'Equifax', maxScore: 1000, url: 'https://www.equifax.co.uk/', brand: 'text-orange-600' },
];

interface ScoreRow {
  id?: string;
  provider: Provider;
  score: number;
  max_score: number;
  rating?: string | null;
  score_date: string;
}

const ratingFor = (pct: number) => {
  if (pct >= 0.9) return { label: 'Excellent', color: 'bg-emerald-500' };
  if (pct >= 0.75) return { label: 'Very Good', color: 'bg-green-500' };
  if (pct >= 0.6) return { label: 'Good', color: 'bg-yellow-500' };
  if (pct >= 0.4) return { label: 'Fair', color: 'bg-orange-500' };
  return { label: 'Poor', color: 'bg-red-500' };
};

export const CreditScoreView = () => {
  const [scores, setScores] = useState<Record<Provider, ScoreRow | null>>({
    clearscore: null,
    experian: null,
    transunion: null,
    equifax: null,
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProviderConfig | null>(null);
  const [draftScore, setDraftScore] = useState('');

  const { transactions, accounts } = useFinancialData();

  const loadScores = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('credit_scores')
      .select('*')
      .eq('user_id', userData.user.id);
    if (error) {
      toast.error('Could not load credit scores');
    } else {
      const next = { clearscore: null, experian: null, transunion: null, equifax: null } as Record<Provider, ScoreRow | null>;
      for (const r of data ?? []) {
        if (['clearscore', 'experian', 'transunion', 'equifax'].includes(r.provider)) {
          next[r.provider as Provider] = r as ScoreRow;
        }
      }
      setScores(next);
    }
    setLoading(false);
  };

  useEffect(() => { loadScores(); }, []);

  const openEdit = (p: ProviderConfig) => {
    setEditing(p);
    setDraftScore(scores[p.id]?.score?.toString() ?? '');
  };

  const saveScore = async () => {
    if (!editing) return;
    const value = parseInt(draftScore, 10);
    if (isNaN(value) || value < 0 || value > editing.maxScore) {
      toast.error(`Score must be between 0 and ${editing.maxScore}`);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const pct = value / editing.maxScore;
    const { error } = await supabase
      .from('credit_scores')
      .upsert({
        user_id: userData.user.id,
        provider: editing.id,
        score: value,
        max_score: editing.maxScore,
        rating: ratingFor(pct).label,
        score_date: new Date().toISOString().slice(0, 10),
      }, { onConflict: 'user_id,provider' });
    if (error) {
      toast.error('Could not save score');
    } else {
      toast.success(`${editing.name} score saved`);
      setEditing(null);
      loadScores();
    }
  };

  // ===== Open Banking-derived issue insights =====
  const insights = useMemo(() => {
    const out: { severity: 'high' | 'medium' | 'low' | 'good'; title: string; detail: string }[] = [];
    const txns = transactions ?? [];
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const recent = txns.filter((t: any) => new Date(t.date) >= ninetyDaysAgo);

    // 1. Credit utilization across credit accounts
    const creditAccounts = (accounts ?? []).filter((a: any) =>
      ['credit_card', 'credit', 'loan'].includes((a.type || '').toLowerCase()),
    );
    if (creditAccounts.length > 0) {
      const totalLimit = creditAccounts.reduce((s: number, a: any) => s + (Number(a.credit_limit) || 0), 0);
      const totalUsed = creditAccounts.reduce((s: number, a: any) => s + Math.abs(Number(a.balance) || 0), 0);
      if (totalLimit > 0) {
        const util = totalUsed / totalLimit;
        if (util > 0.5) {
          out.push({ severity: 'high', title: 'High credit utilization', detail: `Using ${Math.round(util * 100)}% of available credit. Aim for under 30%.` });
        } else if (util > 0.3) {
          out.push({ severity: 'medium', title: 'Elevated credit utilization', detail: `Using ${Math.round(util * 100)}% of available credit.` });
        } else {
          out.push({ severity: 'good', title: 'Healthy credit utilization', detail: `Using ${Math.round(util * 100)}% of available credit.` });
        }
      }
    }

    // 2. Overdraft / negative balances
    const negativeAccounts = (accounts ?? []).filter((a: any) => Number(a.balance) < 0 && (a.type || '').toLowerCase() !== 'credit_card');
    if (negativeAccounts.length > 0) {
      out.push({ severity: 'high', title: 'Overdraft detected', detail: `${negativeAccounts.length} account${negativeAccounts.length > 1 ? 's' : ''} in negative balance.` });
    }

    // 3. Returned / failed payments
    const failed = recent.filter((t: any) => /returned|reversed|failed|insufficient|unpaid|bounced/i.test(t.description || ''));
    if (failed.length > 0) {
      out.push({ severity: 'high', title: 'Failed payments detected', detail: `${failed.length} returned/failed transaction${failed.length > 1 ? 's' : ''} in the last 90 days.` });
    }

    // 4. Late fees
    const lateFees = recent.filter((t: any) => /late\s?fee|penalty/i.test(t.description || ''));
    if (lateFees.length > 0) {
      out.push({ severity: 'medium', title: 'Late fees charged', detail: `${lateFees.length} late fee${lateFees.length > 1 ? 's' : ''} in the last 90 days.` });
    }

    if (out.length === 0) {
      out.push({ severity: 'good', title: 'No issues detected', detail: 'Connect a bank account or import statements to enable deeper insights.' });
    }
    return out;
  }, [transactions, accounts]);

  const avgScorePct = useMemo(() => {
    const filled = Object.values(scores).filter(Boolean) as ScoreRow[];
    if (filled.length === 0) return null;
    const totalPct = filled.reduce((s, r) => s + r.score / r.max_score, 0) / filled.length;
    return totalPct;
  }, [scores]);

  return (
    <div className="space-y-6">
      {/* Overview banner */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Credit Scores</CardTitle>
              <CardDescription>
                UK bureaus don't expose a unified consumer API. Update each score manually — issues are detected from your linked bank data.
              </CardDescription>
            </div>
            {avgScorePct !== null && (
              <Badge className={`${ratingFor(avgScorePct).color} text-white`}>
                Avg: {ratingFor(avgScorePct).label}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Provider cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PROVIDERS.map((p) => {
          const row = scores[p.id];
          const pct = row ? row.score / row.max_score : 0;
          const r = row ? ratingFor(pct) : null;
          return (
            <Card key={p.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className={`text-base ${p.brand}`}>{p.name}</CardTitle>
                    <CardDescription className="text-xs">Bureau: {p.bureau} · /{p.maxScore}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.name}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {row ? (
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-semibold ${p.brand}`}>{row.score}</span>
                      <span className="text-xs text-muted-foreground">/ {row.max_score}</span>
                      {r && <Badge className={`${r.color} text-white ml-auto`}>{r.label}</Badge>}
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${r?.color ?? 'bg-primary'}`} style={{ width: `${pct * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">Updated {new Date(row.score_date).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-2">
                    No score yet. <button onClick={() => openEdit(p)} className="text-primary hover:underline">Add score</button> or{' '}
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                      check {p.name} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Issues from Open Banking data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Detected Issues
          </CardTitle>
          <CardDescription>Insights from your connected accounts and transactions that may affect your credit score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((it, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-md border bg-muted/20">
                <div className="mt-0.5">
                  {it.severity === 'high' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {it.severity === 'medium' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                  {it.severity === 'low' && <Info className="h-4 w-4 text-yellow-500" />}
                  {it.severity === 'good' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{it.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{it.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update {editing?.name} score</DialogTitle>
            <CardDescription>
              Get your latest score from{' '}
              {editing && (
                <a href={editing.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  {editing.name} <ExternalLink className="h-3 w-3" />
                </a>
              )}{' '}
              and enter it below.
            </CardDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="score-input">Score (0 – {editing?.maxScore})</Label>
            <Input
              id="score-input"
              type="number"
              min={0}
              max={editing?.maxScore}
              value={draftScore}
              onChange={(e) => setDraftScore(e.target.value)}
              placeholder="e.g. 742"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveScore}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
