import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "calendar",
   serverVersion: "1.0.0",
   description: "Access and create Google Calendar events with any connected google calendar account.",
} as const;

/**
 * The type of the input parameter for listAccounts tool.
 */
export type listAccountsParams = {

}

/**
 * The type of the output of the listAccounts tool.
 */
export type listAccountsOutput = {
  accounts: Array<{
    type: 'gcal',
    email: string
  }>
}

/**
 * Get calendar accounts available on this tool for this user.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function listAccounts(
  sdk: ServerSdk,
  params: listAccountsParams
): Promise<listAccountsOutput> {
  return await sdk.callTool("calendar/1.0.0/listAccounts", params) as listAccountsOutput;
}

/**
 * The type of the input parameter for listCalendars tool.
 */
export type listCalendarsParams = {
  // Email address of the calendar account from listAccounts
  account: string
}

/**
 * The type of the output of the listCalendars tool.
 */
export type listCalendarsOutput = {
  calendars: Array<{
    id: string,
    primary?: boolean,
    summary: string,
    selected?: boolean,
    timeZone?: string,
    accessRole?: string,
    description?: string,
    backgroundColor?: string,
    foregroundColor?: string
  }>
}

/**
 * List all calendars for a given account.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function listCalendars(
  sdk: ServerSdk,
  params: listCalendarsParams
): Promise<listCalendarsOutput> {
  return await sdk.callTool("calendar/1.0.0/listCalendars", params) as listCalendarsOutput;
}

/**
 * The type of the input parameter for createCalendar tool.
 */
export type createCalendarParams = {
  // Email address of the calendar account from listAccounts
  account: string,
  // Calendar name/title
  summary: string,
  location?: string,
  // IANA timezone name (e.g., 'America/New_York', 'Europe/London')
  timeZone?: string,
  description?: string
}

/**
 * The type of the output of the createCalendar tool.
 */
export type createCalendarOutput = {
  calendar: {
    id: string,
    summary: string,
    timeZone?: string,
    description?: string
  }
}

/**
 * Create a new calendar.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function createCalendar(
  sdk: ServerSdk,
  params: createCalendarParams
): Promise<createCalendarOutput> {
  return await sdk.callTool("calendar/1.0.0/createCalendar", params) as createCalendarOutput;
}

/**
 * The type of the input parameter for updateCalendar tool.
 */
export type updateCalendarParams = {
  // Email address of the calendar account from listAccounts
  account: string,
  summary?: string,
  location?: string,
  // IANA timezone name (e.g., 'America/New_York', 'Europe/London')
  timeZone?: string,
  // Calendar ID from listCalendars
  calendarId: string,
  description?: string
}

/**
 * The type of the output of the updateCalendar tool.
 */
export type updateCalendarOutput = {
  calendar: {
    id: string,
    summary: string,
    timeZone?: string,
    description?: string
  }
}

/**
 * Update an existing calendar's settings.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function updateCalendar(
  sdk: ServerSdk,
  params: updateCalendarParams
): Promise<updateCalendarOutput> {
  return await sdk.callTool("calendar/1.0.0/updateCalendar", params) as updateCalendarOutput;
}

/**
 * The type of the input parameter for getEventsForDay tool.
 */
export type getEventsForDayParams = {
  // The calendar day to get events for in YYYY-MM-DD format (e.g., '2025-11-04'). This tool automatically handles timezone conversion using the user's configured timezone, so you NEVER need to worry about timezone math. STRONGLY PREFERRED over getUpcomingEvents when you want all events for a specific day.
  day: string,
  // Email address of the calendar account from listAccounts
  account: string,
  // Pagination token from previous response's nextPageToken field. Only provide this if you need MORE results beyond what maxResults returned. If maxResults gave you enough events, do NOT fetch additional pages.
  pageToken?: string,
  // Calendar ID from listCalendars. If omitted, uses the user's primary calendar. Use 'primary' explicitly for primary calendar.
  calendarId?: string,
  // Maximum number of events to return (default 250, reasonable range 1-250)
  maxResults?: number
}

/**
 * The type of the output of the getEventsForDay tool.
 */
