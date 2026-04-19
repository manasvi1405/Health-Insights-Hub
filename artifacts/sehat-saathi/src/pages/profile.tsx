import { useState, useEffect } from "react";
import { User, LogOut, UserCircle, Phone, Activity, MapPin, Globe, Save, Loader2, Users, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useUpdateMe, useListContacts, useCreateContact, useDeleteContact, getGetMeQueryKey, getListContactsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

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
    language: "en"
  });

  const [showAddContact, setShowAddContact] = useState(false);
  const [contactData, setContactData] = useState({ name: "", phone: "", relation: "" });

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name || "",
        age: user.age ? String(user.age) : "",
        bloodGroup: user.bloodGroup || "",
        address: user.address || "",
        language: user.language || "en"
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
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setIsEditing(false);
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update profile", variant: "destructive" });
    }
  };

  const handleAddContact = async () => {
    if (!contactData.name || contactData.phone.length < 10) {
      toast({ title: "Invalid Input", description: "Please provide valid name and phone number", variant: "destructive" });
      return;
    }
    
    try {
      await createContactMutation.mutateAsync({
        data: {
          name: contactData.name,
          phone: contactData.phone,
          relation: contactData.relation
        }
      });
      queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
      setShowAddContact(false);
      setContactData({ name: "", phone: "", relation: "" });
      toast({ title: "Success", description: "Contact added" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add contact", variant: "destructive" });
    }
  };

  const handleDeleteContact = async (id: string) => {
    if(!confirm("Remove this emergency contact?")) return;
    try {
      await deleteContactMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete contact", variant: "destructive" });
    }
  }

  if (isAuthLoading) {
    return (
      <div className="space-y-6 pt-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 pb-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <Button variant="ghost" size="icon" onClick={logout} className="text-slate-400 hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-7 h-7" />
        </Button>
      </header>

      {/* Main Profile Card */}
      <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-primary h-20 w-full"></div>
        <CardContent className="p-6 relative pt-0">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-slate-50 absolute -top-10 shadow-md">
            <UserCircle className="w-16 h-16 text-slate-300" />
          </div>
          
          <div className="mt-14 space-y-5">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{user?.name || "No Name"}</h2>
                <p className="text-slate-500 flex items-center mt-1"><Phone className="w-4 h-4 mr-2" /> +91 {user?.phone}</p>
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 animate-in fade-in pt-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Group</Label>
                    <Select value={formData.bloodGroup} onValueChange={(v) => setFormData({...formData, bloodGroup: v})}>
                      <SelectTrigger className="h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>App Language</Label>
                  <Select value={formData.language} onValueChange={(v) => setFormData({...formData, language: v})}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिन्दी</SelectItem>
                      <SelectItem value="mr">मराठी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 h-14" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button className="flex-1 h-14" onClick={handleSaveProfile} disabled={updateMeMutation.isPending}>
                    {updateMeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-y-4 pt-2">
                <div className="flex items-center text-slate-700">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Health Info</p>
                    <p className="text-lg">{user?.age ? `${user.age} yrs` : '-'} • {user?.bloodGroup || 'Blood group not set'}</p>
                  </div>
                </div>
                <div className="flex items-center text-slate-700">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Address</p>
                    <p className="text-lg">{user?.address || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center text-slate-700">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mr-4">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Language</p>
                    <p className="text-lg uppercase">{user?.language || 'en'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <div>
        <div className="flex justify-between items-center mb-4 mt-8">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Emergency Contacts
          </h2>
          {!showAddContact && (
            <Button variant="outline" size="sm" onClick={() => setShowAddContact(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          )}
        </div>

        {showAddContact && (
          <Card className="border-2 border-primary/20 mb-4 bg-blue-50/50">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input value={contactData.name} onChange={e => setContactData({...contactData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input type="tel" value={contactData.phone} onChange={e => setContactData({...contactData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Relation (e.g. Son, Daughter)</Label>
                <Input value={contactData.relation} onChange={e => setContactData({...contactData, relation: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddContact(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleAddContact} disabled={createContactMutation.isPending}>Save</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {isContactsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : contacts && contacts.length > 0 ? (
            contacts.map(contact => (
              <Card key={contact._id} className="border border-slate-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{contact.name}</h3>
                      <p className="text-slate-600">{contact.relation ? `${contact.relation} • ` : ''}{contact.phone}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteContact(contact._id)} className="text-slate-400 hover:text-destructive">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed">
              No emergency contacts added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
