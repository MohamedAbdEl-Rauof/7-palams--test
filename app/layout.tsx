import type { Metadata } from "next";
import { Noto_Kufi_Arabic, Tajawal } from "next/font/google";
import { DirectionProvider } from "@/components/ui/direction";
import "./globals.css";

/*
 * Both families are self-hosted at build time by next/font — no runtime request
 * to Google. That matters here: the dashboard renders inside a ClickUp iframe,
 * where a blocked third-party font request would fall back to a Latin face and
 * mangle the Arabic.
 */
const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--font-kufi",
  subsets: ["arabic"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "لوحة نور — تقرير أداء المناديب",
  description: "تقرير أداء المناديب لشركة النخيل السبع التجارية",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${notoKufiArabic.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
         * Radix primitives (Select, Popover, Calendar) read direction from this
         * context, not from the `dir` attribute. Without it, dropdown alignment
         * and arrow-key navigation stay LTR even though the page is RTL.
         */}
        <DirectionProvider dir="rtl">{children}</DirectionProvider>
      </body>
    </html>
  );
}
