import { useState, useEffect } from "react";
import { useGetDashboardSummary, useGetPoliciesByCategory, useGetPoliciesTimeline, useGetSectorImpact, useHealthCheck, useListPolicies } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Activity, ShieldAlert, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useUserPreferences } from "@/lib/store";
import { getTranslation } from "@/lib/translations";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface RepoRateData {
  latest_rate: number;
  trends: Array<{ policy_date: string; repo_rate: number; bp_change: number }>;
  insights: {
    english: string;
    hindi: string;
  };
}

interface RagStats {
  chunks: number;
  sources: number;
}

export default function Dashboard() {
  const { language } = useUserPreferences();
  const t = (key: string) => getTranslation(language, key);

  const { data: summary } = useGetDashboardSummary();
  const { data: byCategory } = useGetPoliciesByCategory();
  const { data: timeline } = useGetPoliciesTimeline();
  const { data: sectorImpact } = useGetSectorImpact();
  const { data: allPolicies } = useListPolicies();
  const { data: health } = useHealthCheck();

  // Local state for Repo Rates and Safety Meter
  const [repoData, setRepoData] = useState<RepoRateData | null>(null);
  const [ragStats, setRagStats] = useState<RagStats | null>(null);
  const [income, setIncome] = useState<number>(20000);
  const [emi, setEmi] = useState<number>(6000);
  const [interestRate, setInterestRate] = useState<number>(6.50);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${baseUrl}/api/dashboard/repo-rates?lang=${language}`)
      .then(res => res.json())
      .then(data => {
        setRepoData(data);
        if (data?.latest_rate) {
          setInterestRate(data.latest_rate);
        }
      })
      .catch(err => console.error("Failed to load repo rates:", err));
  }, [language]);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${baseUrl}/api/dashboard/rag-stats`)
      .then(res => res.json())
      .then(data => setRagStats(data))
      .catch(err => console.error("Failed to load RAG stats:", err));
  }, []);

  const byCategoryData = Array.isArray(byCategory) ? byCategory : [];
  const timelineData = Array.isArray(timeline) ? timeline : [];
  const sectorImpactData = Array.isArray(sectorImpact) ? sectorImpact : [];
  const recentPolicies = Array.isArray(allPolicies) ? allPolicies :
    (Array.isArray(summary?.recentPolicies) ? summary!.recentPolicies : []);

  // Safety Meter Calculations
  const currentRepo = repoData?.latest_rate || 6.50;
  const dti = income > 0 ? emi / income : 0;
  const repoStress = interestRate / 10;
  const rawScore = 100 - (dti * 160) - (repoStress * 15);
  const safetyScore = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  // Determine safety state and translations
  // Determine safety state and translations
  let safetyState = "SAFE";
  let safetyText = t("safety.safeText");
  let safetyColor = "text-green-600 border-green-600 bg-green-50/50 dark:bg-green-950/20";
  let recommendation = t("safety.safeRec");

  if (safetyScore < 40) {
    safetyState = "DANGER";
    safetyText = t("safety.dangerText");
    safetyColor = "text-rose-600 border-rose-600 bg-rose-50/50 dark:bg-rose-950/20";
    recommendation = t("safety.dangerRec");
  } else if (safetyScore < 70) {
    safetyState = "CAUTION";
    safetyText = t("safety.cautionText");
    safetyColor = "text-amber-600 border-amber-600 bg-amber-50/50 dark:bg-amber-950/20";
    recommendation = t("safety.cautionRec");
  }

  // Get active insights based on selected language, fallback to English if not available
  const activeInsights = repoData?.insights
    ? ((repoData.insights as any)[language] || repoData.insights.english)
    : undefined;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">{t("dashboard.title")}</h1>
        {health && (
          <Badge variant="outline" className="text-green-600 border-green-600 gap-1 font-semibold">
            <Activity className="w-3 h-3 animate-pulse" />
            {t("dashboard.apiStatus")}: {health.status}
          </Badge>
        )}
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="shadow-sm border bg-card/65 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.totalPolicies")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summary?.totalPolicies || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border bg-card/65 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.thisMonth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summary?.thisMonthPolicies || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border bg-card/65 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.categories")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summary?.categoriesCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border bg-card/65 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.affectedGroups")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summary?.affectedGroupsCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border bg-card/65 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">RAG Chunks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{ragStats?.chunks || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border bg-card/65 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">RAG Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{ragStats?.sources || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle>{t("dashboard.byCategory")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {byCategoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">{t("dashboard.noData")}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle>{t("dashboard.timeline")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">{t("dashboard.noData")}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle>{t("dashboard.impact")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {sectorImpactData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">{t("dashboard.noData")}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorImpactData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="percentage"
                    nameKey="sector"
                    label
                  >
                    {sectorImpactData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col shadow-sm border">
          <CardHeader>
            <CardTitle>{t("dashboard.recent")}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {recentPolicies.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-8">{t("dashboard.noData")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dashboard.tableDate")}</TableHead>
                    <TableHead>{t("dashboard.tableTitle")}</TableHead>
                    <TableHead>{t("dashboard.tableImpact")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPolicies.slice(0, 5).map((policy: any) => (
                    <TableRow key={policy.id}>
                      <TableCell className="whitespace-nowrap">{new Date(policy.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Link href={`/policies/${policy.id}`} className="font-medium hover:underline text-primary">
                          {policy.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={policy.impactLevel === 'high' ? 'destructive' : policy.impactLevel === 'medium' ? 'default' : 'secondary'}>
                          {t("impact." + policy.impactLevel)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Repo Rate Analytics & Safety Meter Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repo Rate Trend Chart */}
        <Card className="lg:col-span-2 shadow-md border bg-gradient-to-tr from-background to-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              {t("safety.repoTrend")}
            </CardTitle>
            <Badge variant="outline" className="text-secondary border-secondary font-bold text-sm">
              {t("safety.latestRate")}: {currentRepo}%
            </Badge>
          </CardHeader>
          <CardContent className="h-[280px]">
            {repoData?.trends ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={repoData.trends}>
                  <defs>
                    <linearGradient id="colorRepo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="policy_date" tickFormatter={(v) => v.slice(2, 7)} />
                  <YAxis domain={[3.5, 7.0]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Repo Rate"]} />
                  <Area type="monotone" dataKey="repo_rate" stroke="hsl(var(--secondary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRepo)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Loading Trend...</div>
            )}
          </CardContent>
        </Card>

        {/* Rural Safety Meter & Loan Stress Simulator */}
        <Card className="shadow-md border bg-gradient-to-br from-background to-secondary/5 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              {t("safety.stressSimulator")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 flex-1 flex flex-col justify-between">
            {/* Speedometer Gauge Graphic */}
            <div className="flex flex-col items-center justify-center pt-2 relative">
              <svg className="w-48 h-28" viewBox="0 0 200 110">
                {/* Background arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="16"
                  strokeLinecap="round"
                  opacity={0.3}
                />
                {/* Value arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={safetyState === "SAFE" ? "#16a34a" : safetyState === "CAUTION" ? "#f59e0b" : "#e11d48"}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="251.3"
                  strokeDashoffset={251.3 - (safetyScore / 100) * 251.3}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute top-12 flex flex-col items-center justify-center">
                <span className="text-3xl font-black tracking-tight">{safetyScore}%</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${safetyColor.split(" ")[0]} ${safetyColor.split(" ")[1]} bg-background/95 shadow-sm mt-1.5`}>
                  {safetyState === "SAFE" ? t("safety.safeLabel") : safetyState === "CAUTION" ? t("safety.cautionLabel") : t("safety.dangerLabel")}
                </span>
              </div>
            </div>

            {/* Interactive Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {t("safety.monthlyIncome")}
                  </label>
                  <span className="text-xs font-extrabold text-foreground">₹{income.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="5000"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {t("safety.monthlyEmi")}
                  </label>
                  <span className="text-xs font-extrabold text-foreground">₹{emi.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80000"
                  step="1000"
                  value={emi}
                  onChange={(e) => setEmi(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-muted-foreground">
                    {t("safety.interestRate")}
                  </label>
                  <span className="text-xs font-extrabold text-secondary">{interestRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="0.25"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-secondary focus:outline-none"
                />
              </div>
            </div>

            {/* Localized Recommendation Details */}
            <div className={`p-3.5 border rounded-2xl ${safetyColor} transition-all duration-300`}>
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-1.5">
                <ShieldAlert className="w-4 h-4" />
                {safetyText}
              </div>
              <p className="text-xs leading-relaxed font-medium">{recommendation}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Policy Insights */}
      {activeInsights && (
        <Card className="shadow-md border border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              {t("safety.apiAnalysis")}
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <div 
              className="text-sm leading-relaxed text-card-foreground/90 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: activeInsights }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
