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
  ChartLegendContent
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
import { fetchAspectDistribution } from "@/app/actions";
import { cn } from "@/lib/utils";
import { type SentimentType } from "@/db/queries";

type GroupedChartData = {
  [platformId: number]: {
    platformName: string;
    aspects: { name: string; value: number }[];
  };
};

const ASPECT_COLORS = [
  "var(--youtube)", "var(--instagram)", "var(--facebook)",
  "var(--tiktok)", "var(--whatsapp)", "hsl(var(--chart-1) / 0.8)",
  "hsl(var(--chart-2) / 0.8)", "hsl(var(--chart-3) / 0.8)",
];

const capitalizeWords = (str: string) => str.replace(/\b\w/g, char => char.toUpperCase());

export function AspectPieCharts() {
  const [chartData, setChartData] = React.useState<GroupedChartData>({});
  const [selectedSentiment, setSelectedSentiment] = React.useState<SentimentType>("positive");
  const [timeRange, setTimeRange] = React.useState<string>("30d");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
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
        startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
        endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
      }

      const rawData = await fetchAspectDistribution(selectedSentiment, startDate, endDate);

      const groupedData = rawData.reduce<GroupedChartData>((acc, item) => {
        if (!acc[item.platformId]) {
          acc[item.platformId] = { platformName: item.platformName, aspects: [] };
        }
        acc[item.platformId].aspects.push({
          name: capitalizeWords(item.aspectName),
          value: item.totalReviews,
        });
        return acc;
      }, {});

      setChartData(groupedData);
      setIsLoading(false);
    }
    loadChartData();
  }, [dateRange, selectedSentiment, timeRange]);

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range.to) {
      setTimeRange("custom");
    } else if (!range?.from && !range?.to && timeRange === "custom") {
      setTimeRange("30d");
    }
  };

  const currentStartDate = dateRange?.from ? format(dateRange.from, "dd MMMM yyyy", { locale: idLocale }) : "N/A";
  const currentEndDate = dateRange?.to ? format(dateRange.to, "dd MMMM yyyy", { locale: idLocale }) : "N/A";

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Distribusi Aspek Berdasarkan Sentimen</CardTitle>
          <CardDescription>
            Menampilkan jumlah ulasan per aspek untuk sentimen yang dipilih.
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedSentiment} onValueChange={(value) => setSelectedSentiment(value as SentimentType)}>
            <SelectTrigger className="w-[180px] rounded-lg"><SelectValue placeholder="Pilih Sentimen"/></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="positive" className="rounded-lg">Positif</SelectItem>
              <SelectItem value="neutral" className="rounded-lg">Netral</SelectItem>
              <SelectItem value="negative" className="rounded-lg">Negatif</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] rounded-lg">
              <SelectValue placeholder="Pilih Waktu"/>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">7 Hari Terakhir</SelectItem>
              <SelectItem value="30d" className="rounded-lg">30 Hari Terakhir</SelectItem>
              <SelectItem value="custom" className="rounded-lg">Rentang Kustom</SelectItem>
            </SelectContent>
          </Select>

          {timeRange === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date-aspect" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "dd MMMM yyyy", { locale: idLocale })} - {format(dateRange.to, "dd MMMM yyyy", { locale: idLocale })}</>) : (format(dateRange.from, "dd MMMM yyyy", { locale: idLocale }))) : (<span>Pilih rentang tanggal</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleDateChange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">Memuat data...</div>
        ) : Object.keys(chartData).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(chartData).map(([platformId, platformData]) => {
              const totalReviews = platformData.aspects.reduce((sum, aspect) => sum + aspect.value, 0);
              const chartConfig = platformData.aspects.reduce<ChartConfig>((acc, aspect, index) => {
                acc[aspect.name] = { label: aspect.name, color: ASPECT_COLORS[index % ASPECT_COLORS.length] };
                return acc;
              }, {});
              const pieData = platformData.aspects.map((aspect, index) => ({
                ...aspect,
                fill: ASPECT_COLORS[index % ASPECT_COLORS.length],
              }));

              return (
                <Card key={platformId} className="flex flex-col w-full max-w-sm flex-grow">
                  <CardHeader className="items-center pb-0">
                    <CardTitle>{capitalizeWords(platformData.platformName)}</CardTitle>
                    <CardDescription>Ulasan Sentimen {capitalizeWords(selectedSentiment)}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-0">
                    {totalReviews > 0 ? (
                      <ChartContainer config={chartConfig} className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px]">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                          <Pie data={pieData} dataKey="value" nameKey="name" label />
                          <ChartLegend content={<ChartLegendContent nameKey="name" payload={undefined} />} />
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center text-muted-foreground aspect-square max-h-[250px]">Tidak ada data.</div>
                    )}
                  </CardContent>
                  <CardFooter className="flex-col gap-2 text-sm pt-4">
                    <div className="text-muted-foreground leading-none">
                      Total {totalReviews.toLocaleString()} ulasan teranalisis
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
            Menampilkan data ulasan
            <span className={cn('font-bold', selectedSentiment === 'positive' && 'text-[var(--chart-1)]', selectedSentiment === 'neutral' && 'text-[var(--chart-2)]', selectedSentiment === 'negative' && 'text-[var(--chart-3)]')}>
              {capitalizeWords(selectedSentiment)}
            </span>
            dari {currentStartDate} hingga {currentEndDate} <TrendingUp className="h-4 w-4" />
          </div>

          {Object.keys(chartData).length > 0 && (
            <div className="w-full">
              <div className="mb-2 font-medium text-foreground">
                Rincian Proporsi Aspek per Platform:
              </div>
              <div className="grid gap-2">
                {Object.values(chartData).map((platform) => {
                  const totalPerPlatform = platform.aspects.reduce((sum, aspect) => sum + aspect.value, 0);
                  const sortedAspects = [...platform.aspects].sort((a,b) => b.value - a.value);

                  return (
                    <div key={platform.platformName} className="flex flex-row items-start gap-2">
                      <span className="w-28 flex-shrink-0 font-semibold text-foreground">
                        {capitalizeWords(platform.platformName)}:
                      </span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {totalPerPlatform > 0 ? (
                          sortedAspects.map((aspect, index) => (
                            <React.Fragment key={aspect.name}>
                              <span
                                className="whitespace-nowrap font-semibold"
                                style={{ color: ASPECT_COLORS[index % ASPECT_COLORS.length] }}
                              >
                                {aspect.name}: {((aspect.value / totalPerPlatform) * 100).toFixed(1)}%
                              </span>
                              {index < sortedAspects.length - 1 && (
                                <span className="text-muted-foreground">|</span>
                              )}
                            </React.Fragment>
                          ))
                        ) : (
                          <span>Tidak ada ulasan.</span>
                        )}
                      </div>
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