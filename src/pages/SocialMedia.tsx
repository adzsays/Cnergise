import React, { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  MessageSquare,
  Send,
  Plus,
  RefreshCw,
  Newspaper
} from "lucide-react";
import { NewsFeed } from "@/components/social/NewsFeed";

// Mock data for social media feeds
const instagramPosts = [
  { id: 1, user: "design.studio", avatar: "", content: "New design system release 🎨", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400", likes: 234, comments: 18, time: "2h ago" },
  { id: 2, user: "tech.daily", avatar: "", content: "AI is transforming everything! 🤖", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400", likes: 567, comments: 45, time: "4h ago" },
  { id: 3, user: "startup.life", avatar: "", content: "Monday motivation 💪", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400", likes: 123, comments: 8, time: "6h ago" },
];

const facebookPosts = [
  { id: 1, user: "John Smith", avatar: "", content: "Just launched our new product! Check it out and let me know what you think. #startup #launch", likes: 89, comments: 23, shares: 12, time: "1h ago" },
  { id: 2, user: "Tech Community", avatar: "", content: "Weekly meetup this Friday! Don't miss our guest speaker from Google.", likes: 156, comments: 34, shares: 45, time: "3h ago" },
  { id: 3, user: "Sarah Johnson", avatar: "", content: "Great team dinner last night! 🍕", likes: 67, comments: 12, shares: 3, time: "5h ago" },
];

const twitterPosts = [
  { id: 1, user: "@elonmusk", handle: "Elon Musk", content: "The future is now 🚀", likes: 45000, retweets: 12000, time: "30m ago" },
  { id: 2, user: "@naval", handle: "Naval", content: "Learn to sell. Learn to build. If you can do both, you will be unstoppable.", likes: 8900, retweets: 2300, time: "2h ago" },
  { id: 3, user: "@paulg", handle: "Paul Graham", content: "The best startups come from ideas that seem bad at first.", likes: 5600, retweets: 890, time: "4h ago" },
];

const linkedinPosts = [
  { id: 1, user: "Emily Chen", title: "CEO at TechFlow", content: "Excited to announce our Series B funding! Thank you to everyone who believed in our vision. #startup #funding #grateful", likes: 456, comments: 78, time: "2h ago" },
  { id: 2, user: "Marcus Williams", title: "Product Manager at Google", content: "5 lessons I learned from launching a product to 1M users...", likes: 234, comments: 45, time: "5h ago" },
];

const telegramMessages = [
  { id: 1, channel: "Crypto News", content: "Bitcoin hits new ATH! 📈", members: "125K", time: "10m ago" },
  { id: 2, channel: "Tech Updates", content: "New iOS update rolling out today", members: "89K", time: "25m ago" },
  { id: 3, channel: "Startup Hub", content: "Pitch competition next week - register now!", members: "45K", time: "1h ago" },
];

const whatsappMessages = [
  { id: 1, group: "Work Team", lastMessage: "Meeting at 3pm", sender: "Mike", unread: 3, time: "5m ago" },
  { id: 2, group: "Family", lastMessage: "Happy birthday! 🎂", sender: "Mom", unread: 12, time: "15m ago" },
  { id: 3, group: "Project Alpha", lastMessage: "Deployment successful ✅", sender: "DevOps", unread: 0, time: "1h ago" },
];

const SocialMedia = () => {
  const [activeTab, setActiveTab] = useState("all");

  const SocialPost = ({ platform, children }: { platform: string; children: React.ReactNode }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      {children}
    </Card>
  );

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-[100dvh] w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
        <AppSidebar />
        <SidebarRail />
        
        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="md:hidden h-9 w-9" />
                  <div>
                    <h1 className="text-2xl font-bold gradient-heading">Social Media Hub</h1>
                    <p className="text-sm text-muted-foreground">
                      All your social feeds in one place
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Account
                  </Button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="all">All Feeds</TabsTrigger>
                  <TabsTrigger value="instagram" className="gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </TabsTrigger>
                  <TabsTrigger value="facebook" className="gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </TabsTrigger>
                  <TabsTrigger value="twitter" className="gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter/X
                  </TabsTrigger>
                  <TabsTrigger value="linkedin" className="gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="telegram" className="gap-2">
                    <Send className="h-4 w-4" />
                    Telegram
                  </TabsTrigger>
                  <TabsTrigger value="news" className="gap-2">
                    <Newspaper className="h-4 w-4" />
                    News
                  </TabsTrigger>
                </TabsList>

                {/* All Feeds */}
                <TabsContent value="all">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Instagram Column */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Instagram className="h-5 w-5 text-pink-500" />
                        <h3 className="font-semibold">Instagram</h3>
                      </div>
                      <ScrollArea className="h-[600px]">
                        {instagramPosts.map((post) => (
                          <Card key={post.id} className="mb-4">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{post.user[0].toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-sm">{post.user}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <img src={post.image} alt="" className="w-full h-48 object-cover rounded-md mb-3" />
                              <p className="text-sm mb-2">{post.content}</p>
                              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {post.likes}</span>
                                <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {post.comments}</span>
                                <span className="ml-auto">{post.time}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </ScrollArea>
                    </div>

                    {/* Twitter Column */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Twitter className="h-5 w-5 text-sky-500" />
                        <h3 className="font-semibold">Twitter/X</h3>
                      </div>
                      <ScrollArea className="h-[600px]">
                        {twitterPosts.map((post) => (
                          <Card key={post.id} className="mb-4">
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>{post.handle[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{post.handle}</span>
                                    <span className="text-muted-foreground text-sm">{post.user}</span>
                                  </div>
                                  <p className="mt-1">{post.content}</p>
                                  <div className="flex items-center gap-6 mt-3 text-muted-foreground text-sm">
                                    <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /></span>
                                    <span className="flex items-center gap-1"><RefreshCw className="h-4 w-4" /> {(post.retweets / 1000).toFixed(1)}K</span>
                                    <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {(post.likes / 1000).toFixed(1)}K</span>
                                    <span className="ml-auto">{post.time}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </ScrollArea>
                    </div>

                    {/* LinkedIn Column */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Linkedin className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">LinkedIn</h3>
                      </div>
                      <ScrollArea className="h-[600px]">
                        {linkedinPosts.map((post) => (
                          <Card key={post.id} className="mb-4">
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback>{post.user[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{post.user}</p>
                                  <p className="text-sm text-muted-foreground">{post.title}</p>
                                  <p className="text-xs text-muted-foreground">{post.time}</p>
                                </div>
                              </div>
                              <p className="mt-3 text-sm">{post.content}</p>
                              <div className="flex items-center gap-4 mt-4 text-muted-foreground text-sm border-t pt-3">
                                <Button variant="ghost" size="sm"><Heart className="mr-1 h-4 w-4" /> {post.likes}</Button>
                                <Button variant="ghost" size="sm"><MessageCircle className="mr-1 h-4 w-4" /> {post.comments}</Button>
                                <Button variant="ghost" size="sm"><Share2 className="mr-1 h-4 w-4" /> Share</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {/* WhatsApp & Telegram in sidebar */}
                        <div className="mt-6">
                          <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="h-5 w-5 text-green-500" />
                            <h3 className="font-semibold">WhatsApp</h3>
                          </div>
                          {whatsappMessages.map((msg) => (
                            <Card key={msg.id} className="mb-2">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>{msg.group[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm">{msg.group}</p>
                                      <p className="text-xs text-muted-foreground">{msg.sender}: {msg.lastMessage}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">{msg.time}</p>
                                    {msg.unread > 0 && (
                                      <Badge variant="default" className="mt-1">{msg.unread}</Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>

                {/* Individual Platform Tabs */}
                <TabsContent value="instagram">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {instagramPosts.map((post) => (
                      <Card key={post.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{post.user[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{post.user}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <img src={post.image} alt="" className="w-full h-64 object-cover rounded-md mb-3" />
                          <p className="mb-2">{post.content}</p>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <Button variant="ghost" size="sm"><Heart className="mr-1 h-4 w-4" /> {post.likes}</Button>
                            <Button variant="ghost" size="sm"><MessageCircle className="mr-1 h-4 w-4" /> {post.comments}</Button>
                            <Button variant="ghost" size="sm"><Bookmark className="h-4 w-4" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="facebook">
                  <div className="max-w-2xl mx-auto space-y-4">
                    {facebookPosts.map((post) => (
                      <Card key={post.id}>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{post.user[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{post.user}</p>
                              <p className="text-sm text-muted-foreground">{post.time}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4">{post.content}</p>
                          <div className="flex items-center gap-2 text-muted-foreground border-t pt-3">
                            <Button variant="ghost" className="flex-1"><Heart className="mr-2 h-4 w-4" /> Like ({post.likes})</Button>
                            <Button variant="ghost" className="flex-1"><MessageCircle className="mr-2 h-4 w-4" /> Comment ({post.comments})</Button>
                            <Button variant="ghost" className="flex-1"><Share2 className="mr-2 h-4 w-4" /> Share ({post.shares})</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="twitter">
                  <div className="max-w-xl mx-auto space-y-4">
                    {twitterPosts.map((post) => (
                      <Card key={post.id}>
                        <CardContent className="pt-4">
                          <div className="flex gap-3">
                            <Avatar>
                              <AvatarFallback>{post.handle[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{post.handle}</span>
                                <span className="text-muted-foreground">{post.user}</span>
                                <span className="text-muted-foreground">· {post.time}</span>
                              </div>
                              <p className="mt-2 text-lg">{post.content}</p>
                              <div className="flex items-center justify-between mt-4 text-muted-foreground max-w-md">
                                <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm"><RefreshCw className="mr-1 h-4 w-4" /> {(post.retweets / 1000).toFixed(1)}K</Button>
                                <Button variant="ghost" size="sm"><Heart className="mr-1 h-4 w-4" /> {(post.likes / 1000).toFixed(1)}K</Button>
                                <Button variant="ghost" size="sm"><Bookmark className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm"><Share2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="linkedin">
                  <div className="max-w-2xl mx-auto space-y-4">
                    {linkedinPosts.map((post) => (
                      <Card key={post.id}>
                        <CardContent className="pt-4">
                          <div className="flex gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>{post.user[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{post.user}</p>
                              <p className="text-sm text-muted-foreground">{post.title}</p>
                              <p className="text-xs text-muted-foreground">{post.time}</p>
                            </div>
                          </div>
                          <p className="mt-4">{post.content}</p>
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                            <Button variant="ghost"><Heart className="mr-2 h-4 w-4" /> Like</Button>
                            <Button variant="ghost"><MessageCircle className="mr-2 h-4 w-4" /> Comment</Button>
                            <Button variant="ghost"><RefreshCw className="mr-2 h-4 w-4" /> Repost</Button>
                            <Button variant="ghost"><Send className="mr-2 h-4 w-4" /> Send</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="whatsapp">
                  <div className="max-w-md mx-auto space-y-2">
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-green-500" />
                          WhatsApp Groups
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    {whatsappMessages.map((msg) => (
                      <Card key={msg.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-green-500 text-white">{msg.group[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold">{msg.group}</p>
                                <span className="text-xs text-muted-foreground">{msg.time}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{msg.sender}: {msg.lastMessage}</p>
                            </div>
                            {msg.unread > 0 && (
                              <Badge className="bg-green-500">{msg.unread}</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="telegram">
                  <div className="max-w-md mx-auto space-y-2">
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Send className="h-5 w-5 text-blue-500" />
                          Telegram Channels
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    {telegramMessages.map((msg) => (
                      <Card key={msg.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-blue-500 text-white">{msg.channel[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold">{msg.channel}</p>
                                <span className="text-xs text-muted-foreground">{msg.time}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{msg.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">{msg.members} members</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* News Tab */}
                <TabsContent value="news">
                  <div className="max-w-4xl mx-auto">
                    <NewsFeed />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SocialMedia;
