import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Welcome to Your Real Estate Platform</h1>
            <p className="text-xl text-muted-foreground">
              Your project is now connected to Supabase and ready for development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Management</CardTitle>
                <CardDescription>
                  Manage your property listings and uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Go to Admin</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact System</CardTitle>
                <CardDescription>
                  Handle customer inquiries and messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">View Messages</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material Orders</CardTitle>
                <CardDescription>
                  Track orders and manage payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">Order Materials</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
