import { useState, useEffect } from "react";
import { User, LogOut, UserCircle, Phone, Activity, MapPin, Globe, Save, Loader2, Users, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useUpdateMe, useListContacts, useCreateContact, useDeleteContact, getGetMeQueryKey, getListContactsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { setAppLanguage } from "@/hooks/use-t";

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "हिन्दी (Hindi)" },
  { value: "Marathi", label: "मराठी (Marathi)" },
  { value: "Tamil", label: "தமிழ் (Tamil)" },
  { value: "Bengali", label: "বাংলা (Bengali)" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function Profile() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMeMutation = useUpdateMe();
  const { data: contacts, isLoading: isContactsLoading } = useListContacts();
  const createContactMutation = useCreateContact();
  const deleteContactMutation = useDeleteContact();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    bloodGroup: "",
    address: "",
    language: "English"
  });
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactData, setContactData] = useState({ name: "", phone: "", relation: "", isPrimary: false });

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name || "",
        age: user.age ? String(user.age) : "",
        bloodGroup: user.bloodGroup || "",
        address: user.address || "",
        language: user.language || "English"
      });
    }
  }, [user, isEditing]);

  const handleSaveProfile = async () => {
    try {
      await updateMeMutation.mutateAsync({
        data: {
          name: formData.name,
          age: parseInt(formData.age, 10) || undefined,
          bloodGroup: formData.bloodGroup,
          address: formData.address,
          language: formData.language
        }
      });
      // Update localStorage language too so app language changes immediately
      setAppLanguage(formData.language);
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setIsEditing(false);
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update profile", variant: "destructive" });
    }
  };

  const handleAddContact = async () => {
    if (!contactData.name || contactData.phone.length < 10) {
      toast({ title: "Invalid Input", description: "Please enter valid name and 10-digit phone number", variant: "destructive" });
      return;
    }
    try {
      await createContactMutation.mutateAsync({
        data: { name: contactData.name, phone: contactData.phone, relation: contactData.relation, isPrimary: contactData.isPrimary }
      });
      queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
      setShowAddContact(false);
      setContactData({ name: "", phone: "", relation: "", isPrimary: false });
      toast({ title: "Contact added!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add contact", variant: "destructive" });
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Remove this emergency contact?")) return;
    try {
      await deleteContactMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
      toast({ title: "Contact removed" });
    } catch {
      toast({ title: "Error", description: "Failed to delete contact", variant: "destructive" });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-60 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <Button variant="ghost" size="sm" onClick={logout} className="text-red-500 hover:bg-red-50 gap-2 font-semibold">
          <LogOut className="w-5 h-5" /> Logout
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="h-24 bg-gradient-to-r from-primary to-blue-400" />
        <CardContent className="p-5 pt-0 relative">
          <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-md absolute -top-10 left-5 flex items-center justify-center">
            <UserCircle className="w-14 h-14 text-primary" />
          </div>
          <div className="pt-12">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{user?.name || "Add your name"}</h2>
                <p className="text-slate-500 text-base mt-0.5 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> +91 {user?.phone}
                </p>
              </div>
              {!isEditing && (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-2 border-primary text-primary">
                  <Edit2 className="w-4 h-4" /> Edit
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form or Info Display */}
      {isEditing ? (
        <Card className="border border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-primary">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Full Name</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-13 text-lg" placeholder="Your name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Age</Label>
                <Input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className="h-13 text-lg" placeholder="e.g. 65" />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold">Blood Group</Label>
                <Select value={formData.bloodGroup} onValueChange={v => setFormData({ ...formData, bloodGroup: v })}>
                  <SelectTrigger className="h-13"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">Address</Label>
              <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="h-13 text-lg" placeholder="Your address" />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">App Language</Label>
              <Select value={formData.language} onValueChange={v => setFormData({ ...formData, language: v })}>
                <SelectTrigger className="h-13 text-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value} className="text-base py-3">{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500">Changing language will update AI responses too</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-13" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button className="flex-1 h-13 text-lg" onClick={handleSaveProfile} disabled={updateMeMutation.isPending}>
                {updateMeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4 py-2 border-b border-slate-100">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Age & Blood Group</p>
                <p className="text-lg font-semibold text-slate-900">
                  {user?.age ? `${user.age} years` : "Age not set"} &bull; {user?.bloodGroup || "Blood group not set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-2 border-b border-slate-100">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Address</p>
                <p className="text-lg font-semibold text-slate-900">{user?.address || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">App Language</p>
                <p className="text-lg font-semibold text-slate-900">{user?.language || "English"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contacts */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Emergency Contacts
          </h2>
          {!showAddContact && (
            <Button size="sm" onClick={() => setShowAddContact(true)} className="gap-1">
              <Plus className="w-4 h-4" /> Add
            </Button>
          )}
        </div>

        {showAddContact && (
          <Card className="border-2 border-primary/30 bg-blue-50/40 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg">New Emergency Contact</h3>
              <div className="space-y-2">
                <Label className="font-semibold">Full Name</Label>
                <Input value={contactData.name} onChange={e => setContactData({ ...contactData, name: e.target.value })} placeholder="e.g. Rahul Kumar" className="h-13" />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Phone Number</Label>
                <Input type="tel" value={contactData.phone} onChange={e => setContactData({ ...contactData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit number" className="h-13" />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Relation</Label>
                <Input value={contactData.relation} onChange={e => setContactData({ ...contactData, relation: e.target.value })} placeholder="e.g. Son, Daughter, Wife" className="h-13" />
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 h-13" onClick={() => setShowAddContact(false)}>Cancel</Button>
                <Button className="flex-1 h-13" onClick={handleAddContact} disabled={createContactMutation.isPending}>
                  {createContactMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Save Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isContactsLoading ? (
          <Skeleton className="h-20 w-full rounded-2xl" />
        ) : contacts && contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.map(contact => (
              <Card key={contact._id} className="border border-slate-200 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{contact.name}</h3>
                        {contact.isPrimary && <Badge className="text-xs bg-primary">Primary</Badge>}
                      </div>
                      <p className="text-slate-600 text-base">{contact.relation && `${contact.relation} · `}+91 {contact.phone}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteContact(contact._id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium">No emergency contacts yet</p>
            <p className="text-sm mt-1">Add family members or caregivers</p>
          </div>
        )}
      </div>
    </div>
  );
}
