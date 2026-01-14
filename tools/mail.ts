import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "mail",
   serverVersion: "1.3.2",
   description: "Access and send email messages with any connected Gmail accounts.",
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
    type: 'gmail',
    email: string
  }>
}

/**
 * Get email accounts available on this tool for this user.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function listAccounts(
  sdk: ServerSdk,
  params: listAccountsParams
): Promise<listAccountsOutput> {
  return await sdk.callTool("mail/1.3.2/listAccounts", params) as listAccountsOutput;
}

/**
 * The type of the input parameter for getLabels tool.
 */
export type getLabelsParams = {
  account: string
}

/**
 * The type of the output of the getLabels tool.
 */
export type getLabelsOutput = {
  labels: Array<{
    id: string,
    name: string,
    type: 'gmail_label'
  }>
}

/**
 * Get all email labels available for the authenticated user
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getLabels(
  sdk: ServerSdk,
  params: getLabelsParams
): Promise<getLabelsOutput> {
  return await sdk.callTool("mail/1.3.2/getLabels", params) as getLabelsOutput;
}

/**
 * The type of the input parameter for getLabelDetails tool.
 */
export type getLabelDetailsParams = {
  account: string,
  labelId: string
}

/**
 * The type of the output of the getLabelDetails tool.
 */
export type getLabelDetailsOutput = {
  label: {
    id: string,
    name: string,
    type: 'gmail_label',
    labelType?: string,
    threadsTotal?: number,
    messagesTotal?: number,
    threadsUnread?: number,
    messagesUnread?: number,
    labelListVisibility?: string,
    messageListVisibility?: string
  }
}

/**
 * Get detailed information about a specific label, including message and thread counts
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getLabelDetails(
  sdk: ServerSdk,
  params: getLabelDetailsParams
): Promise<getLabelDetailsOutput> {
  return await sdk.callTool("mail/1.3.2/getLabelDetails", params) as getLabelDetailsOutput;
}

/**
 * The type of the input parameter for getMessages tool.
 */
export type getMessagesParams = {
  account: string,
  labelIds: (Array<string> | null),
  pageToken: (string | null),
  maxResults: (number | null)
}

/**
 * The type of the output of the getMessages tool.
 */
export type getMessagesOutput = {
  messages: Array<{
    id: string,
    to: (string | null),
    date: (string | null),
    from: (string | null),
    snippet: (string | null),
    subject: (string | null),
    isUnread: boolean,
    labelIds?: Array<string>,
    threadId: string,
    hasAttachments: boolean
  }>,
  nextPageToken: (string | null)
}

/**
 * Get email messages with filtering options
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getMessages(
  sdk: ServerSdk,
  params: getMessagesParams
): Promise<getMessagesOutput> {
  return await sdk.callTool("mail/1.3.2/getMessages", params) as getMessagesOutput;
}

/**
 * The type of the input parameter for searchMessages tool.
 */
export type searchMessagesParams = {
  // Gmail search query string. Supports Gmail search operators:
  // - from:sender@example.com - emails from a specific sender
  // - to:recipient@example.com - emails to a specific recipient
  // - subject:keyword - emails with keyword in subject
  // - has:attachment - emails with attachments
  // - is:unread / is:read - filter by read status
  // - label:labelname - emails with a specific label
  // - after:YYYY-MM-DD - emails after a date (use user's local date, timezone is handled automatically)
  // - before:YYYY-MM-DD - emails before a date (use user's local date, timezone is handled automatically)
  // 
  // Date filtering examples (dates should be in user's local timezone):
  // - "from:boss@company.com after:2025-01-15 before:2025-01-17" - emails from boss on Jan 15-16
  // - "subject:invoice after:2025-01-01" - invoices since Jan 1
  // 
  // Multiple operators can be combined with spaces (implicit AND).
  query: string,
  account: string,
  pageToken: (string | null),
  maxResults: (number | null)
}

/**
 * The type of the output of the searchMessages tool.
 */
export type searchMessagesOutput = {
  messages: Array<{
    id: string,
    to: (string | null),
    date: (string | null),
    from: (string | null),
    snippet: (string | null),
    subject: (string | null),
    isUnread: boolean,
    labelIds?: Array<string>,
    threadId: string,
    hasAttachments: boolean
  }>,
  nextPageToken: (string | null)
}

/**
 * Search email messages using Gmail search query syntax. For date-based searches, use after:YYYY-MM-DD and before:YYYY-MM-DD operators with dates in the user's local timezone (the tool automatically handles timezone conversion). Example: to find emails from a sender on a specific date, use 'from:sender@example.com after:2025-11-17 before:2025-11-19' for emails on Nov 18.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function searchMessages(
  sdk: ServerSdk,
  params: searchMessagesParams
): Promise<searchMessagesOutput> {
  return await sdk.callTool("mail/1.3.2/searchMessages", params) as searchMessagesOutput;
}

/**
 * The type of the input parameter for getMessage tool.
 */
export type getMessageParams = {
  account: string,
  messageId: string
}

/**
 * The type of the output of the getMessage tool.
 */
export type getMessageOutput = {
  message: {
    body: (string | null),
    flags: string,
    links: Array<string>,
    sender: string,
    subject: string,
    labelIds?: Array<string>,
    receiver: string,
    threadId?: string,
    timestamp: (string | null),
    message_id: (string | null),
    attachments?: Array<{
      size?: number,
      filename: string,
      mimeType: string,
      attachmentId: string
    }>,
    hasAttachments: boolean,
    listUnsubscribe?: string,
    listUnsubscribePost?: string
  }
}

