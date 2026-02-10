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
  skills?: string[];
  salary?: string;
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
          <div className="space-y-10">
            {/* Category Cards Grid */}
            {data && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Job Categories</h2>
                    <p className="text-sm text-neutral-500">Select a category to view available positions</p>
                  </div>
                  <div className="text-sm text-neutral-400">
                    {Object.keys(data.profiles).length} categories
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {Object.keys(data.profiles).map(profile => {
                    const group = data.profiles[profile];
                    const totalJobs = (group['1h']?.length || 0) + (group['24h']?.length || 0);
                    const hasNewJobs = (group['1h']?.length || 0) > 0;

                    return (
                      <button
                        key={profile}
                        onClick={() => scrollToSection(profile)}
                        className={`group relative p-4 rounded-xl border text-left transition-all duration-200 ${activeProfile === profile
                          ? 'bg-white text-black border-white'
                          : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/50'
                          }`}
                      >
                        {/* New jobs indicator */}
                        {hasNewJobs && activeProfile !== profile && (
                          <span className="absolute top-2 right-2 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                        )}

                        <h3 className={`text-sm font-medium leading-tight mb-2 ${activeProfile === profile ? 'text-black' : 'text-white group-hover:text-white'
                          }`}>
                          {profile}
                        </h3>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${activeProfile === profile
                            ? 'bg-black/10 text-black'
                            : 'bg-neutral-800 text-neutral-400'
                            }`}>
                            {totalJobs} jobs
                          </span>
                          {hasNewJobs && (
                            <span className={`text-xs ${activeProfile === profile ? 'text-black/60' : 'text-emerald-500'
                              }`}>
                              +{group['1h']?.length} new
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {loading && (
              <div className="text-center py-20">
                <div className="h-5 w-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-neutral-500 text-sm">Loading jobs...</p>
              </div>
            )}

            {/* Job Listings */}
            {!loading && data && (
              <div className="space-y-12">
                {Object.keys(data.profiles).map(cat => {
                  const group = data.profiles[cat];
                  const jobs1h = group['1h'] || [];
                  const jobs24h = group['24h'] || [];

                  if (jobs1h.length === 0 && jobs24h.length === 0) return null;

                  return (
                    <section key={cat} id={`cat-${cat}`} className="scroll-mt-24">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-neutral-800">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{cat.charAt(0)}</span>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">{cat}</h2>
                          <p className="text-sm text-neutral-500">
                            {jobs1h.length + jobs24h.length} positions available
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Fresh Jobs */}
                        {jobs1h.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                              New Today ({jobs1h.length})
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
                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                              Last 24 Hours ({jobs24h.length})
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
  const companyName = detail?.about_company ? detail.about_company.split('.')[0].substring(0, 40) + (detail.about_company.length > 40 ? "..." : "") : "Company Confidential";
  const salary = detail?.salary && detail.salary !== "Not mentioned" ? detail.salary : null;
  const skills = detail?.skills?.slice(0, 4) || [];

  // Extract job ID from URL for display
  const jobId = url.match(/\/view\/(\d+)/)?.[1] || '';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col p-5 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden ${isNew
        ? 'bg-neutral-900/40 border-neutral-800 hover:border-emerald-500/30 hover:bg-neutral-900/60'
        : 'bg-neutral-950/30 border-neutral-800/50 hover:border-neutral-700 hover:bg-neutral-900/40'
        }`}
    >
      {/* New Indicator line */}
      {isNew && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-transparent opacity-50" />
      )}

      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors leading-tight mb-1">
            {roleTitle}
          </h3>
          <p className="text-sm text-neutral-400 font-medium">
            {companyName}
          </p>
        </div>

        {salary && (
          <div className="flex-shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
            <p className="text-xs font-bold text-emerald-400 whitespace-nowrap">
              {salary}
            </p>
          </div>
        )}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill, idx) => (
            <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-dashed border-neutral-800/50">
        <span className="text-xs text-neutral-600 font-mono">ID: {jobId}</span>

        <div className="flex items-center gap-1 text-xs font-medium text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
          Apply Now
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </a>
  );
}
