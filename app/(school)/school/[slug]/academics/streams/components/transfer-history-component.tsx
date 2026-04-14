// app/school/[slug]/academics/streams/[id]/components/transfer-history-section.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { getStreamTransferStats } from "@/actions/enrollments";

interface TransferHistorySectionProps {
  streamId: string;
}

export default function TransferHistorySection({
  streamId,
}: TransferHistorySectionProps) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [streamId]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await getStreamTransferStats(streamId);
      setStats(data);
    } catch (error) {
      console.error("Error loading transfer stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading transfer history...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Transfer Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Transfers In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">
              {stats.transfersIn}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Transfers Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-400">
              {stats.transfersOut}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-600" />
              Net Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                stats.netChange > 0
                  ? "text-green-700 dark:text-green-400"
                  : stats.netChange < 0
                  ? "text-red-700 dark:text-red-400"
                  : "text-slate-700 dark:text-slate-400"
              }`}
            >
              {stats.netChange > 0 ? "+" : ""}
              {stats.netChange}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transfers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#5B9BD5]" />
            Recent Transfer Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTransfers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No transfer activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentTransfers.map((transfer: any) => (
                <div
                  key={transfer.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="p-2 bg-[#5B9BD5]/10 rounded-full">
                    <ArrowRightLeft className="h-4 w-4 text-[#5B9BD5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {transfer.enrollment.student.firstName}{" "}
                        {transfer.enrollment.student.lastName}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transfer.enrollment.student.admissionNo}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span>{transfer.fromStream.name}</span>
                      <ArrowRightLeft className="h-3 w-3" />
                      <span>{transfer.toStream.name}</span>
                    </div>
                    {transfer.reason && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {transfer.reason}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(transfer.transferredAt).toLocaleDateString()} at{" "}
                      {new Date(transfer.transferredAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}