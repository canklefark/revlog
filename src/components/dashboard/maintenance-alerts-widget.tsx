import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaintenanceAlertCard } from "@/components/garage/maintenance-alert-card";
import type { MaintenanceAlert } from "@/lib/utils/maintenance-alerts";

type CarSummary = {
  id: string;
  year: number;
  make: string;
  model: string;
  nickname: string | null;
};

type MaintenanceAlertsWidgetProps = {
  data: Array<{
    car: CarSummary;
    alerts: MaintenanceAlert[];
  }>;
};

function carDisplayName(car: CarSummary): string {
  return car.nickname ?? `${car.year} ${car.make} ${car.model}`;
}

export function MaintenanceAlertsWidget({
  data,
}: MaintenanceAlertsWidgetProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map(({ car, alerts }) => (
          <MaintenanceAlertCard
            key={car.id}
            carName={carDisplayName(car)}
            carId={car.id}
            alerts={alerts}
          />
        ))}
      </CardContent>
    </Card>
  );
}
