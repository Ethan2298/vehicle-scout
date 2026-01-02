import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Vehicle Scout</CardTitle>
          <CardDescription>
            Track and manage your vehicle information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first vehicle to begin tracking.
          </p>
          <Button>Add Vehicle</Button>
        </CardContent>
      </Card>
    </div>
  );
}
