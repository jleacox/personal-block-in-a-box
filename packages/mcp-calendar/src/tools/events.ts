/**
 * Google Calendar Events tools
 * Cloudflare Workers compatible - uses REST API with fetch
 */

import { calendarRequest, CalendarConfig } from '../utils/calendar-client.js';
import { requiredParam, optionalParam, optionalIntParam } from '../utils/validation.js';
import { handleCalendarError } from '../utils/errors.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * List calendars
 */
export async function listCalendars(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const data = await calendarRequest('/users/me/calendarList', config);
    const calendars = data.items || [];
    
    if (calendars.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: 'No calendars found',
        }],
      };
    }

    const summary = calendars.map((cal: any) => {
      return `- ${cal.summary || cal.id} (${cal.primary ? 'primary' : cal.id})${cal.description ? ` - ${cal.description}` : ''}`;
    }).join('\n');

    return {
      content: [{
        type: 'text' as const,
        text: `Found ${calendars.length} calendar${calendars.length === 1 ? '' : 's'}:\n\n${summary}`,
      }],
    };
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

/**
 * List calendar events
 */
export async function listEvents(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const calendarId = optionalParam<string>(args, 'calendarId', 'primary');
    const timeMin = optionalParam<string>(args, 'timeMin');
    const timeMax = optionalParam<string>(args, 'timeMax');
    const maxResults = optionalIntParam(args, 'maxResults', 10);
    const q = optionalParam<string>(args, 'q'); // Search query

    const params = new URLSearchParams({
      maxResults: String(maxResults),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) params.set('timeMin', timeMin);
    if (timeMax) params.set('timeMax', timeMax);
    if (q) params.set('q', q);

    const calendarIdValue = calendarId || 'primary';
    const data = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarIdValue)}/events?${params}`,
      config
    );

    const events = data.items || [];
    
    if (events.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: 'No events found',
        }],
      };
    }

    const summary = events.map((event: any) => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      const location = event.location ? ` @ ${event.location}` : '';
      return `- ${event.summary || '(No title)'} (${start}${end ? ` - ${end}` : ''})${location}`;
    }).join('\n');

    return {
      content: [{
        type: 'text' as const,
        text: `Found ${events.length} event${events.length === 1 ? '' : 's'}:\n\n${summary}`,
      }],
    };
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

/**
 * Get a specific calendar event
 */
export async function getEvent(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const calendarId = optionalParam<string>(args, 'calendarId', 'primary');
    const eventId = requiredParam<string>(args, 'eventId');

    const calendarIdValue = calendarId || 'primary';
    const data = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarIdValue)}/events/${encodeURIComponent(eventId)}`,
      config
    );

    const start = data.start?.dateTime || data.start?.date;
    const end = data.end?.dateTime || data.end?.date;
    const location = data.location ? `\nLocation: ${data.location}` : '';
    const description = data.description ? `\n\nDescription:\n${data.description}` : '';

    return {
      content: [{
        type: 'text' as const,
        text: `Event: ${data.summary || '(No title)'}\nStart: ${start}${end ? `\nEnd: ${end}` : ''}${location}${description}\n\nLink: ${data.htmlLink}`,
      }],
    };
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

/**
 * Create calendar event
 */
