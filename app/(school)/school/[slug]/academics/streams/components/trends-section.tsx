"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function TrendsSection({ analytics }: { analytics: any }) {
  const performanceTrend =
    analytics.performanceOverTime.length > 1
      ? analytics.performanceOverTime[
          analytics.performanceOverTime.length - 1
        ].averageMark -
        analytics.performanceOverTime[0].averageMark
      : 0;

  const attendanceTrend =
    analytics.attendanceTrends.length > 1
      ? analytics.attendanceTrends[analytics.attendanceTrends.length - 1]
          .averageAttendance - analytics.attendanceTrends[0].averageAttendance
      : 0;

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <>
      {/* Trend Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${getTrendColor(performanceTrend)}`}>
                  {performanceTrend > 0 ? "+" : ""}
                  {performanceTrend.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Since first term
                </p>
              </div>
              {getTrendIcon(performanceTrend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${getTrendColor(attendanceTrend)}`}>
                  {attendanceTrend > 0 ? "+" : ""}
                  {attendanceTrend.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Since first term
                </p>
              </div>
              {getTrendIcon(attendanceTrend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Term</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.performanceOverTime.length > 0
                ? analytics.performanceOverTime[
                    analytics.performanceOverTime.length - 1
                  ].termName
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.performanceOverTime.length > 0
                ? `${
                    analytics.performanceOverTime[
                      analytics.performanceOverTime.length - 1
                    ].averageMark
                  }% average`
                : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Attendance Combined */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Attendance Correlation</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={analytics.performanceOverTime.map(
                (perf: any, idx: number) => ({
                  ...perf,
                  attendance:
                    analytics.attendanceTrends[idx]?.averageAttendance || 0,
                })
              )}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="termName" />
              <YAxis yAxisId="left" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="right"
                dataKey="attendance"
                fill="#82ca9d"
                name="Attendance %"
                opacity={0.3}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="averageMark"
                stroke="#8884d8"
                strokeWidth={3}
                name="Performance %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Student Count Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Trend Across Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.performanceOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="termName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="studentCount"
                stroke="#8884d8"
                fill="#8884d8"
                name="Student Count"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Term-by-Term Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Term-by-Term Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.performanceOverTime.map((term: any, idx: number) => {
              const prevTerm = analytics.performanceOverTime[idx - 1];
              const change = prevTerm
                ? term.averageMark - prevTerm.averageMark
                : 0;

              return (
                <div
                  key={term.termNumber}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{term.termName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {term.studentCount} students enrolled
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {idx > 0 && (
                      <div className="flex items-center gap-2">
                        {getTrendIcon(change)}
                        <span
                          className={`text-sm font-medium ${getTrendColor(
                            change
                          )}`}
                        >
                          {change > 0 ? "+" : ""}
                          {change.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {term.averageMark}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average Mark
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}