export type getEventsForDayOutput = {
  // The day that was queried (YYYY-MM-DD)
  day: string,
  events: Array<{
    id: string,
    end: string,
    start: string,
    status: (string | null),
    summary: string,
    htmlLink: (string | null),
    isAllDay: boolean,
    location: (string | null),
    attendees: (Array<{
      email: string,
      organizer: (boolean | null),
      displayName: (string | null),
      responseStatus: string
    }> | null),
    eventType: (string | null),
    organizer: ({
      email: string,
      displayName: (string | null)
    } | null),
    attachments: (Array<{
      title: string,
      fileId: string,
      fileUrl: string,
      iconLink: string,
      mimeType: string
    }> | null),
    description: (string | null),
    hangoutLink: (string | null),
    endTimeLocal: string,
    conferenceData: ({
      signature: (string | null),
      entryPoints: (Array<{
        pin: (string | null),
        uri: (string | null),
        label: (string | null),
        passcode: (string | null),
        password: (string | null),
        meetingCode: (string | null),
        entryPointType: (string | null)
      }> | null),
      conferenceId: (string | null),
      conferenceSolution: ({
        name: (string | null),
        iconUri: (string | null)
      } | null)
    } | null),
    startTimeLocal: string
  }>,
  // The user's timezone that was used for the query
  timezone: string,
  nextPageToken: (string | null)
}

/**
 * Get all events for a specific calendar day in YYYY-MM-DD format. This tool automatically handles timezone conversion using the user's configured timezone, eliminating the need for complex timezone math. STRONGLY PREFERRED over getUpcomingEvents when you want all events for a specific day.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getEventsForDay(
  sdk: ServerSdk,
  params: getEventsForDayParams
): Promise<getEventsForDayOutput> {
  return await sdk.callTool("calendar/1.0.0/getEventsForDay", params) as getEventsForDayOutput;
}

/**
 * The type of the input parameter for getUpcomingEvents tool.
 */
export type getUpcomingEventsParams = {
  // Email address of the calendar account from listAccounts
  account: string,
  // Pagination token from previous response's nextPageToken field. Only provide this if you need MORE results beyond what maxResults returned. If maxResults gave you enough events, do NOT fetch additional pages.
  pageToken?: string,
  // RFC3339 formatted timestamp for filtering events. MUST include timezone offset matching the user's local timezone, not UTC (e.g., '2024-01-15T00:00:00-05:00' for midnight Eastern Time, NOT '2024-01-15T00:00:00Z'). To get events for a specific day, use getEventsForDay instead which handles timezone math automatically.
  startDate?: string,
  // Calendar ID from listCalendars. If omitted, uses the user's primary calendar. Use 'primary' explicitly for primary calendar.
  calendarId?: string,
  // Maximum number of events to return (default 10, reasonable range 1-250)
  maxResults?: number
}

/**
 * The type of the output of the getUpcomingEvents tool.
 */
export type getUpcomingEventsOutput = {
  events: Array<{
    id: string,
    end: string,
    start: string,
    status: (string | null),
    summary: string,
    htmlLink: (string | null),
    location: (string | null),
    attendees: (Array<{
      email: string,
      organizer: (boolean | null),
      displayName: (string | null),
      responseStatus: string
    }> | null),
    eventType: (string | null),
    organizer: ({
      email: string,
      displayName: (string | null)
    } | null),
    attachments: (Array<{
      title: string,
      fileId: string,
      fileUrl: string,
      iconLink: string,
      mimeType: string
    }> | null),
    description: (string | null),
    hangoutLink: (string | null),
    conferenceData: ({
      signature: (string | null),
      entryPoints: (Array<{
        pin: (string | null),
        uri: (string | null),
        label: (string | null),
        passcode: (string | null),
        password: (string | null),
        meetingCode: (string | null),
        entryPointType: (string | null)
      }> | null),
      conferenceId: (string | null),
      conferenceSolution: ({
        name: (string | null),
        iconUri: (string | null)
      } | null)
    } | null)
  }>,
  nextPageToken: (string | null)
}

/**
 * Get upcoming calendar events with pagination support.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getUpcomingEvents(
  sdk: ServerSdk,
  params: getUpcomingEventsParams
): Promise<getUpcomingEventsOutput> {
  return await sdk.callTool("calendar/1.0.0/getUpcomingEvents", params) as getUpcomingEventsOutput;
}

/**
 * The type of the input parameter for searchEvents tool.
 */
export type searchEventsParams = {
  // Free text search query to find events. Searches event titles, descriptions, locations, and attendee names.
  query: string,
  // Email address of the calendar account from listAccounts
  account: string,
  // Pagination token from previous response's nextPageToken field. Only provide this if you need MORE results beyond what maxResults returned. If maxResults gave you enough events, do NOT fetch additional pages.
  pageToken?: string,
  // RFC3339 formatted timestamp for filtering events. MUST include timezone offset matching the user's local timezone, not UTC (e.g., '2024-01-15T00:00:00-05:00' for midnight Eastern Time, NOT '2024-01-15T00:00:00Z'). To get events for a specific day, use midnight in the user's timezone.
  startDate?: string,
  // Calendar ID from listCalendars. If omitted, uses the user's primary calendar. Use 'primary' explicitly for primary calendar.
  calendarId?: string,
  // Maximum number of events to return (default 10, reasonable range 1-250)
  maxResults?: number
}