export async function createEvent(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const calendarId = optionalParam<string>(args, 'calendarId', 'primary');
    const summary = requiredParam<string>(args, 'summary');
    const description = optionalParam<string>(args, 'description');
    const start = requiredParam<string>(args, 'start');
    const end = requiredParam<string>(args, 'end');
    const location = optionalParam<string>(args, 'location');
    const attendees = optionalParam<string[]>(args, 'attendees', []);

    // Determine if it's an all-day event (date only) or timed event (dateTime)
    const isAllDay = !start.includes('T') && !start.includes(' ');
    const timeZone = optionalParam<string>(args, 'timeZone', 'UTC');

    const calendarIdValue = calendarId || 'primary';
    const event: any = {
      summary,
      start: isAllDay ? { date: start } : { dateTime: start, timeZone: timeZone || 'UTC' },
      end: isAllDay ? { date: end } : { dateTime: end, timeZone: timeZone || 'UTC' },
    };

    if (description) event.description = description;
    if (location) event.location = location;
    if (attendees && attendees.length > 0) {
      event.attendees = attendees.map((email: string) => ({ email }));
    }

    const data = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarIdValue)}/events`,
      config,
      {
        method: 'POST',
        body: JSON.stringify(event),
      }
    );

    const startTime = data.start?.dateTime || data.start?.date;
    const endTime = data.end?.dateTime || data.end?.date;

    return {
      content: [{
        type: 'text' as const,
        text: `Created event: ${data.summary}\nStart: ${startTime}${endTime ? `\nEnd: ${endTime}` : ''}\n\nLink: ${data.htmlLink}`,
      }],
    };
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

/**
 * Update calendar event
 */
export async function updateEvent(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const calendarId = optionalParam<string>(args, 'calendarId', 'primary');
    const eventId = requiredParam<string>(args, 'eventId');
    const summary = optionalParam<string>(args, 'summary');
    const description = optionalParam<string>(args, 'description');
    const start = optionalParam<string>(args, 'start');
    const end = optionalParam<string>(args, 'end');
    const location = optionalParam<string>(args, 'location');

    const calendarIdValue = calendarId || 'primary';
    
    // First get the existing event
    const existing = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarIdValue)}/events/${encodeURIComponent(eventId)}`,
      config
    );

    // Update only provided fields
    const event: any = {};
    if (summary !== undefined) event.summary = summary;
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;
    
    if (start !== undefined) {
      const isAllDay = !start.includes('T') && !start.includes(' ');
      const timeZone = optionalParam<string>(args, 'timeZone', 'UTC');
      event.start = isAllDay ? { date: start } : { dateTime: start, timeZone: timeZone || 'UTC' };
    }
    
    if (end !== undefined) {
      const isAllDay = !end.includes('T') && !end.includes(' ');
      const timeZone = optionalParam<string>(args, 'timeZone', 'UTC');
      event.end = isAllDay ? { date: end } : { dateTime: end, timeZone: timeZone || 'UTC' };
    }

    const data = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarIdValue)}/events/${encodeURIComponent(eventId)}`,
      config,
      {
        method: 'PUT',
        body: JSON.stringify({ ...existing, ...event }),
      }
    );

    return {
      content: [{
        type: 'text' as const,
        text: `Updated event: ${data.summary}\n\nLink: ${data.htmlLink}`,
      }],
    };
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

/**
 * Delete calendar event
 */
export async function deleteEvent(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const calendarId = optionalParam<string>(args, 'calendarId', 'primary');
    const eventId = requiredParam<string>(args, 'eventId');

    const calendarIdValue = calendarId || 'primary';
    await calendarRequest(
      `/calendars/${encodeURIComponent(calendarIdValue)}/events/${encodeURIComponent(eventId)}`,
      config,
      {
        method: 'DELETE',
      }
    );

    return {
      content: [{
        type: 'text' as const,
        text: `Deleted event ${eventId}`,
      }],
    };
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

/**
 * Search events by text query (separate tool for better discoverability)
 */
export async function searchEvents(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const calendarId = optionalParam<string>(args, 'calendarId', 'primary');
    const q = requiredParam<string>(args, 'q');
    const timeMin = optionalParam<string>(args, 'timeMin');
    const timeMax = optionalParam<string>(args, 'timeMax');
    const maxResults = optionalIntParam(args, 'maxResults', 10);

    const params = new URLSearchParams({
      q,
      maxResults: String(maxResults),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) params.set('timeMin', timeMin);
    if (timeMax) params.set('timeMax', timeMax);

    const calendarIdValue = calendarId || 'primary';
    const data = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarIdValue)}/events?${params}`,
      config
    );

    const events = data.items || [];
    
    if (events.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: `No events found matching "${q}"`,
        }],
      };
    }

    const summary = events.map((event: any) => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      const location = event.location ? ` @ ${event.location}` : '';
      return `- ${event.summary || '(No title)'} (${start}${end ? ` - ${end}` : ''})${location}`;
    }).join('\n');

    return {
      content: [{
        type: 'text' as const,
        text: `Found ${events.length} event${events.length === 1 ? '' : 's'} matching "${q}":\n\n${summary}`,
      }],
    };
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

