import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export const SuggestedQueries = ({
  handleSuggestionClick,
}: {
  handleSuggestionClick: (suggestion: string) => void;
}) => {
  const suggestionQueries = [
    {
      desktop: "Show total funding amount by counterparty",
      mobile: "By counterparty",
    },
    {
      desktop: "Compare funding amounts across different product sub-types",
      mobile: "By product",
    },
    {
      desktop: "Top 10 counterparties by total funding amount",
      mobile: "Top 10 counterparties",
    },
    {
      desktop: "Show average funding amount by product sub-type",
      mobile: "Avg by product",
    },
    {
      desktop: "Count of trades by counterparty",
      mobile: "Trade count",
    },
    {
      desktop: "Distribution of funding amounts by product sub-type",
      mobile: "Funding distribution",
    },
    {
      desktop: "Show counterparties with funding over 1 million",
      mobile: "High funding",
    },
    {
      desktop: "Compare number of trades across product sub-types",
      mobile: "Trades by product",
    },
    {
      desktop: "Show funding amount summary by counterparty and product sub-type",
      mobile: "Summary view",
    },
    {
      desktop: "List counterparties with the highest average funding",
      mobile: "Top avg funding",
    },
    {
      desktop: "Show total and average funding by product sub-type",
      mobile: "Product stats",
    },
  ];

  return (
    <motion.div
      key="suggestions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
        Try these queries:
      </h2>
      <div className="flex flex-wrap gap-2">
        {suggestionQueries.map((suggestion, index) => (
          <Button
            key={index}
            className={index > 5 ? "hidden sm:inline-block" : ""}
            type="button"
            variant="outline"
            onClick={() => handleSuggestionClick(suggestion.desktop)}
          >
            <span className="sm:hidden">{suggestion.mobile}</span>
            <span className="hidden sm:inline">{suggestion.desktop}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
};
