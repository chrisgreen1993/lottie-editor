export const EditLayerSidebar = () => {
  return (
    <div className="border-l bg-muted/40 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Edit Layer</h3>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-md bg-background px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-primary" />
              <span className="text-sm font-medium">Fill</span>
            </div>
            <div className="flex items-center gap-2">
              <div />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md bg-background px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-accent" />
              <span className="text-sm font-medium">Stroke</span>
            </div>
            <div className="flex items-center gap-2">
              <div />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
