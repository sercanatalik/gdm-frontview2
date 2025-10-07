import { Search as SearchIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export const Search = ({
  handleSubmit,
  inputValue,
  setInputValue,
  submitted,
  handleClear,
  className,
}: {
  handleSubmit: (value: string) => void;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  submitted: boolean;
  handleClear: () => void;
  className?: string;
}) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (inputValue.trim()) {
          handleSubmit(inputValue);
          setInputValue(''); // Clear input after sending
        }
      }}
      className={className || "mb-6"}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Ask about startup unicorns..."
            value={inputValue || ''}
            onChange={(e) => setInputValue(e.target.value)}
            className="pr-10 text-base"
          />
          <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="flex sm:flex-row items-center justify-center gap-2">
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={!inputValue.trim()}
          >
            Send
          </Button>
          {submitted && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="w-full sm:w-auto"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
