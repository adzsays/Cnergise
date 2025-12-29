import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreditFactor {
  name: string;
  status: 'good' | 'fair' | 'poor';
  impact: 'high' | 'medium' | 'low';
  description: string;
}

const mockCreditData = {
  score: 742,
  maxScore: 850,
  rating: 'Good',
  lastUpdated: '2024-01-15',
  change: +12,
  factors: [
    { name: 'Payment History', status: 'good', impact: 'high', description: 'All payments made on time' },
    { name: 'Credit Utilization', status: 'fair', impact: 'high', description: 'Using 35% of available credit' },
    { name: 'Credit Age', status: 'good', impact: 'medium', description: 'Average account age: 7 years' },
    { name: 'Credit Mix', status: 'good', impact: 'low', description: 'Good variety of credit types' },
    { name: 'Hard Inquiries', status: 'fair', impact: 'low', description: '2 inquiries in last 12 months' },
  ] as CreditFactor[],
};

const getScoreColor = (score: number) => {
  if (score >= 750) return 'text-green-500';
  if (score >= 670) return 'text-yellow-500';
  if (score >= 580) return 'text-orange-500';
  return 'text-red-500';
};

const getScoreRating = (score: number) => {
  if (score >= 800) return { label: 'Excellent', color: 'bg-green-500' };
  if (score >= 740) return { label: 'Very Good', color: 'bg-green-400' };
  if (score >= 670) return { label: 'Good', color: 'bg-yellow-500' };
  if (score >= 580) return { label: 'Fair', color: 'bg-orange-500' };
  return { label: 'Poor', color: 'bg-red-500' };
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'good':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'fair':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'poor':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
};

export const CreditScoreView = () => {
  const { score, maxScore, factors, lastUpdated, change } = mockCreditData;
  const scorePercentage = (score / maxScore) * 100;
  const rating = getScoreRating(score);

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Credit Score</CardTitle>
              <CardDescription>Last updated: {new Date(lastUpdated).toLocaleDateString()}</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Score
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score Circle */}
            <div className="relative flex items-center justify-center">
              <svg className="w-48 h-48 -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-muted/20"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={553}
                  strokeDashoffset={553 - (553 * scorePercentage) / 100}
                  strokeLinecap="round"
                  className={getScoreColor(score)}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</span>
                <span className="text-sm text-muted-foreground">out of {maxScore}</span>
              </div>
            </div>

            {/* Score Details */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={`${rating.color} text-white`}>{rating.label}</Badge>
                {change !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span>{change > 0 ? '+' : ''}{change} points this month</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score Range</span>
                  <span>300 - 850</span>
                </div>
                <div className="flex gap-1 h-2">
                  <div className="flex-1 bg-red-500 rounded-l" />
                  <div className="flex-1 bg-orange-500" />
                  <div className="flex-1 bg-yellow-500" />
                  <div className="flex-1 bg-green-400" />
                  <div className="flex-1 bg-green-500 rounded-r" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Very Good</span>
                  <span>Excellent</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Credit Factors</CardTitle>
          <CardDescription>What's affecting your score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {factors.map((factor, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                <div className="mt-0.5">{getStatusIcon(factor.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium">{factor.name}</h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {factor.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{factor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tips to Improve Your Score</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">Pay all bills on time - payment history is the most important factor</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">Keep credit utilization below 30% of your available credit</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">Don't close old credit accounts - they help your credit age</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">Limit hard inquiries by only applying for credit when needed</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
