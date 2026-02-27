/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Plane, Info, Globe, Menu, ChevronRight, Heart, Share2, Download, Compass, ArrowRight, Instagram, Twitter, Facebook, Sparkles, Music, Utensils, MessageSquare, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { io, Socket } from 'socket.io-client';
import { getCountryGuide, getRealTimeTravelInfo, planItinerary, searchPlacesNearby } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'explore' | 'itinerary' | 'transport' | 'nearby' | 'community';

interface Comment {
  id: number;
  place: string;
  user: string;
  message: string;
  timestamp: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [itineraryDays, setItineraryDays] = useState(5);
  const [interests, setInterests] = useState('Adventure, Sights, Local Food, Nightlife');
  const [heroImage, setHeroImage] = useState<string | null>(null);
  
  // Community State
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('Roamer_' + Math.floor(Math.random() * 1000));
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    }

    // Initialize Socket.io
    socketRef.current = io();
    
    socketRef.current.on('new_comment', (comment: Comment) => {
      setComments((prev) => [comment, ...prev]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (searchQuery && socketRef.current) {
      const place = searchQuery.toLowerCase();
      socketRef.current.emit('join_place', place);
      
      // Fetch existing comments
      fetch(`/api/comments/${encodeURIComponent(place)}`)
        .then(res => res.json())
        .then(data => setComments(data))
        .catch(err => console.error("Failed to fetch comments", err));
    }
  }, [searchQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    setLoading(true);
    setResult(null);
    const seed = encodeURIComponent(searchQuery.toLowerCase());
    setHeroImage(`https://loremflickr.com/1200/600/${seed},vacation,fun,adventure/all`);

    try {
      let res = '';
      if (activeTab === 'explore') {
        res = await getCountryGuide(searchQuery);
      } else if (activeTab === 'transport') {
        res = await getRealTimeTravelInfo('Current Location', searchQuery);
      } else if (activeTab === 'itinerary') {
        res = await planItinerary(searchQuery, itineraryDays, interests);
      } else if (activeTab === 'nearby') {
        res = await searchPlacesNearby(searchQuery, userLocation?.lat, userLocation?.lng);
      }
      setResult(res);
    } catch (error) {
      console.error(error);
      setResult("We couldn't reach the travel spirits. Please try again! 🌿");
    } finally {
      setLoading(false);
    }
  };

  const sendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !searchQuery) return;

    socketRef.current?.emit('send_comment', {
      place: searchQuery.toLowerCase(),
      user: userName,
      message: newComment
    });
    setNewComment('');
  };

  const tabs = [
    { id: 'explore', label: 'Discover', icon: Globe, color: 'text-accent-terracotta' },
    { id: 'itinerary', label: 'Journeys', icon: Calendar, color: 'text-accent-sage' },
    { id: 'transport', label: 'Intelligence', icon: Plane, color: 'text-accent-azure' },
    { id: 'community', label: 'Community', icon: MessageSquare, color: 'text-accent-sage' },
  ];

  const featuredPlaces = [
    { title: "Paris", country: "France", img: "https://loremflickr.com/600/400/paris,vacation,fun", desc: "The city of lights and romance." },
    { title: "Tokyo", country: "Japan", img: "https://loremflickr.com/600/400/tokyo,party,fun", desc: "A neon-lit blend of future and past." },
    { title: "New York", country: "USA", img: "https://loremflickr.com/600/400/nyc,vacation,fun", desc: "The city that never sleeps." },
    { title: "Bali", country: "Indonesia", img: "https://loremflickr.com/600/400/bali,beach,party", desc: "Tropical paradise and spiritual retreat." },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-6xl mx-auto bg-warm-bg">
      {/* Header */}
      <header className="px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-stone-100 bg-white/50 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent-terracotta rounded-full flex items-center justify-center text-white shadow-lg">
            <Compass size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-text-main">
              Rinniee<span className="text-accent-terracotta">Roams</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Roam the World Together</p>
          </div>
        </div>
        
        <nav className="flex gap-2 md:gap-4 pill-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as Tab);
                  if (tab.id !== 'community') setResult(null);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-bold uppercase tracking-wider",
                  isActive ? "bg-accent-terracotta text-white shadow-md" : "text-text-muted hover:bg-stone-50"
                )}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] overflow-hidden">
          <img 
            src={heroImage || "https://loremflickr.com/1200/800/vacation,fun,beach"} 
            alt="Travel Hero"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl"
            >
              <h2 className="text-5xl md:text-7xl font-display text-white mb-6 drop-shadow-lg">
                {searchQuery ? `Roam ${searchQuery}` : "Where Will You Roam?"}
              </h2>
              
              <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder="Enter a city or country..."
                  className="w-full bg-white/95 border-none p-6 pl-14 pr-32 rounded-full text-text-main shadow-2xl outline-none focus:ring-4 focus:ring-accent-terracotta/20 transition-all text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-accent-terracotta" size={24} />
                <button 
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-accent-terracotta text-white px-8 py-3 rounded-full font-bold hover:bg-accent-terracotta/90 transition-all shadow-lg"
                >
                  {loading ? '...' : 'Roam'}
                </button>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Content Area */}
        <section className="px-8 py-16">
          <AnimatePresence mode="wait">
            {activeTab === 'community' ? (
              <motion.div 
                key="community"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className="vibrant-card p-8 bg-white">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-display">Community Roams</h2>
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <User size={16} />
                      <span>Posting as: <strong>{userName}</strong></span>
                    </div>
                  </div>

                  {!searchQuery ? (
                    <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                      <MessageSquare size={48} className="mx-auto text-stone-300 mb-4" />
                      <p className="text-text-muted">Search for a place to see what others are saying!</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <form onSubmit={sendComment} className="flex gap-4">
                        <input 
                          type="text" 
                          placeholder={`Share a tip about ${searchQuery}...`}
                          className="flex-1 bg-stone-50 border border-stone-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent-terracotta/20 transition-all"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button 
                          type="submit"
                          className="bg-accent-terracotta text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-accent-terracotta/90 transition-all"
                        >
                          <Send size={18} />
                          <span>Send</span>
                        </button>
                      </form>

                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {comments.length === 0 ? (
                          <p className="text-center text-text-muted py-8 italic">No messages yet. Be the first to share your roam!</p>
                        ) : (
                          comments.map((c) => (
                            <motion.div 
                              key={c.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-4 bg-stone-50 rounded-2xl border border-stone-100"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-accent-terracotta text-sm">{c.user}</span>
                                <span className="text-[10px] text-text-muted uppercase tracking-wider">
                                  {new Date(c.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-text-main leading-relaxed">{c.message}</p>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-16 h-16 border-4 border-accent-terracotta/20 border-t-accent-terracotta rounded-full animate-spin" />
                <p className="mt-6 text-lg font-serif italic text-accent-terracotta">Mapping your journey...</p>
              </motion.div>
            ) : result ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12"
              >
                <div className="lg:col-span-8">
                  <div className="vibrant-card p-10">
                    <div className="markdown-body">
                      <Markdown>{result}</Markdown>
                    </div>
                  </div>
                </div>
                
                <aside className="lg:col-span-4 space-y-8">
                  <div className="vibrant-card p-8 bg-accent-sage/5 border-accent-sage/10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-accent-sage mb-6 flex items-center gap-2">
                      <Sparkles size={16} /> Travel Intelligence
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                        <Plane className="text-accent-azure" size={24} />
                        <div>
                          <p className="text-xs font-bold uppercase text-text-muted">Best Flights</p>
                          <p className="text-sm font-semibold">Check real-time fares</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                        <Utensils className="text-accent-terracotta" size={24} />
                        <div>
                          <p className="text-xs font-bold uppercase text-text-muted">Local Cuisine</p>
                          <p className="text-sm font-semibold">Must-try dishes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="vibrant-card p-8 bg-accent-terracotta text-white">
                    <MessageSquare size={32} className="mb-4" />
                    <h4 className="text-2xl font-display italic mb-2">Join the Conversation</h4>
                    <p className="text-sm font-light opacity-90 mb-4">
                      See what other roamers are saying about {searchQuery}. Share your own tips to help the community!
                    </p>
                    <button 
                      onClick={() => setActiveTab('community')}
                      className="w-full bg-white text-accent-terracotta py-3 rounded-xl font-bold hover:bg-stone-50 transition-all"
                    >
                      Go to Community
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Snapshots of {searchQuery}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <img src={`https://loremflickr.com/400/400/${searchQuery.toLowerCase()},vacation/all?lock=1`} className="rounded-xl object-cover aspect-square" referrerPolicy="no-referrer" />
                      <img src={`https://loremflickr.com/400/400/${searchQuery.toLowerCase()},fun/all?lock=2`} className="rounded-xl object-cover aspect-square" referrerPolicy="no-referrer" />
                      <img src={`https://loremflickr.com/400/400/${searchQuery.toLowerCase()},party/all?lock=3`} className="rounded-xl object-cover aspect-square" referrerPolicy="no-referrer" />
                      <img src={`https://loremflickr.com/400/400/${searchQuery.toLowerCase()},adventure/all?lock=4`} className="rounded-xl object-cover aspect-square" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                </aside>
              </motion.div>
            ) : (
              <div className="space-y-16">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-4xl font-display mb-4">The Art of Roaming</h2>
                  <p className="text-text-muted">Discover cities, hidden gems, and the stories that make every journey unique.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {featuredPlaces.map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="vibrant-card group cursor-pointer"
                      onClick={() => {
                        setSearchQuery(item.title);
                        handleSearch({ preventDefault: () => {} } as any);
                      }}
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        <img 
                          src={item.img} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-accent-terracotta mb-1">{item.country}</p>
                        <h3 className="text-xl font-display mb-2">{item.title}</h3>
                        <p className="text-sm text-text-muted">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-accent-sage/5 p-12 rounded-[3rem]">
                  <div>
                    <h2 className="text-4xl font-display mb-6 text-accent-sage">Adventure Awaits</h2>
                    <p className="text-lg text-text-main/80 leading-relaxed mb-8">
                      From the bustling streets of Tokyo to the serene beaches of Bali, every roam is a new chapter in your story. Join our community to share your experiences.
                    </p>
                    <button 
                      onClick={() => setActiveTab('community')}
                      className="bg-accent-sage text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-accent-sage/90 transition-all"
                    >
                      Join the Community
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <img src="https://loremflickr.com/400/600/mountain,nature" className="rounded-3xl shadow-xl" referrerPolicy="no-referrer" />
                    <img src="https://loremflickr.com/400/600/forest,landscape" className="rounded-3xl shadow-xl mt-12" referrerPolicy="no-referrer" />
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-8 py-16 border-t border-stone-100 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-display italic mb-4 text-accent-terracotta">RinnieeRoams</h2>
            <p className="text-text-muted max-w-sm leading-relaxed">
              A celebration of global roaming. We bring you the stories of cities, the beauty of nature, and the intelligence to explore them all.
            </p>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest mb-6 text-text-main">Explore</h5>
            <ul className="text-sm space-y-3 text-text-muted">
              <li className="hover:text-accent-terracotta cursor-pointer transition-colors">City Guides</li>
              <li className="hover:text-accent-terracotta cursor-pointer transition-colors">Natural Wonders</li>
              <li className="hover:text-accent-terracotta cursor-pointer transition-colors">Travel Intelligence</li>
              <li className="hover:text-accent-terracotta cursor-pointer transition-colors">Community Roams</li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest mb-6 text-text-main">Connect</h5>
            <div className="flex gap-6 text-text-muted">
              <Instagram size={20} className="hover:text-accent-terracotta cursor-pointer" />
              <Twitter size={20} className="hover:text-accent-terracotta cursor-pointer" />
              <Facebook size={20} className="hover:text-accent-terracotta cursor-pointer" />
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-stone-50 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">© 2026 RinnieeRoams • Crafted for the Global Soul</p>
        </div>
      </footer>
    </div>
  );
}
