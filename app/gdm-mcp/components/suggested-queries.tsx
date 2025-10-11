import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export const SuggestedQueries = ({
  handleSuggestionClick,
}: {
  handleSuggestionClick: (suggestion: string) => void;
}) => {
  const suggestionQueries = [
    "Show total funding amount by counterparty",
    "Top 10 counterparties by total funding amount",
    "Compare funding amounts across product sub-types",
    "Show average funding amount by product sub-type",
    "Count of trades by counterparty",
    "Distribution of funding amounts by product",
    "Show counterparties with funding over 1 million",
    "Compare number of trades across products",
  ];

  return (
    <motion.div
      key="suggestions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Suggested queries
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestionQueries.map((query, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 text-xs font-normal"
            onClick={() => handleSuggestionClick(query)}
          >
            {query}
          </Badge>
        ))}
      </div>
    </motion.div>
  );
};
