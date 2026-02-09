"use client";

import React, { useEffect, useState } from 'react';
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";

type JobData = {
  [profile: string]: {
    "1h": string[];
    "24h": string[];
  };
};

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const [data, setData] = useState<{ profiles: JobData } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      setLoading(true);
      fetch('/jobs_data.json')
        .then(res => res.json())
        .then(d => {
          setData(d);
          setLoading(false);
        })
        .catch(e => {
          console.error(e);
          setLoading(false);
        });
    }
  }, [isSignedIn]);

  // Scroll to section handler
  const scrollToSection = (profile: string) => {
    const element = document.getElementById(`cat-${profile}`);
    if (element) {
      // Offset for sticky header
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveProfile(profile);
    }
  };

  if (!isLoaded) return (
    <div className="flex h-screen items-center justify-center text-blue-400 font-medium tracking-wide animate-pulse">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen font-sans bg-slate-900 text-slate-50">
      {/* Background Glow Effects - keeping existing effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              JobShare Hub
            </h1>
          </div>

          <div>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="px-5 py-2 rounded-full font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 text-sm">
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <UserButton afterSignOutUrl="/" appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border-2 border-blue-500/20"
                }
              }} />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-20 text-center min-h-[60vh]">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
              Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Opportunity</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-8">
              Curated job listings updated hourly. Sign in to access the feed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 relative">

            {/* Sidebar Navigation */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-4 pr-2 custom-scrollbar">
                {data && (
                  <nav className="space-y-1">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
                      Job Profiles
                    </h3>
                    {Object.keys(data.profiles).map(profile => (
                      <button
                        key={profile}
                        onClick={() => scrollToSection(profile)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeProfile === profile
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }`}
                      >
                        {profile}
                      </button>
                    ))}
                  </nav>
                )}
                {loading && (
                  <div className="space-y-3 px-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* Main Content Feed */}
            <div className="flex-1 min-w-0">
              {loading && (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-slate-400">Loading listings...</p>
                </div>
              )}

              {!loading && data && (
                <div className="space-y-16 pb-20">
                  {Object.keys(data.profiles).map(cat => {
                    const group = data.profiles[cat];
                    const jobs1h = group['1h'] || [];
                    const jobs24h = group['24h'] || [];

                    if (jobs1h.length === 0 && jobs24h.length === 0) return null;

                    return (
                      <section
                        key={cat}
                        id={`cat-${cat}`}
                        className="scroll-mt-24" // Helper class for scroll offset if supported, but we use JS mostly
                      >
                        <div className="flex items-center gap-4 mb-6 sticky top-[73px] z-10 bg-slate-900/95 backdrop-blur py-2 border-b border-white/5">
                          <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
                          <h2 className="text-xl font-bold text-white">{cat}</h2>
                        </div>

                        <div className="space-y-8 pl-0 lg:pl-5">
                          {/* 1h Section */}
                          {jobs1h.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Fresh (1h)
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                                {jobs1h.map((url, i) => (
                                  <JobCard key={`1h-${i}`} url={url} type="1h" />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 24h Section */}
                          {jobs24h.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                24 Hours
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                                {jobs24h.map((url, i) => (
                                  <JobCard key={`24h-${i}`} url={url} type="24h" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


function JobCard({ url, type }: { url: string, type: '1h' | '24h' }) {
  const isNew = type === '1h';
  // Attempt to make display URL cleaner
  // e.g. https://www.linkedin.com/jobs/view/381... -> .../view/381...
  // For now just truncation is fine.
  const displayUrl = url.length > 60 ? url.substring(0, 60) + "..." : url;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block p-4 rounded-lg border transition-all duration-200 
        ${isNew
          ? 'bg-slate-800/40 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-slate-800/60'
          : 'bg-slate-800/20 border-white/5 hover:border-blue-500/30 hover:bg-slate-800/40'
        }
      `}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium truncate mb-1 ${isNew ? 'text-emerald-100' : 'text-slate-300 group-hover:text-blue-200'}`}>
            {displayUrl}
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${isNew
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-slate-700/30 border-slate-600/30 text-slate-500'
              }`}>
              {isNew ? 'NEW' : 'RECENT'}
            </span>
            <span className="text-[10px] text-slate-600">LinkedIn</span>
          </div>
        </div>
        <div className="text-slate-600 group-hover:text-blue-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </a>
  );
}