/**
 * Respond to event invitation (accept, decline, tentative, or no response)
 */
export async function respondToEvent(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const calendarId = optionalParam<string>(args, 'calendarId', 'primary');
    const eventId = requiredParam<string>(args, 'eventId');
    const response = requiredParam<string>(args, 'response'); // 'accepted', 'declined', 'tentative', 'needsAction'
    const comment = optionalParam<string>(args, 'comment');

    // Map response to Google Calendar API format
    const responseMap: Record<string, string> = {
      'accepted': 'accept',
      'declined': 'decline',
      'tentative': 'tentative',
      'needsAction': 'needsAction',
    };

    const googleResponse = responseMap[response.toLowerCase()] || response.toLowerCase();
    
    if (!['accept', 'decline', 'tentative', 'needsAction'].includes(googleResponse)) {
      throw new Error(`Invalid response. Must be one of: accepted, declined, tentative, needsAction`);
    }

    const calendarIdValue = calendarId || 'primary';
    
    // Get the authenticated user's email from calendar settings
    const calendarData = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarIdValue)}`,
      config
    );
    const userEmail = calendarData.id; // Calendar ID for primary is usually the user's email
    
    // Get existing event to update attendee response
    const existing = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarIdValue)}/events/${encodeURIComponent(eventId)}`,
      config
    );

    const updatedEvent: any = {
      ...existing,
      attendees: existing.attendees || [],
    };

    // Find and update the current user's attendee entry
    let attendeeIndex = updatedEvent.attendees.findIndex((a: any) => 
      a.email && a.email.toLowerCase() === userEmail.toLowerCase()
    );
    
    // If not found, try matching by self flag or add as new attendee
    if (attendeeIndex < 0) {
      attendeeIndex = updatedEvent.attendees.findIndex((a: any) => a.self === true);
    }
    
    if (attendeeIndex >= 0) {
      updatedEvent.attendees[attendeeIndex].responseStatus = googleResponse;
      if (comment) {
        updatedEvent.attendees[attendeeIndex].comment = comment;
      }
    } else {
      // Add new attendee entry for the user
      updatedEvent.attendees.push({
        email: userEmail,
        responseStatus: googleResponse,
        comment: comment,
      });
    }

    // Use PATCH for partial update (more efficient and safer)
    const data = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarIdValue)}/events/${encodeURIComponent(eventId)}`,
      config,
      {
        method: 'PATCH',
        body: JSON.stringify({
          attendees: updatedEvent.attendees,
        }),
      }
    );

    return {
      content: [{
        type: 'text' as const,
        text: `Response "${response}" recorded for event: ${data.summary || eventId}${comment ? `\nComment: ${comment}` : ''}`,
      }],
    };
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

/**
 * Get free/busy information for calendars
 */
export async function getFreebusy(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const timeMin = requiredParam<string>(args, 'timeMin');
    const timeMax = requiredParam<string>(args, 'timeMax');
    const calendarIds = optionalParam<string[]>(args, 'calendarIds', ['primary']) || ['primary'];

    const requestBody = {
      timeMin,
      timeMax,
      items: calendarIds.map((id: string) => ({ id })),
    };

    const data = await calendarRequest(
      '/freeBusy',
      config,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const busyPeriods: string[] = [];
    for (const [calendarId, calendar] of Object.entries(data.calendars || {})) {
      const calendarData = calendar as any;
      if (calendarData.busy && calendarData.busy.length > 0) {
        const periods = calendarData.busy.map((period: any) => 
          `${period.start} - ${period.end}`
        ).join(', ');
        busyPeriods.push(`${calendarId}: ${periods}`);
      } else {
        busyPeriods.push(`${calendarId}: Free`);
      }
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Free/Busy status:\n\n${busyPeriods.join('\n')}`,
      }],
    };
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