/**
 * The type of the output of the searchEvents tool.
 */
export type searchEventsOutput = {
  events: Array<{
    id: string,
    end: string,
    start: string,
    summary: string,
    attendees: (Array<{
      email: string,
      organizer: (boolean | null),
      displayName: (string | null),
      responseStatus: string
    }> | null),
    organizer: ({
      email: string,
      displayName: (string | null)
    } | null),
    description: (string | null),
    hangoutLink: (string | null),
    conferenceData: ({
      signature: (string | null),
      entryPoints: (Array<{
        pin: (string | null),
        uri: (string | null),
        label: (string | null),
        passcode: (string | null),
        password: (string | null),
        meetingCode: (string | null),
        entryPointType: (string | null)
      }> | null),
      conferenceId: (string | null),
      conferenceSolution: ({
        name: (string | null),
        iconUri: (string | null)
      } | null)
    } | null)
  }>,
  nextPageToken: (string | null)
}

/**
 * Search calendar events
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function searchEvents(
  sdk: ServerSdk,
  params: searchEventsParams
): Promise<searchEventsOutput> {
  return await sdk.callTool("calendar/1.0.0/searchEvents", params) as searchEventsOutput;
}

/**
 * The type of the input parameter for createEvent tool.
 */
export type createEventParams = {
  // Event end time. For timed events, use RFC3339 with timezone offset matching the event's location (e.g., '2024-01-15T15:30:00-05:00' for 3:30 PM Eastern Time). For all-day events, use date only (e.g., '2024-01-16' for an event ending on the 15th). Do NOT use UTC ('Z' suffix) unless the event is explicitly in UTC timezone.
  end: string,
  // Event start time. For timed events, use RFC3339 with timezone offset matching the event's location (e.g., '2024-01-15T14:30:00-05:00' for 2:30 PM Eastern Time). For all-day events, use date only (e.g., '2024-01-15'). Do NOT use UTC ('Z' suffix) unless the event is explicitly in UTC timezone.
  start: string,
  // Email address of the calendar account from listAccounts
  account: string,
  // Event title
  summary: string,
  location: (string | null),
  // List of attendee email addresses
  attendees: (Array<{
    email: string
  }> | null),
  // Calendar ID from listCalendars. If omitted, creates event in the user's primary calendar.
  calendarId?: string,
  description: (string | null)
}

/**
 * The type of the output of the createEvent tool.
 */
export type createEventOutput = {
  event: {
    id: string,
    end: string,
    start: string,
    summary: string,
    location: (string | null),
    description: (string | null)
  }
}

/**
 * Create a new calendar event
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function createEvent(
  sdk: ServerSdk,
  params: createEventParams
): Promise<createEventOutput> {
  return await sdk.callTool("calendar/1.0.0/createEvent", params) as createEventOutput;
}

/**
 * The type of the input parameter for updateEvent tool.
 */
export type updateEventParams = {
  // Email address of the calendar account from listAccounts
  account: string,
  // Event ID from getUpcomingEvents or searchEvents
  eventId: string,
  // New start time. For timed events, use RFC3339 with timezone offset (e.g., '2024-01-15T14:30:00-05:00'). For all-day events, use date only (e.g., '2024-01-15'). If provided with newDurationMinutes, the end time will be automatically calculated.
  newStart?: string,
  // Calendar ID from listCalendars. If omitted, uses the user's primary calendar.
  calendarId?: string,
  // New event title
  newSummary?: string,
  newLocation?: string,
  newDescription?: string,
  // Duration in minutes for the event. Only used when newStart is also provided to calculate new end time.
  newDurationMinutes?: number,
  // Email addresses to add as attendees (appends to existing attendees)
  additionalAttendees?: Array<{
    email: string
  }>,
  // Google Drive file IDs to attach to the event (appends to existing attachments)
  additionalAttachments?: Array<{
    fileId?: string
  }>
}

/**
 * The type of the output of the updateEvent tool.
 */
export type updateEventOutput = {
  event: {
    id: string,
    end: string,
    start: string,
    status?: string,
    summary: string,
    htmlLink?: string,
    location?: string,
    description?: string
  }
}

/**
 * Update an existing calendar event. All update fields are optional and append-only for attachments and attendees.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function updateEvent(
  sdk: ServerSdk,
  params: updateEventParams
): Promise<updateEventOutput> {
  return await sdk.callTool("calendar/1.0.0/updateEvent", params) as updateEventOutput;
}


