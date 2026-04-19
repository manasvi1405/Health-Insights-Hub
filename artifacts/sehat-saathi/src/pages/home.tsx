import { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetHomeSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, Clock, FileText, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetHomeSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="pt-2 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {summary?.greeting || `Hello, ${user?.name || 'Friend'}!`}
        </h1>
        <p className="text-lg text-slate-500 mt-1">Here is your daily health summary</p>
      </header>

      {/* Due Medications */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" /> Due Medications
          </h2>
          <Link href="/reminders" className="text-primary font-semibold">View All</Link>
        </div>
        
        {summary?.dueMedications && summary.dueMedications.length > 0 ? (
          <div className="space-y-3">
            {summary.dueMedications.map(med => (
              <Card key={med._id} className="border-2 border-primary/20 shadow-sm hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{med.medName}</h3>
                    <p className="text-slate-600">{med.dosage} • {med.frequency}</p>
                  </div>
                  <Link href="/reminders">
                    <div className="bg-primary text-white px-4 py-2 rounded-lg font-bold">Take</div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-50 border-dashed border-2">
            <CardContent className="p-6 text-center text-slate-500">
              <Bell className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-lg">No medications due right now.</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Low Stock Alerts */}
      {summary?.lowStockAlerts && summary.lowStockAlerts.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-destructive flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6" /> Low Stock Alerts
          </h2>
          <div className="space-y-3">
            {summary.lowStockAlerts.map(med => (
              <Card key={med._id} className="border-2 border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{med.medName}</h3>
                    <p className="text-destructive font-medium">Only {med.stockCount} left!</p>
                  </div>
                  <Badge variant="destructive" className="text-sm px-3 py-1">Buy More</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recent Scans */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Camera className="w-6 h-6 text-primary" /> Recent Scans
        </h2>
        {summary?.recentScans && summary.recentScans.length > 0 ? (
          <div className="space-y-3">
            {summary.recentScans.map(scan => (
              <Card key={scan._id} className="border border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold capitalize">{scan.type} Scan</h3>
                    <span className="text-xs text-slate-400 ml-auto">
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-2">{scan.summary || "No summary available."}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-50 border-dashed border-2">
            <CardContent className="p-6 text-center text-slate-500">
              <p className="text-lg">No recent scans.</p>
              <Link href="/scan">
                <div className="mt-4 text-primary font-bold">Scan Document</div>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
