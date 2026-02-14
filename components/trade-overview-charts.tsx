"use client"

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type CumulativePoint = {
  index: number
  label: string
  rate: number
}

type MonthlyWinRatePoint = {
  month: string
  winRate: number
  total: number
  win: number
}

interface TradeOverviewChartsProps {
  cumulative: CumulativePoint[]
  monthlyWinRate: MonthlyWinRatePoint[]
}

const cumulativeConfig = {
  rate: {
    label: "누적 수익률",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const monthlyWinRateConfig = {
  winRate: {
    label: "월별 승률",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function TradeOverviewCharts({
  cumulative,
  monthlyWinRate,
}: TradeOverviewChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>누적 수익률</CardTitle>
          <CardDescription>최근 3개월 기준 손익 흐름을 보여줘요.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cumulativeConfig} className="h-[240px] w-full">
            <LineChart data={cumulative}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="var(--color-rate)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>월별 승률</CardTitle>
          <CardDescription>최근 6개월 기준 월간 승률을 보여줘요.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={monthlyWinRateConfig} className="h-[240px] w-full">
            <BarChart data={monthlyWinRate}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _, item) => {
                      const row = item.payload as MonthlyWinRatePoint
                      return (
                        <div className="space-y-0.5">
                          <div>{Number(value).toFixed(1)}%</div>
                          <div className="text-muted-foreground text-xs">
                            총 {row.total}건 · 승 {row.win}건
                          </div>
                        </div>
                      )
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="winRate" fill="var(--color-winRate)" radius={6} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
