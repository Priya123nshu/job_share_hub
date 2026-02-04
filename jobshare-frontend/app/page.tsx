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
  const { isLoaded, isSignedIn, user } = useUser();
  const [data, setData] = useState<{ profiles: JobData } | null>(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

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

  if (!isLoaded) return (
    <div className="flex h-screen items-center justify-center text-blue-400 font-medium tracking-wide animate-pulse">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen font-sans">
      {/* Background Glow Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/70 border-b border-white/10 shadow-lg transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              JobShare Hub
            </h1>
            <p className="text-slate-400 text-xs tracking-wider uppercase font-medium mt-1">
              Curated. Fast. Premium.
            </p>
          </div>

          <div>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="relative group px-6 py-2.5 rounded-full overflow-hidden font-semibold text-white shadow-xl transition-all hover:scale-105 active:scale-95">
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500 transition-all"></span>
                  <span className="relative z-10">Sign In</span>
                </button>
              </SignInButton>
            ) : (
              <div className="p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <div className="bg-slate-900 rounded-full p-0.5">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {!isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg">
              Unlock Your <span className="text-blue-400">Dream Career</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl leading-relaxed mb-8">
              Get exclusive access to hourly curated job listings from top companies.
              Sign in to see opportunities before anyone else.
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {data && (
              <div className="mb-10 flex flex-wrap gap-3 justify-center md:justify-start">
                <FilterButton
                  label="All Profiles"
                  isActive={filter === 'all'}
                  onClick={() => setFilter('all')}
                />
                {Object.keys(data.profiles).map(profile => (
                  <FilterButton
                    key={profile}
                    label={profile}
                    isActive={filter === profile}
                    onClick={() => setFilter(profile)}
                  />
                ))}
              </div>
            )}

            {loading && <div className="text-center py-20 text-blue-300 animate-pulse text-lg">Searching the cosmos for jobs...</div>}

            {!loading && data && (
              <div className="space-y-12">
                {Object.keys(data.profiles).map(cat => {
                  if (filter !== 'all' && filter !== cat) return null;
                  const group = data.profiles[cat];
                  const jobs1h = group['1h'] || [];
                  const jobs24h = group['24h'] || [];

                  if (jobs1h.length === 0 && jobs24h.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-6">
                      <div className="flex items-center gap-4 mb-6">
                        <h3 className="text-2xl font-bold text-white tracking-tight">{cat}</h3>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                      </div>

                      {/* 1h Section */}
                      {jobs1h.length > 0 && (
                        <div className="mb-8 pl-4 border-l-2 border-emerald-500/50">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-4 uppercase tracking-widest">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            Fresh Drops (1h)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {jobs1h.map((url, i) => (
                              <JobCard key={i} url={url} type="1h" />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 24h Section */}
                      {jobs24h.length > 0 && (
                        <div className="pl-4 border-l-2 border-slate-700/50">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                            Last 24 Hours
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {jobs24h.map((url, i) => (
                              <JobCard key={i} url={url} type="24h" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 bg-slate-900/40 backdrop-blur-lg mt-20 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} JobShare Hub. Crafted by <span className="text-white font-semibold">Priyanshu Kumar</span>.</p>
          <div className="flex items-center gap-6">
            <a href="mailto:priyanshu.altruist@gmail.com" className="hover:text-blue-400 transition-colors">Feedback</a>
            <a href="https://www.linkedin.com/in/priyanshu-kumar-980b50179/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FilterButton({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border backdrop-blur-sm
            ${isActive
          ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 border-transparent text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105'
          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
        }`}
    >
      {label}
    </button>
  )
}

function JobCard({ url, type }: { url: string, type: '1h' | '24h' }) {
  const isNew = type === '1h';

  // Extracting a cleaner title from URL simply for display if possible, otherwise use full URL
  const displayUrl = url.length > 50 ? url.substring(0, 50) + "..." : url;

  return (
    <div className="group relative flex flex-col justify-between p-5 bg-slate-800/40 border border-white/5 rounded-xl hover:bg-slate-800/60 hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-medium hover:text-blue-400 transition-colors break-all leading-snug text-sm sm:text-base line-clamp-2"
          >
            {/* Try to show something nicer than just URL if possible, otherwise URL */}
            {displayUrl}
          </a>
          {isNew && (
            <span className="shrink-0 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase rounded tracking-wider">
              New
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {isNew ? 'Listing posted < 1 hour ago' : 'Listing posted within 24 hours'}
        </p>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start mt-2 inline-flex items-center gap-2 text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors uppercase tracking-wider"
      >
        View Details
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </a>

      {/* Decorative Glow on Hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-white/5 to-purple-500/0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
    </div>
  );
}
