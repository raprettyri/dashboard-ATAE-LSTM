"use client";

import * as React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ImageOff } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchAspects, fetchPlatforms } from "@/app/actions";
import { cn } from "@/lib/utils";

type FilterItem = { id: number; name: string; };

const capitalizeWords = (str: string) => str.replace(/\b\w/g, char => char.toUpperCase());

export function R2ImageViewer() {
  const [platforms, setPlatforms] = React.useState<FilterItem[]>([]);
  const [aspects, setAspects] = React.useState<FilterItem[]>([]);
  const [selectedPlatform, setSelectedPlatform] = React.useState<string>("");
  const [selectedAspect, setSelectedAspect] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    async function loadFilters() {
      const fetchedPlatforms = await fetchPlatforms();
      if (fetchedPlatforms.length > 0) {
        setPlatforms(fetchedPlatforms);
        setSelectedPlatform(fetchedPlatforms[0].name);
      }
      const fetchedAspects = await fetchAspects();
      if (fetchedAspects.length > 0) {
        setAspects(fetchedAspects);
        setSelectedAspect(fetchedAspects[0].name);
      }
    }
    loadFilters();
  }, []);

  React.useEffect(() => {
    if (selectedPlatform && selectedAspect && selectedDate) {
      setImageError(false);
      const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
      const dateString = format(selectedDate, "yyyy-MM-dd");
      const fileName = `${selectedPlatform}_${dateString}_${selectedAspect}.png`;
      setImageUrl(`${baseUrl}/${fileName}`);
    }
  }, [selectedPlatform, selectedAspect, selectedDate]);

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Visualisasi Word Cloud</CardTitle>
          <CardDescription>
            Pilih filter untuk menampilkan gambar word cloud.
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-lg">
              <SelectValue placeholder="Pilih Platform..." />
            </SelectTrigger>
            <SelectContent>
              {platforms.map(p => <SelectItem key={p.id} value={p.name}>{capitalizeWords(p.name)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedAspect} onValueChange={setSelectedAspect}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-lg">
              <SelectValue placeholder="Pilih Aspek..." />
            </SelectTrigger>
            <SelectContent>
              {aspects.map(a => <SelectItem key={a.id} value={a.name}>{capitalizeWords(a.name)}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="md:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full sm:w-auto justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd MMMM yyyy") : <span>Pilih tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>

      <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6">
        <div className="relative flex-grow w-full min-h-80 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={`Gambar untuk ${selectedPlatform} - ${selectedAspect} pada ${selectedDate ? format(selectedDate, 'dd-MM-yyyy') : ''}`}
              fill
              className="object-contain p-2"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-center text-muted-foreground p-4">
              <ImageOff className="mx-auto h-12 w-12" />
              <p className="mt-4">
                {imageError
                  ? "Gambar tidak ditemukan untuk kombinasi filter yang dipilih."
                  : "Pilih semua filter untuk menampilkan gambar."}
              </p>
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </div>
      </div>
    </Card>
  );
}