/**
 * Get current date and time in calendar's timezone
 */
export async function getCurrentTime(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const calendarId = optionalParam<string>(args, 'calendarId', 'primary');
    
    // Get calendar to retrieve timezone
    const calendarData = await calendarRequest(
      `/calendars/${encodeURIComponent(calendarId || 'primary')}`,
      config
    );

    const timeZone = calendarData.timeZone || 'UTC';
    const now = new Date();
    
    // Format in the calendar's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    const formattedTime = formatter.format(now);
    const isoTime = now.toISOString();

    return {
      content: [{
        type: 'text' as const,
        text: `Current time (${timeZone}): ${formattedTime}\nISO 8601: ${isoTime}`,
      }],
    };
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

/**
 * List available event colors
 */
export async function listColors(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const data = await calendarRequest('/colors', config);
    
    const eventColors = data.event || {};
    const calendarColors = data.calendar || {};

    const eventColorList = Object.entries(eventColors)
      .map(([id, color]: [string, any]) => 
        `- ${id}: ${color.background} (foreground: ${color.foreground})`
      )
      .join('\n');

    const calendarColorList = Object.entries(calendarColors)
      .map(([id, color]: [string, any]) => 
        `- ${id}: ${color.background} (foreground: ${color.foreground})`
      )
      .join('\n');

    return {
      content: [{
        type: 'text' as const,
        text: `Event Colors:\n${eventColorList}\n\nCalendar Colors:\n${calendarColorList}`,
      }],
    };
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

/**
 * Manage OAuth accounts (list connected accounts, get OAuth URL to add new account)
 */
export async function manageAccounts(
  config: CalendarConfig,
  args: Record<string, any>
): Promise<CallToolResult> {
  try {
    const action = optionalParam<string>(args, 'action', 'list'); // 'list' or 'add'
    const userId = optionalParam<string>(args, 'userId', config.userId || 'default');

    if (!config.oauthBrokerUrl) {
      return {
        content: [{
          type: 'text' as const,
          text: 'OAuth broker not configured. Set OAUTH_BROKER_URL to use account management.',
        }],
      };
    }

    if (action === 'list') {
      // Check if account is connected by trying to get a token
      try {
        const tokenResponse = await fetch(`${config.oauthBrokerUrl}/token/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });

        if (tokenResponse.ok) {
          return {
            content: [{
              type: 'text' as const,
              text: `✓ Account "${userId}" is connected to Google Calendar.\n\nTo add another account, use action: "add" with a different userId.`,
            }],
          };
        } else {
          return {
            content: [{
              type: 'text' as const,
              text: `✗ Account "${userId}" is not connected.\n\nTo connect, visit:\n${config.oauthBrokerUrl}/auth/google?user_id=${userId}`,
            }],
          };
        }
      } catch (error: any) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error checking account status: ${error.message}`,
          }],
        };
      }
    } else if (action === 'add') {
      // Provide OAuth URL to add new account
      const oauthUrl = `${config.oauthBrokerUrl}/auth/google?user_id=${userId}`;
      return {
        content: [{
          type: 'text' as const,
          text: `To connect account "${userId}" to Google Calendar:\n\n1. Visit this URL:\n${oauthUrl}\n\n2. Complete the OAuth flow in your browser\n3. You'll see a success message when done\n\nAfter connecting, you can use this account by setting USER_ID="${userId}" in your MCP configuration.`,
        }],
      };
    } else {
      return {
        content: [{
          type: 'text' as const,
          text: `Invalid action. Use "list" to check account status or "add" to get OAuth URL.`,
        }],
      };
    }
  } catch (error: any) {
    return handleCalendarError(error);
  }
}

