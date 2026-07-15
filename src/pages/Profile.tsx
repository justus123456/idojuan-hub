import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import OrderHistory from "@/components/orderHistory";

interface ProfileForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [profile, setProfile] = useState<ProfileForm>({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });
  const [email, setEmail] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        window.location.href = "/user-login.html";
        return;
      }

      setEmail(user.email ?? "");
      const { data, error } = await supabase
        .from("profiles")
        .select("name, phone, address, city, state")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile({
          name: data.name ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
        });
      }

      const { data: savedRows } = await supabase
        .from("saved_properties")
        .select("property_id")
        .eq("user_id", user.id);
      const savedIds = (savedRows || []).map((row) => row.property_id);
      if (savedIds.length) {
        const { data: saved, error: savedError } = await supabase
          .from("properties")
          .select("id, title, location, price, image_urls, images, image_url")
          .in("id", savedIds);
        if (!savedError) setSavedProperties(saved ?? []);
      }
      setLoading(false);
    };

    loadProfile();
  }, []);

  const updateProfile = async () => {
    setSaving(true);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
      window.location.href = "/user-login.html";
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name || email,
        phone: profile.phone || null,
        address: profile.address || null,
        city: profile.city || null,
        state: profile.state || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your details have been saved.",
      });
    }
    setSaving(false);
  };

  const signOut = async () => {
    localStorage.removeItem("user_logged_in");
    await supabase.auth.signOut();
    navigate("/");
  };

  const deleteAccount = async () => {
    toast({
      title: "Delete account",
      description: "Account deletion requires admin privileges in Supabase.",
      variant: "destructive",
    });
  };

  if (loading) {
    return <p className="text-center mt-10">Loading profile...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 mt-20 space-y-6">
      <Card className="p-0 overflow-hidden border-0 shadow-md">
        <div className="h-24 bg-gradient-to-r from-blue-200 via-slate-100 to-orange-100" />
        <div className="px-6 pb-6 -mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white shadow flex items-center justify-center text-xl font-semibold text-blue-700">
              {(profile.name || email || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Welcome,</p>
              <h1 className="text-2xl font-bold">{profile.name || "User"}</h1>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowHistory(true)}>
              View Order History
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Account Details</h2>
              <p className="text-sm text-muted-foreground">Update your delivery and contact information.</p>
            </div>
            <Button variant="outline" onClick={updateProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="080..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Address</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Delivery address"
            />
          </div>
          <div>
            <label className="text-sm font-medium">City</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              placeholder="City"
            />
          </div>
          <div>
            <label className="text-sm font-medium">State</label>
            <input
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              value={profile.state}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              placeholder="State"
            />
          </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={deleteAccount}>
              Delete Account
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold">Saved Properties</h2>
          {savedProperties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved properties yet.</p>
          ) : (
            <div className="space-y-3">
              {savedProperties.map((prop) => {
                const image =
                  (Array.isArray(prop.image_urls) && prop.image_urls[0]) ||
                  (Array.isArray(prop.images) && prop.images[0]) ||
                  prop.image_url ||
                  "/assets/img/placeholder.png";
                return (
                  <div key={prop.id} className="flex gap-3 rounded-lg border p-3">
                    <img
                      src={image}
                      alt={prop.title || "Property"}
                      className="h-20 w-28 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{prop.title || "Property"}</p>
                      <p className="text-sm text-muted-foreground">{prop.location || "Location"}</p>
                      <p className="text-sm font-medium">
                        N{Number(prop.price || 0).toLocaleString("en-NG")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <OrderHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onViewOrder={(order) => {
          if (order?.id) navigate(`/order/${order.id}`);
        }}
      />
    </div>
  );
}
