"use client";

import React, { useEffect, useState } from 'react';
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";

type JobData = {
  [profile: string]: {
    "1h": string[];
    "24h": string[];
  };
};

type JobDetail = {
  url: string;
  role?: string;
  about_company?: string;
  raw_text?: string;
};

type JobDetailsMap = {
  [url: string]: JobDetail;
};

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const [data, setData] = useState<{ profiles: JobData } | null>(null);
  const [details, setDetails] = useState<JobDetailsMap>({});
  const [loading, setLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      setLoading(true);

      Promise.all([
        fetch('/jobs_data.json').then(res => res.json()),
        fetch('/job_details.json').then(res => res.json()).catch(() => ({}))
      ])
        .then(([jobsData, detailsData]) => {
          setData(jobsData);
          setDetails(detailsData);
          setLoading(false);
        })
        .catch(e => {
          console.error(e);
          setLoading(false);
        });
    }
  }, [isSignedIn]);

  const scrollToSection = (profile: string) => {
    const element = document.getElementById(`cat-${profile}`);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      setActiveProfile(profile);
    }
  };

  if (!isLoaded) return (
    <div className="flex h-screen items-center justify-center bg-black text-neutral-400 font-medium">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
        Loading...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* Header - Vercel style */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-white rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-xs">J</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">JobShare</span>
          </div>

          <div>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="h-8 px-4 text-sm font-medium bg-white text-black rounded-md hover:bg-neutral-200 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <UserButton afterSignOutUrl="/" appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }} />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {!isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
              Find Your Next Role
            </h1>
            <p className="text-lg text-neutral-500 max-w-md leading-relaxed mb-8">
              Curated job listings updated hourly. Sign in to access the feed.
            </p>
            <SignInButton mode="modal">
              <button className="h-12 px-8 text-base font-medium bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors">
                Get Started
              </button>
            </SignInButton>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar */}
            <aside className="lg:w-48 flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                {data && (
                  <nav className="space-y-1">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4">
                      Categories
                    </p>
                    {Object.keys(data.profiles).map(profile => (
                      <button
                        key={profile}
                        onClick={() => scrollToSection(profile)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${activeProfile === profile
                          ? 'bg-neutral-800 text-white'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                          }`}
                      >
                        {profile}
                      </button>
                    ))}
                  </nav>
                )}
                {loading && (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-9 bg-neutral-900 rounded-md animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {loading && (
                <div className="text-center py-20">
                  <div className="h-5 w-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-neutral-500 text-sm">Loading jobs...</p>
                </div>
              )}

              {!loading && data && (
                <div className="space-y-16">
                  {Object.keys(data.profiles).map(cat => {
                    const group = data.profiles[cat];
                    const jobs1h = group['1h'] || [];
                    const jobs24h = group['24h'] || [];

                    if (jobs1h.length === 0 && jobs24h.length === 0) return null;

                    return (
                      <section key={cat} id={`cat-${cat}`}>
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-800">
                          <h2 className="text-lg font-semibold text-white">{cat}</h2>
                          <span className="text-xs text-neutral-500 bg-neutral-900 px-2 py-1 rounded-full">
                            {jobs1h.length + jobs24h.length} jobs
                          </span>
                        </div>

                        <div className="space-y-6">
                          {/* Fresh Jobs */}
                          {jobs1h.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                New Today
                              </p>
                              <div className="space-y-2">
                                {jobs1h.map((url, i) => (
                                  <JobCard key={`1h-${i}`} url={url} isNew={true} detail={details[url]} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 24h Jobs */}
                          {jobs24h.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Last 24 Hours
                              </p>
                              <div className="space-y-2">
                                {jobs24h.map((url, i) => (
                                  <JobCard key={`24h-${i}`} url={url} isNew={false} detail={details[url]} />
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

      {/* Footer */}
      <footer className="border-t border-neutral-800 mt-24">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-400">
              Created by <span className="text-white font-medium">Priyanshu Kumar</span>
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a
                href="mailto:priyanshu.altruist@gmail.com"
                className="text-neutral-500 hover:text-white transition-colors"
              >
                Feedback
              </a>
              <a
                href="https://www.linkedin.com/in/priyanshu-kumar-980b50179/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Connect
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


function JobCard({ url, isNew, detail }: { url: string, isNew: boolean, detail?: JobDetail }) {
  const roleTitle = detail?.role || "View Job Details";

  // Extract job ID from URL for display
  const jobId = url.match(/\/view\/(\d+)/)?.[1] || '';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center justify-between p-4 rounded-lg border transition-all duration-150 ${isNew
        ? 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
        : 'bg-transparent border-neutral-800/50 hover:border-neutral-700 hover:bg-neutral-900/50'
        }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Status indicator */}
        <div className={`flex-shrink-0 h-2 w-2 rounded-full ${isNew ? 'bg-emerald-500' : 'bg-neutral-600'}`} />

        <div className="min-w-0">
          <h3 className={`text-sm font-medium truncate ${isNew ? 'text-white' : 'text-neutral-300'} group-hover:text-white transition-colors`}>
            {roleTitle}
          </h3>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            #{jobId}
          </p>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 ml-4">
        <svg
          className="w-4 h-4 text-neutral-600 group-hover:text-white group-hover:translate-x-0.5 transition-all"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );
}
