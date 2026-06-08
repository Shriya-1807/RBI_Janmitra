import { getIconGuides } from "@/lib/iconGuides";
import { useUserPreferences } from "@/lib/store";

interface PageIconGuideProps {
  page: "home" | "chatbot" | "frauds" | "settings";
}

export default function PageIconGuide({ page }: PageIconGuideProps) {
  const { language } = useUserPreferences();
  const guides = getIconGuides(language, page);

  if (!guides || guides.length === 0) return null;

  return (
    <div className="w-full py-3 px-4 bg-muted/40 backdrop-blur-sm border border-border/60 rounded-xl my-3 shadow-sm transition-all hover:shadow">
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8">
        {guides.map((guide, idx) => (
          <div key={idx} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-[hsl(224,65%,95%)] dark:bg-[hsl(224,65%,20%)] flex items-center justify-center shadow-sm border border-border/30 group-hover:scale-110 transition-transform">
              <span className="text-base leading-none">{guide.icon}</span>
            </div>
            <span className="text-xs font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
              {guide.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
