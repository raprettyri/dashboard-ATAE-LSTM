"use client";

import * as React from "react";
import { Upload, FileJson, Loader2, CheckCircle, AlertTriangle, List } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { seedDatabaseFromJson } from "@/app/actions";
import { cn } from "@/lib/utils";

export function JsonUploader() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [status, setStatus] = React.useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles));
      setStatus("idle");
      setMessage("");
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length === 0) {
      setStatus("error");
      setMessage("Silakan pilih file JSON terlebih dahulu.");
      return;
    }

    setStatus("uploading");
    setMessage("Mengunggah dan memproses file...");

    const formData = new FormData();
    files.forEach(file => {
      formData.append("jsonFiles", file);
    });

    const result = await seedDatabaseFromJson(formData);

    setStatus(result.success ? "success" : "error");
    setMessage(result.message);
    setFiles([]);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderSelectedFiles = () => {
    if (files.length === 0) return "Pilih File JSON";
    if (files.length === 1) return `Terpilih: ${files[0].name}`;
    return `${files.length} file dipilih`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unggah File JSON untuk Seeding</CardTitle>
        <CardDescription>
          Pilih dan unggah satu atau beberapa file JSON sekaligus untuk dimasukkan ke dalam database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
            multiple
          />
          <Button type="button" variant="outline" onClick={handleButtonClick}>
            <FileJson className="mr-2 h-4 w-4" />
            {renderSelectedFiles()}
          </Button>

          {files.length > 1 && (
            <div className="p-3 bg-muted/50 rounded-lg border text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-2 flex items-center"><List className="mr-2 h-4 w-4" /> Daftar File:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                {files.map(file => <li key={file.name}>- {file.name} ({Math.round(file.size / 1024)} KB)</li>)}
              </ul>
            </div>
          )}


          {files.length > 0 && (
            <Button type="submit" disabled={status === 'uploading'}>
              {status === 'uploading' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {`Unggah & Proses ${files.length} File`}
            </Button>
          )}

          {message && (
            <div
              className={cn(
                "mt-2 flex items-start gap-3 rounded-lg p-3 text-sm font-medium",
                status === 'success' && "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
                status === 'error' && "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
              )}
            >
              {status === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
              {status === 'error' && <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
              <span className="whitespace-pre-wrap">{message}</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}