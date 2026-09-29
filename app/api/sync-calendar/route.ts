import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Securely get the logged-in user's token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse the events and timeZone from the frontend
    const { events, timeZone } = await req.json();

    // 3. Loop through the events and push them to Google Calendar
    const insertPromises = events.map((event: any) => {
      // Format times exactly how Google Calendar requires them: YYYY-MM-DDTHH:MM:00
      const startTime = `${event.date}T${event.start_time}:00`;
      // Fallback just in case Gemini didn't extract an end time
      const endTime = event.end_time ? `${event.date}T${event.end_time}:00` : startTime; 

      return fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          summary: event.title,
          start: { dateTime: startTime, timeZone: timeZone },
          end: { dateTime: endTime, timeZone: timeZone }
        })
      });
    });

    // Wait for all the events to finish pushing
    await Promise.all(insertPromises);

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Calendar Sync Error:", error);
    return NextResponse.json({ error: "Failed to push to calendar" }, { status: 500 });
  }
}