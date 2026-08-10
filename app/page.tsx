import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder shell for Phase 1. The real dashboard is built in Phase 4.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <h1 className="text-3xl font-bold text-primary">لوحة نور</h1>
      <p className="mt-2 text-muted-foreground">
        شركة النخيل السبع التجارية — تقرير أداء المناديب
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>التحقق من الإعداد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            هذا النص بخط Tajawal، والعناوين بخط Noto Kufi Arabic. الأرقام تبقى
            لاتينية: 1234567890
          </p>
          <div className="flex gap-3 pt-2">
            <span className="rounded-md bg-success px-3 py-1 text-white">
              مكتمل
            </span>
            <span className="rounded-md bg-warning px-3 py-1 text-black">
              متبقي
            </span>
            <span className="rounded-md bg-danger px-3 py-1 text-white">
              إخفاقات
            </span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
