"use server";

import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText } from "ai";
import { Config, configSchema, Result } from "./types";
import fs from "fs";
import path from "path";


/**
 * Server action: Generate chart configuration from query results
 * @param results - Query results to visualize
 * @param userQuery - Original user query for context
 * @returns Object containing chart configuration
 */
export async function generateChartConfig(
  results: Result[],
  userQuery: string
): Promise<{ config: Config }> {
  "use server";
  return generateChartConfigService(results, userQuery);
}


/**
 * Generates chart configuration based on query results
 * @param results - Query results to visualize
 * @param userQuery - Original user query for context
 * @returns Chart configuration object
 * @throws Error if config generation fails
 */
export async function generateChartConfigService(
  results: Result[],
  userQuery: string
): Promise<{ config: Config }> {
  try {
    const { object: config } = await generateObject({
      model: anthropic("claude-3-5-sonnet-20241022"),
      system: 'You are a data visualization expert. Use pie charts for distributions and proportions, bar charts for comparisons, line charts for trends over time, and multi-line charts for multiple groups over time. Use concise keys and ensure clarity.',
      prompt: `Given the following data from a SQL query result, generate the chart config that best visualises the data and answers the users query.
For multiple groups use multi-lines.U se pie charts for distributions and proportions, bar charts for comparisons, line charts for trends over time, and multi-line charts for multiple groups over time.

Here is an example complete config:
export const chartConfig = {
  type: "pie",
  xKey: "month",
  yKeys: ["sales", "profit", "expenses"],
  colors: {
    sales: "#4CAF50",    // Green for sales
    profit: "#2196F3",   // Blue for profit
    expenses: "#F44336"  // Red for expenses
  },
  legend: true
}

User Query:
${userQuery} 

Data:
${JSON.stringify(results, null, 2)}`,
      schema: configSchema,
    });

    // Generate color mappings using chart theme variables
    const colors: Record<string, string> = {};
    config.yKeys.forEach((key: string, index: number) => {
      colors[key] = `hsl(var(--chart-${index + 1}))`;
    });

    const updatedConfig: Config = { ...config, colors };
    return { config: updatedConfig };
  } catch (error: any) {
    console.error("Chart config generation error:", error.message);
    throw new Error("Failed to generate chart configuration");
  }
}


/**
 * Server action: Generate text summary
 * @param text - Text to summarize
 * @returns Object containing the summary
 */
export async function generateSummariseText(
  text: string
): Promise<{ summary: string }> {
  "use server";
  return generateSummariseTextService(text);
}


/**
 * Service function: Generate text summary
 * @param text - Text to summarize
 * @returns Object containing the summary
 * @throws Error if summarization fails
 */
export async function generateSummariseTextService(
  text: string
): Promise<{ summary: string }> {
  try {
    const { text: summary } = await generateText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      system: 'You are a text summarization expert. Provide concise, professional summaries while preserving key information and context. Format your summary in markdown.',
      prompt: `Please provide a concise summary of the following content. Focus on the key points and main findings. Keep the summary clear and professional, suitable for an email report.

Content to summarize:
${text}

Please format your summary in markdown.`,
    });

    return { summary };
  } catch (error: any) {
    console.error("Text summarization error:", error.message);
    throw new Error("Failed to generate text summary");
  }
}


/**
 * Server action: Generate email subject line
 * @param text - Text content to generate subject from
 * @returns Object containing the subject line
 */
export async function generateSubjectForEmail(
  text: string
): Promise<{ subject: string }> {
  "use server";
  return generateSubjectForEmailService(text);
}


/**
 * Service function: Generate email subject line
 * @param text - Text content to generate subject from
 * @returns Object containing the subject line
 * @throws Error if subject generation fails
 */
export async function generateSubjectForEmailService(
  text: string
): Promise<{ subject: string }> {
  try {
    const { text: subject } = await generateText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      system: 'You are an email subject line expert. Generate concise, professional, and compelling subject lines that accurately reflect the email content. Keep subject lines under 60 characters.',
      prompt: `Generate a professional email subject line for the following content. The subject line should be concise, clear, and capture the main topic or purpose. Do not use quotes or special formatting - just return the plain subject line text.

Content:
${text}`,
    });

    return { subject: subject.trim() };
  } catch (error: any) {
    console.error("Email subject generation error:", error.message);
    throw new Error("Failed to generate email subject");
  }
}


/**
 * Server action: Save PNG file to /public/tmp folder
 * @param base64Data - Base64 encoded PNG data
 * @param filename - Filename for the PNG file
 * @returns Object containing the saved file path
 */
export async function savePNGToPublic(
  base64Data: string,
  filename: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  "use server";

  try {
    // Remove the data URL prefix if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");

    // Ensure the filename is safe
    const safeFilename = filename.replace(/[^a-z0-9_\-\.]/gi, '_');

    // Ensure the tmp directory exists
    const tmpDir = path.join(process.cwd(), "public", "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Save to public/tmp folder
    const publicPath = path.join(tmpDir, safeFilename);
    fs.writeFileSync(publicPath, buffer);

    return {
      success: true,
      path: `/tmp/${safeFilename}`
    };
  } catch (error: any) {
    console.error("Error saving PNG:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
