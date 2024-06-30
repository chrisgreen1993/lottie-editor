export const LayerListSidebar = () => {
  return (
    <div className="border-r bg-muted/40 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Layers</h3>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 hover:bg-muted">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-primary" />
              <span className="text-sm font-medium">Circle</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 hover:bg-muted">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-accent" />
              <span className="text-sm font-medium">Rectangle</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 hover:bg-muted">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-secondary" />
              <span className="text-sm font-medium">Triangle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
