"use client";

import * as React from "react";
import { Bar, BarChart, Area, AreaChart, Line, LineChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts";
import { CalendarIcon, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import { id as idLocale } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { fetchAspects, fetchPlatforms, fetchSentimentData, fetchVersionHistory } from "@/app/actions";
import { cn } from "@/lib/utils";

type Platform = { id: number; name: string; };
type Aspect = { id: number; name: string; };
type ChartType = "area" | "area-expanded" | "bar-stacked" | "line";

type ChartDataPoint = {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  platformName: string;
  aspectName: string;
};

type VersionData = {
  releaseDate: string;
  versionNumber: string;
};

const chartConfig = {
  positive: { label: "Positif", color: "var(--chart-1)" },
  neutral: { label: "Netral", color: "var(--chart-2)" },
  negative: { label: "Negatif", color: "var(--chart-3)" },
} satisfies ChartConfig;

const capitalizeWords = (str: string) => str.replace(/\b\w/g, char => char.toUpperCase());

const CustomChartTooltipContent = ({ active, payload, label, versionHistoryData, chartConfig }: any) => {
  if (active && payload && payload.length) {
    const hoveredDate = label;
    const releasedVersion = versionHistoryData.find(
      (v: VersionData) => v.releaseDate === hoveredDate
    );

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid gap-1">
          <p className="text-sm font-medium leading-none">
            {format(new Date(label), "dd MMMM yyyy", { locale: idLocale })}
          </p>

          {releasedVersion && (
            <p className="text-xs text-muted-foreground">
              Versi: <span className="font-semibold">{releasedVersion.versionNumber}</span>
            </p>
          )}

          {payload.map((entry: any, index: number) => (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-2"
            >
              <p className="text-sm text-muted-foreground">
                <span
                  className="mr-1 inline-flex h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {chartConfig[entry.name as keyof typeof chartConfig]?.label ?? entry.name}
              </p>
              <p className="text-sm font-medium tabular-nums text-foreground">
                {entry.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function SentimentChart() {
  const [chartType, setChartType] = React.useState<ChartType>("bar-stacked");
  const [sentimentData, setSentimentData] = React.useState<ChartDataPoint[]>([]);
  const [platforms, setPlatforms] = React.useState<Platform[]>([]);
  const [aspects, setAspects] = React.useState<Aspect[]>([]);
  const [selectedPlatform, setSelectedPlatform] = React.useState<string>("");
  const [selectedAspect, setSelectedAspect] = React.useState<string>("");
  const [timeRange, setTimeRange] = React.useState<string>("30d");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [versionHistoryData, setVersionHistoryData] = React.useState<VersionData[]>([]);

  React.useEffect(() => {
    async function loadInitialData() {
      const fetchedPlatforms = await fetchPlatforms();
      if (fetchedPlatforms.length > 0) {
        const capitalizedPlatforms = fetchedPlatforms.map(p => ({ ...p, name: capitalizeWords(p.name) }));
        setPlatforms(capitalizedPlatforms);
        setSelectedPlatform(capitalizedPlatforms[0].id.toString());
      }
      const fetchedAspects = await fetchAspects();
      if (fetchedAspects.length > 0) {
        const capitalizedAspects = fetchedAspects.map(a => ({ ...a, name: capitalizeWords(a.name) }));
        setAspects(capitalizedAspects);
        setSelectedAspect(capitalizedAspects[0].id.toString());
      }
    }
    loadInitialData();
  }, []);

  React.useEffect(() => {
    if (!selectedPlatform || !selectedAspect) return;

    async function loadChartAndVersionData() {
      setIsLoading(true);
      let startDate: string | undefined, endDate: string | undefined;
      if (timeRange !== "custom") {
        const today = new Date();
        endDate = format(today, "yyyy-MM-dd");
        const days = parseInt(timeRange.replace('d', ''));
        startDate = format(subDays(today, days), "yyyy-MM-dd");
      } else {
        if (dateRange?.from) startDate = format(dateRange.from, "yyyy-MM-dd");
        if (dateRange?.to) endDate = format(dateRange.to, "yyyy-MM-dd");
      }

      const platformId = parseInt(selectedPlatform);
      const aspectId = parseInt(selectedAspect);
      const data = await fetchSentimentData(platformId, aspectId, startDate, endDate);

      const chartReadyData = data.map(item => ({
        date: item.date,
        positive: item.positiveCount,
        neutral: item.neutralCount,
        negative: item.negativeCount,
        platformName: item.platformName,
        aspectName: item.aspectName,
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setSentimentData(chartReadyData);

      const versionData = await fetchVersionHistory(platformId, startDate, endDate);
      setVersionHistoryData(versionData);

      setIsLoading(false);
    }
    loadChartAndVersionData();
  }, [selectedPlatform, selectedAspect, timeRange, dateRange]);

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range.to) setTimeRange("custom");
    else if (!range?.from && !range?.to && timeRange === "custom") setTimeRange("30d");
  };

  const currentStartDate = dateRange?.from ? format(dateRange.from, "dd MMMM yyyy", { locale: idLocale }) : "N/A";
  const currentEndDate = dateRange?.to ? format(dateRange.to, "dd MMMM yyyy", { locale: idLocale }) : "N/A";

  const renderChartSeries = () => {
    switch (chartType) {
      case "bar-stacked":
        return <>
          <Bar dataKey="positive" fill="var(--color-positive)" stackId="a" />
          <Bar dataKey="neutral" fill="var(--color-neutral)" stackId="a" />
          <Bar dataKey="negative" fill="var(--color-negative)" stackId="a" />
        </>;
      case "area":
      case "area-expanded":
        return <>
          <Area dataKey="positive" type="natural" fill="var(--color-positive)" stroke="var(--color-positive)" stackId="a" />
          <Area dataKey="neutral" type="natural" fill="var(--color-neutral)" stroke="var(--color-neutral)" stackId="a" />
          <Area dataKey="negative" type="natural" fill="var(--color-negative)" stroke="var(--color-negative)" stackId="a" />
        </>;
      case "line":
        return <>
          <Line dataKey="positive" type="natural" stroke="var(--color-positive)" strokeWidth={2} dot={false} />
          <Line dataKey="neutral" type="natural" stroke="var(--color-neutral)" strokeWidth={2} dot={false} />
          <Line dataKey="negative" type="natural" stroke="var(--color-negative)" strokeWidth={2} dot={false} />
        </>;
      default: return null;
    }
  };

  let ChartComponent: React.ElementType = BarChart;
  if (chartType.startsWith("area")) ChartComponent = AreaChart;
  else if (chartType === "line") ChartComponent = LineChart;

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Dinamika Sentimen Seiring Waktu</CardTitle>
          <CardDescription>Visualisasi jumlah ulasan sentimen berdasarkan filter yang dipilih.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
            <SelectTrigger className="w-[200px] rounded-lg"><SelectValue placeholder="Pilih Tipe Chart" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="bar-stacked" className="rounded-lg">Bar Chart - Stacked</SelectItem>
              <SelectItem value="area" className="rounded-lg">Area Chart</SelectItem>
              <SelectItem value="area-expanded" className="rounded-lg">Area Chart - Stacked Expanded</SelectItem>
              <SelectItem value="line" className="rounded-lg">Line Chart - Multiple</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-[180px] rounded-lg"><SelectValue placeholder="Pilih Platform" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              {platforms.map((p) => <SelectItem key={p.id} value={p.id.toString()} className="rounded-lg">{p.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedAspect} onValueChange={setSelectedAspect}>
            <SelectTrigger className="w-[180px] rounded-lg"><SelectValue placeholder="Pilih Aspek" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              {aspects.map((a) => <SelectItem key={a.id} value={a.id.toString()} className="rounded-lg">{a.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] rounded-lg"><SelectValue placeholder="Pilih Waktu" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">7 Hari Terakhir</SelectItem>
              <SelectItem value="30d" className="rounded-lg">30 Hari Terakhir</SelectItem>
              <SelectItem value="custom" className="rounded-lg">Rentang Kustom</SelectItem>
            </SelectContent>
          </Select>

          {timeRange === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "dd MMMM yyyy", { locale: idLocale })} - {format(dateRange.to, "dd MMMM yyyy", { locale: idLocale })}</>) : (format(dateRange.from, "dd MMMM yyyy", { locale: idLocale }))) : (<span>Pilih rentang tanggal</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleDateChange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">Memuat data...</div>
        ) : sentimentData.length > 0 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full">
            <ChartComponent
              accessibilityLayer
              data={sentimentData}
              stackOffset={chartType === "area-expanded" ? "expand" : undefined}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(value) => format(new Date(value), "dd MMM", { locale: idLocale })} />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={chartType === "area-expanded" ? 60 : 40}
                tickFormatter={(value) => chartType === "area-expanded" ? `${(value * 100).toFixed(0)}%` : value.toLocaleString()}
              />
              <ChartTooltip content={
                <CustomChartTooltipContent
                  versionHistoryData={versionHistoryData}
                  chartConfig={chartConfig}
                />
              } />
              <ChartLegend content={<ChartLegendContent payload={undefined} />} />
              {renderChartSeries()}
              {versionHistoryData.map((version, index) => (
                <ReferenceLine
                  key={`version-${index}`}
                  x={version.releaseDate}
                  stroke="black"
                  strokeDasharray="3 3"
                />
              ))}
            </ChartComponent>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            Tidak ada data tersedia untuk filter yang dipilih.
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Data dari {currentStartDate} hingga {currentEndDate} <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Sesuaikan filter di atas untuk melihat data yang berbeda.
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}