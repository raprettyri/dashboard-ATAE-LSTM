"use client";

import {R2ImageViewer} from "@/components/r2-image-viewer";
import {AspectPieCharts} from "@/components/aspect-pie-charts";
import {SentimentChart} from "@/components/sentiment-chart";
import {SentimentPieCharts} from "@/components/sentiment-pie-charts";
import * as React from "react";
import { AggregatedSentimentPieCharts } from "@/components/aggregated-sentiment-pie-charts";
import { SentimentAnalyzer } from "@/components/sentiment-analyzer";
// import { JsonUploader } from "@/components/JsonUploader";

export default function SentimentDashboard() {
    return (
        <main className="flex flex-col p-4 sm:p-8">
            <header className="text-center py-8 md:py-12">
                <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
                    Dasbor Ulasan Google Play Store terhadap Platform Media Sosial
                </h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
                    Sekumpulan informasi terkait sentimen pengguna platform media sosial, membantu Anda langsung
                    mengenali platform mana yang paling disukai dan sesuai kebutuhan Anda.
                </p>
            </header>

            <div className="flex flex-col gap-8">
                <AggregatedSentimentPieCharts/>
                <SentimentChart/>
                <SentimentPieCharts/>
                <AspectPieCharts/>
                <hr/>
                <R2ImageViewer/>
                <hr/>
                <SentimentAnalyzer />
                {/*<JsonUploader />*/}
            </div>
        </main>
    );
}