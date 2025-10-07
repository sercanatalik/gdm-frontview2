"use server";

import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { Config, configSchema, Result } from "./types";


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
      system: 'You are a data visualization expert.',
      prompt: `Given the following data from a SQL query result, generate the chart config that best visualises the data and answers the users query.
For multiple groups use multi-lines.

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