/**
 * Get the full content of a specific email message by ID
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getMessage(
  sdk: ServerSdk,
  params: getMessageParams
): Promise<getMessageOutput> {
  return await sdk.callTool("mail/1.3.2/getMessage", params) as getMessageOutput;
}

/**
 * The type of the input parameter for createDraft tool.
 */
export type createDraftParams = {
  cc: (Array<string> | null),
  to: Array<string>,
  bcc: (Array<string> | null),
  body: string,
  isHtml: (boolean | null),
  account: string,
  subject: string,
  // Optional Gmail thread ID to continue an existing conversation. Use the threadId from a previous sendMessage response or searchMessages result to keep emails in the same thread.
  threadId?: string,
  // Optional array of attachments to include in the email
  attachments?: Array<{
    url?: string,
    data?: string,
    filename: string,
    mimeType: string
  }>
}

/**
 * The type of the output of the createDraft tool.
 */
export type createDraftOutput = {
  draft: {
    id: string,
    message: ({
      id: string,
      labelIds: (Array<string> | null),
      threadId: (string | null)
    } | null)
  }
}

/**
 * Create a draft email without sending it. The body supports markdown formatting which will be converted to nicely styled HTML. To continue an existing email thread, pass the threadId from a previous message.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function createDraft(
  sdk: ServerSdk,
  params: createDraftParams
): Promise<createDraftOutput> {
  return await sdk.callTool("mail/1.3.2/createDraft", params) as createDraftOutput;
}

/**
 * The type of the input parameter for sendMessage tool.
 */
export type sendMessageParams = {
  cc: (Array<string> | null),
  to: Array<string>,
  bcc: (Array<string> | null),
  body: string,
  isHtml: (boolean | null),
  account: string,
  subject: string,
  // Optional Gmail thread ID to continue an existing conversation. Use the threadId from a previous sendMessage response or searchMessages result to keep emails in the same thread.
  threadId?: string,
  // Optional array of attachments to include in the email
  attachments?: Array<{
    url?: string,
    data?: string,
    filename: string,
    mimeType: string
  }>
}

/**
 * The type of the output of the sendMessage tool.
 */
export type sendMessageOutput = {
  message: {
    id: string,
    labelIds: (Array<string> | null),
    threadId: (string | null)
  }
}

/**
 * Send an email immediately. The body supports markdown formatting which will be converted to nicely styled HTML. To continue an existing email thread (e.g., replying to a conversation), pass the threadId from a previous sendMessage response or searchMessages result.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function sendMessage(
  sdk: ServerSdk,
  params: sendMessageParams
): Promise<sendMessageOutput> {
  return await sdk.callTool("mail/1.3.2/sendMessage", params) as sendMessageOutput;
}

/**
 * The type of the input parameter for modifyMessageLabels tool.
 */
export type modifyMessageLabelsParams = {
  account: string,
  messageId: string,
  addLabelIds: (Array<string> | null),
  removeLabelIds: (Array<string> | null)
}

/**
 * The type of the output of the modifyMessageLabels tool.
 */
export type modifyMessageLabelsOutput = {
  message: {
    id: string,
    labelIds: (Array<string> | null),
    threadId: (string | null)
  }
}

/**
 * Add or remove labels from an email message
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function modifyMessageLabels(
  sdk: ServerSdk,
  params: modifyMessageLabelsParams
): Promise<modifyMessageLabelsOutput> {
  return await sdk.callTool("mail/1.3.2/modifyMessageLabels", params) as modifyMessageLabelsOutput;
}

/**
 * The type of the input parameter for archiveMessage tool.
 */
export type archiveMessageParams = {
  account: string,
  messageId: string
}

/**
 * The type of the output of the archiveMessage tool.
 */
export type archiveMessageOutput = {
  message: {
    id: string,
    labelIds: (Array<string> | null),
    threadId: (string | null)
  }
}

/**
 * Archive an email message by removing the INBOX label
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function archiveMessage(
  sdk: ServerSdk,
  params: archiveMessageParams
): Promise<archiveMessageOutput> {
  return await sdk.callTool("mail/1.3.2/archiveMessage", params) as archiveMessageOutput;
}

/**
 * The type of the input parameter for getAttachment tool.
 */
export type getAttachmentParams = {
  account: string,
  messageId: string,
  attachmentId: string
}

/**
 * The type of the output of the getAttachment tool.
 */
export type getAttachmentOutput = {
  attachment: {
    data: string,
    size: number,
    filename?: string,
    mimeType?: string
  }
}

/**
 * Download an attachment from an email message. Use the attachmentId from the message metadata.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getAttachment(
  sdk: ServerSdk,
  params: getAttachmentParams
): Promise<getAttachmentOutput> {
  return await sdk.callTool("mail/1.3.2/getAttachment", params) as getAttachmentOutput;
}

/**
 * The type of the input parameter for forwardMessage tool.
 */
export type forwardMessageParams = {
  // Optional CC recipients
  cc: (Array<string> | null),
  // Recipients of the forwarded email
  to: Array<string>,
  // Optional BCC recipients
  bcc: (Array<string> | null),
  // The email account to send from
  account: string,
  // The ID of the message to forward
  messageId: string,
  // Optional message to include before the forwarded content
  additionalMessage?: string
}

/**
 * The type of the output of the forwardMessage tool.
 */
export type forwardMessageOutput = {
  message: {
    id: string,
    labelIds: (Array<string> | null),
    threadId: (string | null)
  }
}

/**
 * Forward an email message to new recipients. Preserves the original message content, formatting, and all attachments. You can optionally include an additional message that will appear before the forwarded content.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function forwardMessage(
  sdk: ServerSdk,
  params: forwardMessageParams
): Promise<forwardMessageOutput> {
  return await sdk.callTool("mail/1.3.2/forwardMessage", params) as forwardMessageOutput;
}


