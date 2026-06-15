type Props = {
  text: string;
  align?: "center" | "left";
  variant?: "theme7" | "default";
  subtitle?: string;
  className?: string;
};
export default function HeroTitle({ text, subtitle, align = "center", variant = "default", className = "" }: Props) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  const variantCls =
    variant === "theme7"
      ? "text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-700"
      : "text-3xl sm:text-4xl font-bold";
  return (
    <div className={`max-w-4xl ${alignCls} ${className}`}>
      <h1 className={`${variantCls}`}>{text}</h1>
      {subtitle && <p className="mt-3 text-lg text-slate-600">{subtitle}</p>}
    </div>
  );
}
