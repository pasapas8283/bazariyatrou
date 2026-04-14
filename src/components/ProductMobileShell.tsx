type ProductMobileShellProps = {
  children: React.ReactNode;
};

export default function ProductMobileShell({
  children,
}: ProductMobileShellProps) {
  return (
    <div className="w-full overflow-x-hidden bg-white max-md:min-h-dvh max-md:mx-0 max-md:max-w-none max-md:rounded-none max-md:border-0 max-md:shadow-none md:mx-auto md:max-w-5xl md:overflow-hidden md:rounded-2xl md:border-0 md:shadow-none">
      {children}
    </div>
  );
}
