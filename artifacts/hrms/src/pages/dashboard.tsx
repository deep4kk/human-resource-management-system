import {
  Users,
  UserCheck,
  CalendarOff,
  Briefcase,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  useGetDashboardStats,
  useGetDashboardCharts,
} from "@workspace/api-client-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const {
    data: charts,
    isLoading: chartsLoading,
    isError: chartsError,
  } = useGetDashboardCharts();

  if (statsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--destructive))",
    "#10b981",
    "#8b5cf6",
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees}
          icon={Users}
          trend={`${stats?.activeEmployees || 0} active`}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          title="Present Today"
          value={stats?.presentToday}
          icon={UserCheck}
          trend={`${stats?.absentToday || 0} absent today`}
          color="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          title="On Leave"
          value={stats?.onLeave}
          icon={CalendarOff}
          trend={`${stats?.pendingLeaves || 0} pending approvals`}
          color="bg-accent/10 text-accent"
        />
        <StatCard
          title="Departments"
          value={stats?.departments}
          icon={Briefcase}
          trend={`${stats?.pendingTimesheets || 0} pending timesheets`}
          color="bg-purple-500/10 text-purple-500"
        />
      </div>

      {chartsLoading ? (
        <div className="glass-card rounded-2xl p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : chartsError ? (
        <div className="glass-card rounded-2xl p-8 flex items-center justify-center gap-3 text-muted-foreground">
          <AlertTriangle className="w-5 h-5" />
          <span>Charts data unavailable. Stats are shown above.</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Attendance
                  Overview
                </h3>
                <span className="text-sm text-muted-foreground">
                  Last 6 Months
                </span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts?.attendanceTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 12,
                      }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--secondary))" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="present"
                      name="Present"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="absent"
                      name="Absent"
                      fill="hsl(var(--destructive))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" /> Department
                Distribution
              </h3>
              <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts?.departmentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {charts?.departmentDistribution?.map(
                        (_entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-3xl font-bold">
                    {stats?.totalEmployees}
                  </span>
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {charts?.departmentDistribution?.map((d: any, i: number) => (
                  <div
                    key={d.department}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    ></div>
                    <span className="truncate">
                      {d.department} ({d.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Payroll
                Trend
              </h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={charts?.payrollTrend}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ stroke: "hsl(var(--border))", strokeWidth: 2 }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    name="Payroll Amount ($)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <div className="glass-card rounded-2xl p-6 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <h4 className="text-3xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
            {value ?? 0}
          </h4>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground font-medium">{trend}</p>
      </div>
    </div>
  );
}
