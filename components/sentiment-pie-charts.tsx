"use client";

import * as React from "react";
import { CalendarIcon, TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import { id as idLocale } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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
import { fetchAspects, fetchAggregatedSentiment } from "@/app/actions";
import { cn } from "@/lib/utils";

type Aspect = { id: number; name: string; };
type ChartData = {
  platformId: number;
  platformName: string;
  positive: number;
  neutral: number;
  negative: number;
};

const chartConfig = {
  positive: { label: "Positif", color: "var(--chart-1)" },
  neutral: { label: "Netral", color: "var(--chart-2)" },
  negative: { label: "Negatif", color: "var(--chart-3)" },
} satisfies ChartConfig;

const capitalizeWords = (str: string) => str.replace(/\b\w/g, char => char.toUpperCase());

export function SentimentPieCharts() {
  const [chartData, setChartData] = React.useState<ChartData[]>([]);
  const [aspects, setAspects] = React.useState<Aspect[]>([]);
  const [selectedAspect, setSelectedAspect] = React.useState<string>("");
  const [timeRange, setTimeRange] = React.useState<string>("30d");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadInitialData() {
      const fetchedAspects = await fetchAspects();
      if (fetchedAspects.length > 0) {
        const capitalizedAspects = fetchedAspects.map(a => ({...a, name: capitalizeWords(a.name)}));
        setAspects(capitalizedAspects);
        setSelectedAspect(capitalizedAspects[0].id.toString());
      }
    }
    loadInitialData();
  }, []);

  React.useEffect(() => {
    if (!selectedAspect) return;

    async function loadChartData() {
      setIsLoading(true);
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (timeRange !== "custom") {
        const today = new Date();
        endDate = format(today, "yyyy-MM-dd");
        const days = parseInt(timeRange.replace('d', ''));
        startDate = format(subDays(today, days), "yyyy-MM-dd");
      } else {
        if (dateRange?.from) startDate = format(dateRange.from, "yyyy-MM-dd");
        if (dateRange?.to) endDate = format(dateRange.to, "yyyy-MM-dd");
      }

      const aspectId = parseInt(selectedAspect);
      const data = await fetchAggregatedSentiment(aspectId, startDate, endDate);
      setChartData(data);
      setIsLoading(false);
    }

    loadChartData();
  }, [selectedAspect, timeRange, dateRange]);

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setTimeRange(range?.from && range.to ? "custom" : "30d");
  };

  const currentStartDate = dateRange?.from ? format(dateRange.from, "dd MMMM yyyy", { locale: idLocale }) : "N/A";
  const currentEndDate = dateRange?.to ? format(dateRange.to, "dd MMMM yyyy", { locale: idLocale }) : "N/A";

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Total Sentimen Berdasarkan Platform</CardTitle>
          <CardDescription>
            Menampilkan total ulasan sentimen untuk setiap platform berdasarkan filter.
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedAspect} onValueChange={setSelectedAspect}>
            <SelectTrigger className="w-[180px] rounded-lg"><SelectValue placeholder="Pilih Aspek"/></SelectTrigger>
            <SelectContent className="rounded-xl">
              {aspects.map((aspect) => (
                <SelectItem key={aspect.id} value={aspect.id.toString()} className="rounded-lg">{aspect.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] rounded-lg"><SelectValue placeholder="Pilih Waktu"/></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">7 Hari Terakhir</SelectItem>
              <SelectItem value="30d" className="rounded-lg">30 Hari Terakhir</SelectItem>
              <SelectItem value="custom" className="rounded-lg">Rentang Kustom</SelectItem>
            </SelectContent>
          </Select>

          {timeRange === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date-pie" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4"/>
                  {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "dd MMMM yyyy", { locale: idLocale })} - {format(dateRange.to, "dd MMMM yyyy", { locale: idLocale })}</>) : (format(dateRange.from, "dd MMMM yyyy", { locale: idLocale }))) : (<span>Pilih rentang tanggal</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleDateChange} numberOfMonths={2}/>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">Memuat data...</div>
        ) : chartData.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-6">
            {chartData.map((platformData) => {
              const pieData = [
                { sentiment: 'positive', count: platformData.positive, fill: 'var(--color-positive)' },
                { sentiment: 'neutral', count: platformData.neutral, fill: 'var(--color-neutral)' },
                { sentiment: 'negative', count: platformData.negative, fill: 'var(--color-negative)' },
              ].filter(d => d.count > 0);

              const totalSentiments = pieData.reduce((acc, curr) => acc + curr.count, 0);

              return (
                <Card key={platformData.platformId} className="flex flex-col w-full max-w-sm flex-grow">
                  <CardHeader className="items-center pb-0">
                    <CardTitle>{capitalizeWords(platformData.platformName)}</CardTitle>
                    <CardDescription>
                      Aspek: {aspects.find(a => a.id.toString() === selectedAspect)?.name || 'Semua'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-0">
                    {totalSentiments > 0 ? (
                      <ChartContainer config={chartConfig} className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="sentiment" />} />
                          <Pie data={pieData} dataKey="count" nameKey="sentiment" strokeWidth={2} label />
                          <ChartLegend content={<ChartLegendContent nameKey="sentiment" payload={undefined} />} />
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center text-muted-foreground aspect-square max-h-[250px]">
                        Tidak ada data.
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex-col gap-2 text-sm pt-4">
                    <div className="text-muted-foreground leading-none">
                      Total {totalSentiments.toLocaleString()} ulasan teranalisis
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            Tidak ada data tersedia untuk filter yang dipilih.
          </div>
        )}
      </CardContent>

      <CardFooter>
        <div className="flex w-full flex-col items-start gap-4 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
            Data dari {currentStartDate} hingga {currentEndDate}{" "}
            <TrendingUp className="h-4 w-4" />
          </div>

          {chartData.length > 0 && (
            <div className="w-full">
              <div className="mb-2 font-medium text-foreground">
                Rincian Proporsi per Platform:
              </div>
              <div className="grid gap-2">
                {chartData.map((platform) => {
                  const totalPerPlatform = platform.positive + platform.neutral + platform.negative;

                  if (totalPerPlatform === 0) {
                    return (
                      <div key={platform.platformId} className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{capitalizeWords(platform.platformName)}:</span>
                        <span className="ml-2">Tidak ada ulasan untuk periode ini.</span>
                      </div>
                    );
                  }

                  const positivePercent = ((platform.positive / totalPerPlatform) * 100).toFixed(1);
                  const neutralPercent = ((platform.neutral / totalPerPlatform) * 100).toFixed(1);
                  const negativePercent = ((platform.negative / totalPerPlatform) * 100).toFixed(1);

                  return (
                    <div key={platform.platformId} className="text-muted-foreground">
                      <span className="inline-block w-28 font-semibold text-foreground">
                        {capitalizeWords(platform.platformName)}:
                      </span>
                      <span className="ml-2 font-semibold text-[var(--chart-1)]">
                        Positif: {positivePercent}%
                      </span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="font-semibold text-[var(--chart-2)]">
                        Netral: {neutralPercent}%
                      </span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="font-semibold text-[var(--chart-3)]">
                        Negatif: {negativePercent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}