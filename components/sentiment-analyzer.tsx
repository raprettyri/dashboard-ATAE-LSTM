"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";

type AnalysisResult = {
    [key: string]: string;
};

// Komponen Textarea sederhana jika belum ada di UI Anda
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                ref={ref}
                {...props}
            />
        );
    }
);
Textarea.displayName = "Textarea";


export function SentimentAnalyzer() {
    const [reviewText, setReviewText] = React.useState<string>("");
    const [results, setResults] = React.useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!reviewText.trim()) {
            setError("Silakan masukkan ulasan terlebih dahulu.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults(null);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reviewText }),
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Terjadi kesalahan saat menganalisis.');
            }

            setResults(data);
        } catch (err: any) {
            setError(err.message || 'Gagal terhubung ke server analisis.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Analisis Sentimen Ulasan</CardTitle>
                <CardDescription>
                    Masukkan teks ulasan untuk dianalisis sentimennya berdasarkan beberapa aspek menggunakan model ATAE-LSTM.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Textarea
                        placeholder="Contoh: Aplikasinya bagus, visualnya keren tapi sering lag..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        disabled={isLoading}
                        rows={4}
                    />
                    <Button type="submit" disabled={isLoading || !reviewText.trim()}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? "Menganalisis..." : "Analisis Sentimen"}
                    </Button>
                </form>

                {error && (
                    <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        <p className="font-semibold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {results && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold">Hasil Analisis:</h3>
                        <div className="mt-2 space-y-2 rounded-md border p-4">
                            {Object.entries(results).map(([aspect, sentiment]) => (
                                <div key={aspect} className="flex justify-between items-center text-sm sm:text-base">
                                    <span className="font-medium capitalize">{aspect}</span>
                                    <span className="text-right">{sentiment}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}