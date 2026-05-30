"use client";

import { useState } from "react";

export function ProButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-[#F0B429] text-[#002A5C] font-bold py-3.5 rounded-xl text-sm hover:bg-yellow-400 transition-colors"
      >
        Upgrade to Pro &rarr;
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          onClick={() => { setOpen(false); setSubmitted(false); setEmail(""); }}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-[#1a8c4e]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-[#1a8c4e]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-black mb-2">You&apos;re on the list!</h2>
                <p className="text-gray-500 text-sm mb-6">
                  We&apos;ll email you at <span className="font-semibold text-black">{email}</span> the moment Pro launches.
                </p>
                <button
                  onClick={() => { setOpen(false); setSubmitted(false); setEmail(""); }}
                  className="w-full bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-[#F0B429] rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#002A5C]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-black leading-tight">Varsio Pro</h2>
                    <p className="text-sm text-gray-400">$4.99 / month</p>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {[
                    "Unlimited AI Quiz Generation",
                    "AI Deadline Tracker (syllabus scan)",
                    "Unlimited Study Sessions",
                    "Priority tutor placement",
                    "Profile badge & verified status",
                    "Ad-free experience",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-[#1a8c4e] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                  <p className="text-xs font-bold text-amber-800 mb-0.5">Launching soon</p>
                  <p className="text-xs text-amber-700">
                    Pro is in final testing. Join the waitlist and get 30 days free when we launch.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors"
                  >
                    Notify Me &mdash; Get 30 Days Free
                  </button>
                </form>

                <button
                  onClick={() => setOpen(false)}
                  className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Maybe later
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
