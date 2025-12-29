import { useState, useRef, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useChatChannels, useChatMessages, ChatChannel } from "@/hooks/useChat";
import { useProfile } from "@/hooks/useProfile";
import { 
  Plus, 
  Hash, 
  Send, 
  Trash2,
  MessageSquare,
  Lock
} from "lucide-react";
import { format } from "date-fns";

const Chat = () => {
  const { channels, isLoading: channelsLoading, createChannel, deleteChannel } = useChatChannels();
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const { messages, isLoading: messagesLoading, sendMessage } = useChatMessages(selectedChannel?.id);
  const { profile } = useProfile();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createChannel.mutateAsync({ 
      name: channelName, 
      description: channelDescription,
      is_private: false 
    });
    if (result) {
      setSelectedChannel(result as ChatChannel);
    }
    setChannelName("");
    setChannelDescription("");
    setIsCreateDialogOpen(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChannel) return;
    
    await sendMessage.mutateAsync({ 
      content: messageInput.trim(),
      senderName: profile?.name || "Anonymous"
    });
    setMessageInput("");
  };

  const handleDeleteChannel = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this channel?")) {
      await deleteChannel.mutateAsync(channelId);
      if (selectedChannel?.id === channelId) {
        setSelectedChannel(null);
      }
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full">
            {/* Channels Sidebar */}
            <div className="w-64 border-r bg-muted/30 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Channels</h2>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Channel</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateChannel} className="space-y-4">
                        <div>
                          <Label htmlFor="channel-name">Channel Name</Label>
                          <Input
                            id="channel-name"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            placeholder="e.g., general"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="channel-desc">Description (optional)</Label>
                          <Input
                            id="channel-desc"
                            value={channelDescription}
                            onChange={(e) => setChannelDescription(e.target.value)}
                            placeholder="What's this channel about?"
                          />
                        </div>
                        <Button type="submit" className="w-full">Create Channel</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {channelsLoading ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
                  ) : channels.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No channels yet. Create one to get started!
                    </div>
                  ) : (
                    channels.map((channel) => (
                      <div
                        key={channel.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer group transition-colors ${
                          selectedChannel?.id === channel.id 
                            ? "bg-accent text-accent-foreground" 
                            : "hover:bg-accent/50"
                        }`}
                        onClick={() => setSelectedChannel(channel)}
                      >
                        {channel.is_private ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Hash className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="flex-1 truncate text-sm">{channel.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteChannel(channel.id, e)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedChannel ? (
                <>
                  {/* Channel Header */}
                  <div className="h-16 border-b flex items-center px-6 bg-background/95 backdrop-blur">
                    <Hash className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <h1 className="font-semibold">{selectedChannel.name}</h1>
                      {selectedChannel.description && (
                        <p className="text-xs text-muted-foreground">{selectedChannel.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <div className="text-center text-muted-foreground">Loading messages...</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div key={message.id} className="flex gap-3 group">
                            <Avatar className="h-9 w-9 mt-0.5">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(message.sender_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-sm">{message.sender_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.created_at), "MMM d, h:mm a")}
                                </span>
                              </div>
                              <p className="text-sm mt-0.5 break-words">{message.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={`Message #${selectedChannel.name}`}
                        className="flex-1"
                      />
                      <Button type="submit" size="icon" disabled={!messageInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h2 className="text-xl font-semibold mb-2">Welcome to Chat</h2>
                    <p>Select a channel or create one to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Chat;
