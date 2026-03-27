import { useListKpis, useListAppraisals } from "@workspace/api-client-react";
import { Target, Star, Award, TrendingUp } from "lucide-react";

export default function Performance() {
  const { data: kpis } = useListKpis();
  const { data: appraisals } = useListAppraisals();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Performance & KPIs</h1>
        <p className="text-muted-foreground">Track goals, metrics, and team appraisals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* KPIs */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2"><Target className="w-5 h-5 text-primary"/> Active KPIs</h2>
          {kpis?.map(kpi => (
            <div key={kpi.id} className="glass-card p-6 rounded-2xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{kpi.title}</h4>
                  <p className="text-sm text-muted-foreground">{kpi.employeeName} • {kpi.period}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  kpi.status === 'on_track' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                  'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}>
                  {kpi.status.replace('_', ' ')}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{kpi.achieved} {kpi.unit} achieved</span>
                  <span className="text-muted-foreground">Target: {kpi.target} {kpi.unit}</span>
                </div>
                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min((kpi.achieved/kpi.target)*100, 100)}%`}}
                  ></div>
                </div>
              </div>
            </div>
          ))}
          {(!kpis || kpis.length === 0) && (
            <div className="glass-card p-8 rounded-2xl text-center text-muted-foreground border-dashed">
              No active KPIs found.
            </div>
          )}
        </div>

        {/* Appraisals */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2"><Award className="w-5 h-5 text-accent"/> Recent Appraisals</h2>
          {appraisals?.map(app => (
            <div key={app.id} className="glass-card p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Star className="w-5 h-5 fill-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{app.employeeName}</h4>
                    <p className="text-xs text-muted-foreground">Reviewed by: {app.reviewerName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{app.overallRating}<span className="text-base text-muted-foreground">/5</span></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Technical Skills</span>
                  <RatingStars rating={app.technicalSkills} />
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Communication</span>
                  <RatingStars rating={app.communication} />
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Teamwork</span>
                  <RatingStars rating={app.teamwork} />
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Leadership</span>
                  <RatingStars rating={app.leadership} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-accent fill-accent' : 'text-muted'}`} />
      ))}
    </div>
  );
}
