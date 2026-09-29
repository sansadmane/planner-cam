'use client';
import { useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";

export default function PlannerCamera() {
  const { data: session, status } = useSession(); 
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(URL.createObjectURL(file));
    setIsProcessing(true);
    setEvents([]); 

    const formData = new FormData();
    formData.append('plannerImage', file);

    try {
      const response = await fetch('/api/extract-events', { 
        method: 'POST', 
        body: formData 
      });
      
      if (!response.ok) throw new Error("Failed to extract");

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Failed to extract events", error);
      alert("Something went wrong processing the image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      const response = await fetch('/api/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, timeZone: userTimeZone })
      });

      if (!response.ok) throw new Error("Failed to sync");
      
      alert("Success! Events added to your Google Calendar.");
      setEvents([]); 
      setImage(null);
    } catch (error) {
      console.error("Sync error:", error);
      alert("Something went wrong adding to calendar.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-md mx-auto w-full text-black">
      {/* Auth Status Bar */}
      <div className="w-full flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        {status === "authenticated" ? (
          <>
            <div className="text-sm">
              Signed in as <br/><span className="font-bold">{session?.user?.email}</span>
            </div>
            <button onClick={() => signOut()} className="text-red-500 text-sm font-semibold">Sign Out</button>
          </>
        ) : (
          <button 
            onClick={() => signIn('google')} 
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold shadow-md hover:bg-blue-700"
          >
            Sign in with Google to Sync
          </button>
        )}
      </div>

      {/* Snap Image Trigger */}
      <label className="bg-black text-white px-6 py-4 rounded-xl cursor-pointer shadow-md hover:bg-gray-800 transition text-center w-full">
        <strong>What's the Plan?</strong>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleCapture} 
        />
      </label>

      {/* Image Preview */}
      {image && <img src={image} alt="Captured planner" className="w-full rounded-lg shadow-lg border" />}

      {/* Processing State */}
      {isProcessing && (
        <div className="animate-pulse text-blue-600 font-semibold bg-blue-50 px-4 py-2 rounded-lg">
          The spirits are reading your handwriting...
        </div>
      )}

      {/* Extracted Events List & Google Sync Button */}
      {events.length > 0 && (
        <div className="w-full bg-white rounded-xl shadow-md p-4 border text-black">
          <h3 className="font-bold text-lg mb-3">This you?</h3>
          <ul className="space-y-3 mb-4">
            {events.map((ev, i) => (
              <li key={i} className="bg-gray-50 p-3 rounded-md border text-sm flex flex-col">
                <span className="font-bold text-base">{ev.title}</span>
                <span className="text-gray-600">
                  {ev.date} • {ev.start_time} - {ev.end_time}
                </span>
              </li>
            ))}
          </ul>

          {status === "authenticated" ? (
            <button 
              onClick={handleSync} 
              disabled={isSyncing}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSyncing ? "Syncing to Calendar..." : "Add to Google Calendar"}
            </button>
          ) : (
            <div className="text-sm text-red-500 text-center font-semibold">
              Sign in above to push to your calendar
            </div>
          )}
        </div>
      )}
    </div>
  );
}