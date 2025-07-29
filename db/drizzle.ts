import * as schema1 from "./schema"

import {drizzle} from "drizzle-orm/neon-http";
import {neon, neonConfig} from "@neondatabase/serverless";
import {config} from "dotenv";

import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
// neonConfig.poolQueryViaFetch = true

config({path: ".env.local"});

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, {
  schema: {...schema1},
});