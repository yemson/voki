import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RiskAlert } from "@/lib/trades/types";

interface DashboardRiskAlertProps {
  alerts: RiskAlert[];
}

export function DashboardRiskAlert({ alerts }: DashboardRiskAlertProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-300 bg-amber-50/70">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              리스크 신호가 감지됐어요
            </p>
            <p className="text-xs text-amber-800">
              오늘은 수익보다 손실 통제가 먼저예요.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col gap-2 rounded-md border border-amber-200 bg-white/90 p-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={alert.href}>{alert.ctaLabel}</Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
