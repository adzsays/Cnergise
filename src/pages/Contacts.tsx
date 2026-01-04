import { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContacts, Contact } from "@/hooks/useContacts";
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Building, 
  Trash2, 
  Edit,
  User
} from "lucide-react";

const Contacts = () => {
  const { contacts, isLoading, createContact, updateContact, deleteContact } = useContacts();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    notes: "",
  });

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingContact) {
      await updateContact.mutateAsync({ id: editingContact.id, ...formData });
    } else {
      await createContact.mutateAsync(formData);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", company: "", title: "", notes: "" });
    setEditingContact(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      title: contact.title || "",
      notes: contact.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      await deleteContact.mutateAsync(id);
      if (selectedContact?.id === id) {
        setSelectedContact(null);
      }
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return <div className="p-6">Loading contacts...</div>;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-6">
                <div>
                  <h1 className="text-2xl font-bold gradient-heading">Contacts</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your contacts and connections
                  </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingContact(null); resetForm(); }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full">
                        {editingContact ? "Update Contact" : "Add Contact"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </header>

            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                {/* Contacts List */}
                <div className="lg:col-span-1 border-r">
                  <div className="p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-1 p-2">
                      {filteredContacts.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No contacts found
                        </div>
                      ) : (
                        filteredContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                              selectedContact?.id === contact.id ? "bg-accent" : ""
                            }`}
                            onClick={() => setSelectedContact(contact)}
                          >
                            <Avatar>
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{contact.name}</p>
                              {contact.company && (
                                <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Contact Details */}
                <div className="lg:col-span-2 p-6">
                  {selectedContact ? (
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                {getInitials(selectedContact.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h2 className="text-2xl font-bold">{selectedContact.name}</h2>
                              {selectedContact.title && selectedContact.company && (
                                <p className="text-muted-foreground">
                                  {selectedContact.title} at {selectedContact.company}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(selectedContact)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => handleDelete(selectedContact.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4">
                          {selectedContact.email && (
                            <div className="flex items-center gap-3">
                              <Mail className="h-5 w-5 text-muted-foreground" />
                              <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline">
                                {selectedContact.email}
                              </a>
                            </div>
                          )}
                          {selectedContact.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="h-5 w-5 text-muted-foreground" />
                              <a href={`tel:${selectedContact.phone}`} className="hover:underline">
                                {selectedContact.phone}
                              </a>
                            </div>
                          )}
                          {selectedContact.company && (
                            <div className="flex items-center gap-3">
                              <Building className="h-5 w-5 text-muted-foreground" />
                              <span>{selectedContact.company}</span>
                            </div>
                          )}
                          {selectedContact.notes && (
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                              <h3 className="font-medium mb-2">Notes</h3>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {selectedContact.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a contact to view details</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Contacts;
