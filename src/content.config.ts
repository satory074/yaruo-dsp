import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const chapters = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/chapters" }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    chapterLabel: z.string(), // 「第1章」「付録A」など
    summary: z.string(),
    goals: z.array(z.string()).default([]),
    demos: z.array(z.string()).default([]),
  }),
});

export const collections = { chapters };
