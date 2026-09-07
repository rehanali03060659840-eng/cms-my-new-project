export const Unauthorized = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold">
          403
        </h1>

        <p className="mt-2 text-zinc-500">
          You don't have permission to access
          this page.
        </p>
      </div>
    </div>
  );
};