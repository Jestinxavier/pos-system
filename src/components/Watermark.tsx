export default function Watermark() {
  return (
    <div className="fixed bottom-3 right-4 z-50 pointer-events-none">
      <p className="text-[10px] sm:text-xs text-muted-foreground/70 tracking-wide">
        Created by Jestin Xavier
      </p>
    </div>
  );
}
