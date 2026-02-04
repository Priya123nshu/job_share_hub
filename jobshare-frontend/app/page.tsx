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

  if (!isLoaded) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f3f2ef] font-sans text-[#1d1d1d]">
      <header className="bg-white border-b border-[#e0e0e0] py-10 px-5 text-center relative mb-8">
        <h1 className="text-3xl font-bold text-[#0a66c2] mb-2">🔗 JobShare Hub</h1>
        <p className="text-[#666]">Curated LinkedIn job opportunities, updated hourly.</p>

        <div className="absolute top-5 right-5">
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="bg-[#0a66c2] text-white px-4 py-2 rounded-full font-semibold hover:bg-[#004182]">
                Sign In
              </button>
            </SignInButton>
          ) : (
            <UserButton afterSignOutUrl="/" />
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5">
        {!isSignedIn ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">Please sign in to view jobs</h2>
            <p className="text-[#666]">Exclusive access to hourly curated job listings.</p>
          </div>
        ) : (
          <div>
            {data && (
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors
                       ${filter === 'all'
                        ? 'bg-[#0a66c2] text-white border-[#0a66c2]'
                        : 'bg-white text-[#666] border-gray-300 hover:bg-gray-50'}`}
                  >
                    All Profiles
                  </button>
                  {Object.keys(data.profiles).map(profile => (
                    <button
                      key={profile}
                      onClick={() => setFilter(profile)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors
                         ${filter === profile
                          ? 'bg-[#0a66c2] text-white border-[#0a66c2]'
                          : 'bg-white text-[#666] border-gray-300 hover:bg-gray-50'}`}
                    >
                      {profile}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && <div className="text-center py-10">Loading jobs...</div>}

            {!loading && data && (
              <div className="space-y-8">
                {Object.keys(data.profiles).map(cat => {
                  if (filter !== 'all' && filter !== cat) return null;
                  const group = data.profiles[cat];
                  const jobs1h = group['1h'] || [];
                  const jobs24h = group['24h'] || [];

                  if (jobs1h.length === 0 && jobs24h.length === 0) return null;

                  return (
                    <div key={cat} className="mb-8 p-4 bg-white rounded-lg shadow-sm">
                      <h3 className="text-xl font-bold text-[#333] border-b-2 border-[#0a66c2] inline-block mb-4 pb-1">
                        {cat}
                      </h3>

                      {/* 1h Section */}
                      {jobs1h.length > 0 && (
                        <div className="mb-6">
                          <h4 className="flex items-center text-sm font-bold text-green-800 mb-3 bg-green-50 w-fit px-2 py-1 rounded">
                            ⚡ Fresh (Last Hour)
                          </h4>
                          <div className="space-y-3">
                            {jobs1h.map((url, i) => (
                              <JobCard key={i} url={url} type="1h" />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 24h Section */}
                      {jobs24h.length > 0 && (
                        <div>
                          <h4 className="flex items-center text-sm font-bold text-gray-600 mb-3 bg-gray-100 w-fit px-2 py-1 rounded">
                            🕒 Last 24 Hours
                          </h4>
                          <div className="space-y-3">
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
        <footer className="bg-white border-t border-[#e0e0e0] py-8 text-center text-sm text-[#666] mt-12">
          <p className="mb-2">Created by <span className="font-semibold text-[#333]">Priyanshu Kumar</span></p>
          <div className="flex justify-center gap-6">
            <a href="mailto:priyanshu.altruist@gmail.com" className="hover:text-[#0a66c2] transition-colors">
              📧 Feedback
            </a>
            <a
              href="https://www.linkedin.com/in/priyanshu-kumar-980b50179/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0a66c2] transition-colors"
            >
              🔗 Connect on LinkedIn
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function JobCard({ url, type }: { url: string, type: '1h' | '24h' }) {
  const isNew = type === '1h';
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0 mr-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0a66c2] font-semibold hover:underline block truncate"
        >
          {url}
        </a>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span className={`px-2 py-0.5 rounded font-bold ${isNew ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {isNew ? 'NEW' : '24H'}
          </span>
          <span>{isNew ? 'Posted recently' : 'Posted within 24h'}</span>
        </div>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-[#0a66c2] text-white text-sm font-medium rounded-full hover:bg-[#004182] transition-colors"
      >
        Apply ↗
      </a>
    </div>
  );
}
