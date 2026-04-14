"use client";

// components/school/dashboard-charts.tsx

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrolmentByClass {
  className: string;   // e.g. "S.1", "S.2", "P.1"
  students: number;
  boys?: number;
  girls?: number;
}

interface TermEnrolment {
  term: string;        // e.g. "Term 1 2023"
  students: number;
}

interface SubjectPerformance {
  subject: string;
  avgScore: number;    // 0–100
}

interface GenderBreakdown {
  name: string;        // "Boys" | "Girls"
  value: number;
}

interface AttendanceTrend {
  day: string;         // e.g. "Mon", "Tue"
  rate: number;        // 0–100 percent
}

export interface DashboardChartsData {
  enrolmentByClass: EnrolmentByClass[];
  termEnrolmentTrend: TermEnrolment[];
  subjectPerformance: SubjectPerformance[];
  genderBreakdown: GenderBreakdown[];
  attendanceTrend: AttendanceTrend[];
}

interface DashboardChartsProps {
  data: DashboardChartsData;
}

// ─── Colour palette (matches purple/black Soma-Lite theme) ────────────────────

const PURPLE  = "#8b5cf6";
const PURPLE2 = "#a78bfa";
const BLUE    = "#3b82f6";
const GREEN   = "#22c55e";
const ORANGE  = "#f97316";
const PINK    = "#ec4899";

const GENDER_COLORS = [BLUE, PINK];

// ─── Tooltip styles ───────────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--card-foreground))",
  fontSize: 12,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function EnrolmentByClassChart({ data }: { data: EnrolmentByClass[] }) {
  const hasSplit = data.some((d) => d.boys !== undefined);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground text-sm font-semibold">
          Enrolment by Class
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {hasSplit ? "Students split by gender per class" : "Total students per class"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          {hasSplit ? (
            <BarChart data={data} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="className" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="boys"  name="Boys"  fill={BLUE}  radius={[3, 3, 0, 0]} />
              <Bar dataKey="girls" name="Girls" fill={PINK}  radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="className" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="students" name="Students" fill={PURPLE} radius={[3, 3, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function EnrolmentTrendChart({ data }: { data: TermEnrolment[] }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground text-sm font-semibold">
          Enrolment Trend
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Student count across terms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="enrolGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={PURPLE} stopOpacity={0.3} />
                <stop offset="95%" stopColor={PURPLE} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="term" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="students"
              name="Students"
              stroke={PURPLE}
              strokeWidth={2}
              fill="url(#enrolGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function SubjectPerformanceChart({ data }: { data: SubjectPerformance[] }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground text-sm font-semibold">
          Subject Performance
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Average score per subject (%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis dataKey="subject" type="category" width={72} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Avg Score"]} />
            <Bar dataKey="avgScore" name="Avg Score" radius={[0, 3, 3, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={entry.subject}
                  fill={entry.avgScore >= 70 ? GREEN : entry.avgScore >= 50 ? ORANGE : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function GenderPieChart({ data }: { data: GenderBreakdown[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground text-sm font-semibold">
          Gender Distribution
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {total.toLocaleString()} students total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v.toLocaleString(), "Students"]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AttendanceTrendChart({ data }: { data: AttendanceTrend[] }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground text-sm font-semibold">
          Attendance This Week
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Daily attendance rate (%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v}%`, "Attendance"]}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke={GREEN}
              strokeWidth={2.5}
              dot={{ fill: GREEN, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {/* 80% benchmark line */}
            <Line
              type="monotone"
              data={data.map((d) => ({ ...d, benchmark: 80 }))}
              dataKey="benchmark"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              name="80% target"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: enrolment by class + trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EnrolmentByClassChart data={data.enrolmentByClass} />
        <EnrolmentTrendChart   data={data.termEnrolmentTrend} />
      </div>

      {/* Row 2: subject performance + gender + attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SubjectPerformanceChart data={data.subjectPerformance} />
        <GenderPieChart          data={data.genderBreakdown} />
        <AttendanceTrendChart    data={data.attendanceTrend} />
      </div>
    </div>
  );
}