export interface PerspectiveViewerProps {
  className?: string;
  message?: string;
}

export function PerspectiveViewer({
  className = "",
  message = "Perspective viewer has been removed from this project.",
}: PerspectiveViewerProps) {
  return (
    <div className={`flex h-full items-center justify-center text-sm text-muted-foreground ${className}`}>
      {message}
    </div>
  );
}