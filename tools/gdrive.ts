import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "gdrive",
   serverVersion: "1.1.0",
   description: "Manage documents in your Google Drive",
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
    type: 'gdrive',
    email: string
  }>
}

/**
 * Get Google Drive accounts available on this tool for this user.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function listAccounts(
  sdk: ServerSdk,
  params: listAccountsParams
): Promise<listAccountsOutput> {
  return await sdk.callTool("gdrive/1.1.0/listAccounts", params) as listAccountsOutput;
}

/**
 * The type of the input parameter for searchGoogleDriveFiles tool.
 */
export type searchGoogleDriveFilesParams = {
  // Keywords or phrases to search for in file names and content
  query: string,
  // Google Drive account email
  account: string,
  // Token for pagination to get the next page of results
  pageToken?: (string | null),
  // Maximum number of results to return (default: 10)
  maxResults?: (number | null)
}

/**
 * The type of the output of the searchGoogleDriveFiles tool.
 */
export type searchGoogleDriveFilesOutput = {
  // The search query that was executed
  query: string,
  results: {
    files: Array<{
      id: string,
      name: string,
      type: string,
      owner: (string | null),
      webLink: string,
      lastModified: string
    }>,
    total: number,
    nextPageToken: (string | null)
  },
  // Whether the operation succeeded
  success: boolean,
  // Timestamp when results were fetched (ISO 8601)
  fetchedAt: string
}

/**
 * Search for files in Google Drive by name and content.      This tool searches for files in your Google Drive that contain the specified text in either:     - File name (e.g., "budget report.pdf")     - File content (e.g., text within a Google Doc)      Simply enter keywords or phrases to search for. The search is case-insensitive and will find partial matches.      Examples:     - "budget" - finds files with "budget" in name or content     - "quarterly review" - finds files containing "quarterly review"     - "tax documents" - finds files related to taxes      Pagination: This API returns paginated results. The response includes:     - 'files': Array of file metadata     - 'nextPageToken': String token for the next page (undefined if no more pages)      To get the next page of results, call this function again with the 'pageToken' parameter set to the 'nextPageToken' value from the previous response.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function searchGoogleDriveFiles(
  sdk: ServerSdk,
  params: searchGoogleDriveFilesParams
): Promise<searchGoogleDriveFilesOutput> {
  return await sdk.callTool("gdrive/1.1.0/searchGoogleDriveFiles", params) as searchGoogleDriveFilesOutput;
}

/**
 * The type of the input parameter for getRecentlyModifiedFiles tool.
 */
export type getRecentlyModifiedFilesParams = {
  // Google Drive account email
  account: string,
  // Token for pagination to get the next page of results
  pageToken?: (string | null),
  // Maximum number of results to return (default: 10)
  maxResults?: (number | null)
}

/**
 * The type of the output of the getRecentlyModifiedFiles tool.
 */
export type getRecentlyModifiedFilesOutput = {
  results: {
    files: Array<{
      id: string,
      name: string,
      type: string,
      owner: (string | null),
      webLink: string,
      lastModified: string
    }>,
    nextPageToken: (string | null)
  },
  // Whether the operation succeeded
  success: boolean,
  // Timestamp when results were fetched (ISO 8601)
  fetchedAt: string
}

/**
 * Get a list of recently modified files in Google Drive.      This tool retrieves files ordered by modification time, with the most recently modified files first.      Pagination: This API returns paginated results. The response includes:     - 'files': Array of file metadata     - 'nextPageToken': String token for the next page (undefined if no more pages)      To get the next page of results, call this function again with the 'pageToken' parameter set to the 'nextPageToken' value from the previous response.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getRecentlyModifiedFiles(
  sdk: ServerSdk,
  params: getRecentlyModifiedFilesParams
): Promise<getRecentlyModifiedFilesOutput> {
  return await sdk.callTool("gdrive/1.1.0/getRecentlyModifiedFiles", params) as getRecentlyModifiedFilesOutput;
}

/**
 * The type of the input parameter for getRecentlySharedFiles tool.
 */
export type getRecentlySharedFilesParams = {
  // Google Drive account email
  account: string,
  // Token for pagination to get the next page of results
  pageToken?: (string | null),
  // Maximum number of results to return (default: 10)
  maxResults?: (number | null)
}

/**
 * The type of the output of the getRecentlySharedFiles tool.
 */
export type getRecentlySharedFilesOutput = {
  results: {
    files: Array<{
      id: string,
      name: string,
      type: string,
      owner: (string | null),
      webLink: string,
      lastModified: string
    }>,
    nextPageToken: (string | null)
  },
  // Whether the operation succeeded
  success: boolean,
  // Timestamp when results were fetched (ISO 8601)
  fetchedAt: string
}

/**
 * Get a list of files recently shared with you.      This tool retrieves files that have been shared with you, ordered by when they were shared (most recent first).      Pagination: This API returns paginated results. The response includes:     - 'files': Array of file metadata     - 'nextPageToken': String token for the next page (undefined if no more pages)      To get the next page of results, call this function again with the 'pageToken' parameter set to the 'nextPageToken' value from the previous response.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getRecentlySharedFiles(
  sdk: ServerSdk,
  params: getRecentlySharedFilesParams
): Promise<getRecentlySharedFilesOutput> {
  return await sdk.callTool("gdrive/1.1.0/getRecentlySharedFiles", params) as getRecentlySharedFilesOutput;
}

/**
 * The type of the input parameter for searchGoogleDriveFolders tool.
 */
export type searchGoogleDriveFoldersParams = {
  // Search term to find folders by name (omit to list all folders)
  query?: (string | null),
  // Google Drive account email
  account: string,
  // Token for pagination to get the next page of results
  pageToken?: (string | null),
  // Maximum number of results to return (default: 10)
  maxResults?: (number | null)
}

/**
 * The type of the output of the searchGoogleDriveFolders tool.
 */
export type searchGoogleDriveFoldersOutput = {
  // The search query that was executed, or null if listing all folders
  query?: (string | null),
  results: {
    total: number,
    folders: Array<{
      id: string,
      name: string,
      owner: (string | null),
      webLink: string,
      lastModified: string
    }>,
    nextPageToken: (string | null)
  },
  // Whether the operation succeeded
  success: boolean,
  // Timestamp when results were fetched (ISO 8601)
  fetchedAt: string
}

/**
 * Search for folders in Google Drive by folder name.      This tool searches for folders in your Google Drive. It automatically filters for folders only.          Usage:     - Provide a search term to find folders with that text in their name (e.g., "Sales Reports")     - Omit the query to list all folders (sorted by most recently modified)     - The search is case-insensitive and finds partial matches in folder names          Note: Do NOT include "type:folder" in your query - folders are already filtered automatically.      Pagination: This API returns paginated results. The response includes:     - 'folders': Array of folder metadata     - 'nextPageToken': String token for the next page (undefined if no more pages)      To get the next page of results, call this function again with the 'pageToken' parameter set to the 'nextPageToken' value from the previous response.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function searchGoogleDriveFolders(
  sdk: ServerSdk,
  params: searchGoogleDriveFoldersParams
): Promise<searchGoogleDriveFoldersOutput> {
  return await sdk.callTool("gdrive/1.1.0/searchGoogleDriveFolders", params) as searchGoogleDriveFoldersOutput;
}

/**
 * The type of the input parameter for listFilesInFolder tool.
 */
export type listFilesInFolderParams = {
  // Google Drive account email
  account: string,
  // Google Drive folder ID to list files from
  folderId: string,
  // Token for pagination to get the next page of results
  pageToken?: (string | null),
  // Maximum number of results to return (default: 10)
  maxResults?: (number | null)
}

/**
 * The type of the output of the listFilesInFolder tool.
 */
export type listFilesInFolderOutput = {
  results: {
    files: Array<{
      id: string,
      name: string,
      size: (string | null),
      type: string,
      owner: (string | null),
      webLink: string,
      lastModified: string
    }>,
    folderInfo: ({
      id: string,
      name: string,
      webLink: string
    } | null),
    nextPageToken: (string | null)
  },
  // Whether the operation succeeded
  success: boolean,
  // Timestamp when results were fetched (ISO 8601)
  fetchedAt: string
}

/**
 * List all files within a specific Google Drive folder.      This tool retrieves all files contained within a given folder by folder ID.     The files are ordered alphabetically by name for consistent results.      To get a folder ID, use the searchGoogleDriveFolders tool first to find the folder.      Pagination: This API returns paginated results. The response includes:     - 'files': Array of file metadata including name, type, size, and modification time     - 'nextPageToken': String token for the next page (undefined if no more pages)     - 'folderInfo': Metadata about the folder being listed      To get the next page of results, call this function again with the 'pageToken' parameter set to the 'nextPageToken' value from the previous response.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function listFilesInFolder(
  sdk: ServerSdk,
  params: listFilesInFolderParams
): Promise<listFilesInFolderOutput> {
  return await sdk.callTool("gdrive/1.1.0/listFilesInFolder", params) as listFilesInFolderOutput;
}

/**
 * The type of the input parameter for getDocumentContentAsMarkdown tool.
 */
export type getDocumentContentAsMarkdownParams = {
  // Google Drive file ID to retrieve content from
  fileId: string,
  // Google Drive account email
  account: string
}

/**
 * The type of the output of the getDocumentContentAsMarkdown tool.
 */
export type getDocumentContentAsMarkdownOutput = {
  file: {
    id: string,
    name: string,
    content: (string | null),
    mimeType: string
  },
  // Whether the operation succeeded
  success: boolean,
  // Timestamp when content was fetched (ISO 8601)
  fetchedAt: string
}

/**
 * Get the content of a Google Drive file as text.      This tool exports the content of Google Docs, Sheets, and Slides as plain text.     The content can be used for processing or display.      For Google Docs, the content will be formatted as readable text.     For other file types, basic information will be provided.      To find a file ID, use the searchGoogleDriveFiles tool first.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getDocumentContentAsMarkdown(
  sdk: ServerSdk,
  params: getDocumentContentAsMarkdownParams
): Promise<getDocumentContentAsMarkdownOutput> {
  return await sdk.callTool("gdrive/1.1.0/getDocumentContentAsMarkdown", params) as getDocumentContentAsMarkdownOutput;
}

/**
 * The type of the input parameter for createDocument tool.
 */
export type createDocumentParams = {
  // Title for the new document
  title: string,
  // Google Drive account email
  account: string,
  // Inline content to populate the document with
  content?: string,
  // Optional Google Drive folder ID to create the document in
  folderId?: string,
  // Google Drive file ID containing content
  contentFile?: string,
  // Format of the content: 'plain' for plain text (default) or 'markdown' for markdown formatting
  contentFormat?: ('plain' | 'markdown')
}

/**
 * The type of the output of the createDocument tool.
 */
export type createDocumentOutput = {
  // Whether the operation succeeded
  success: boolean,
  document: {
    id: string,
    name: string,
    webViewLink: string
  },
  // Timestamp when document was created (ISO 8601)
  createdAt: string
}

/**
 * Create a new Google Doc with content.      This tool creates a new Google Doc with the specified title and content.     You can provide content in two ways:     1. Inline content using the 'content' parameter     2. Reference a Google Drive file containing content using the 'contentFile' parameter (file ID)      You must provide exactly one of 'content' or 'contentFile'.          Content Formatting:     - Use 'contentFormat: "plain"' (default) for plain text content     - Use 'contentFormat: "markdown"' to format content with markdown syntax:       * Headers: # H1, ## H2, ### H3, etc.       * Bold: **bold text**       * Italic: *italic text*       * Bold+Italic: ***bold and italic***      You can optionally specify a folder ID to create the document in a specific folder.     If no folder ID is provided, the document will be created in the root of My Drive.      Returns the document ID and a web link to view the document.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function createDocument(
  sdk: ServerSdk,
  params: createDocumentParams
): Promise<createDocumentOutput> {
  return await sdk.callTool("gdrive/1.1.0/createDocument", params) as createDocumentOutput;
}

/**
 * The type of the input parameter for appendToDocument tool.
 */
export type appendToDocumentParams = {
  // Google Drive document ID to append content to
  fileId: string,
  // Google Drive account email
  account: string,
  // Plain text content to append to the document
  content: string
}

/**
 * The type of the output of the appendToDocument tool.
 */
export type appendToDocumentOutput = {
  // Whether the operation succeeded
  success: boolean,
  document: {
    id: string,
    name: string,
    webViewLink: string
  },
  // Timestamp when document was updated (ISO 8601)
  updatedAt: string
}

/**
 * Append content to an existing Google Doc.      This tool appends text/markdown content to the end of an existing Google Doc.     The content will be added with proper formatting.      Note: This tool only works with Google Docs (not Sheets, Slides, etc).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function appendToDocument(
  sdk: ServerSdk,
  params: appendToDocumentParams
): Promise<appendToDocumentOutput> {
  return await sdk.callTool("gdrive/1.1.0/appendToDocument", params) as appendToDocumentOutput;
}

/**
 * The type of the input parameter for shareDocument tool.
 */
export type shareDocumentParams = {
  // Access role to grant (reader, writer, or commenter)
  role?: ('reader' | 'writer' | 'commenter'),
  // Google Drive file ID to share
  fileId: string,
  // Google Drive account email
  account: string,
  // Whether to send email notifications to users
  notifyUsers?: boolean,
  // Array of email addresses to share the file with
  emailAddresses: Array<string>
}

/**
 * The type of the output of the shareDocument tool.
 */
export type shareDocumentOutput = {
  result: {
    fileId: string,
    shared: Array<{
      id: string,
      role: string,
      email: string
    }>
  },
  // Whether the operation succeeded
  success: boolean
}

/**
 * Share a Google Drive document with other people.      This tool allows you to share a Google Drive file with one or more users by email address.     You can specify the access level (reader, commenter, or writer) for all recipients.      - reader: Can view but not edit the document     - commenter: Can add comments but not edit the document content     - writer: Can edit the document content      By default, notification emails will be sent to the recipients.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function shareDocument(
  sdk: ServerSdk,
  params: shareDocumentParams
): Promise<shareDocumentOutput> {
  return await sdk.callTool("gdrive/1.1.0/shareDocument", params) as shareDocumentOutput;
}

/**
 * The type of the input parameter for uploadFile tool.
 */
export type uploadFileParams = {
  account: string,
  // Name of the file to create in Google Drive
  fileName: string,
  // Optional Google Drive folder ID to upload into
  folderId?: string,
  // MIME type of the file (e.g., 'text/csv', 'application/pdf')
  mimeType: string,
  // Base64-encoded file content
  fileContent: string
}

/**
 * The type of the output of the uploadFile tool.
 */
export type uploadFileOutput = {
  file: {
    fileId: string,
    fileName: string,
    mimeType: string,
    webViewLink: string
  },
  // Whether the operation succeeded
  success: boolean,
  // Timestamp when file was uploaded (ISO 8601)
  createdAt: string
}

/**
 * Upload a file to Google Drive.      This tool uploads a file to Google Drive with the specified name and content.     The file content must be base64-encoded.      You can optionally specify a folder ID to upload the file into a specific folder.     If no folder ID is provided, the file will be uploaded to the root of My Drive.      Common MIME types:     - CSV: 'text/csv'     - PDF: 'application/pdf'     - Text: 'text/plain'     - JSON: 'application/json'     - PNG: 'image/png'     - JPEG: 'image/jpeg'      Returns the file ID and a web link to view the file in Google Drive.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function uploadFile(
  sdk: ServerSdk,
  params: uploadFileParams
): Promise<uploadFileOutput> {
  return await sdk.callTool("gdrive/1.1.0/uploadFile", params) as uploadFileOutput;
}

/**
 * The type of the input parameter for createSheet tool.
 */
export type createSheetParams = {
  // Title for the new spreadsheet
  title: string,
  // Google Drive account email
  account: string,
  // CSV data to populate the sheet with (inline)
  csvData?: string,
  // Optional Google Drive folder ID to create the spreadsheet in
  folderId?: string,
  // Google Drive file ID containing CSV data
  csvDataFile?: string
}

/**
 * The type of the output of the createSheet tool.
 */
export type createSheetOutput = {
  sheet: {
    title: string,
    spreadsheetId: string,
    spreadsheetUrl: string
  },
  // Whether the operation succeeded
  success: boolean,
  // Timestamp when spreadsheet was created (ISO 8601)
  createdAt: string
}

/**
 * Create a new Google Sheet from CSV data.      This tool creates a new Google Sheet with the specified title and populates it with data from CSV format.     You can provide CSV data in two ways:     1. Inline CSV data using the 'csvData' parameter     2. Reference a Google Drive file containing CSV data using the 'csvDataFile' parameter (file ID)      You must provide exactly one of 'csvData' or 'csvDataFile'.      The CSV data should be properly formatted with commas separating columns and newlines separating rows.     Quoted values are supported for cells containing commas or quotes.      You can optionally specify a folder ID to create the spreadsheet in a specific folder.     If no folder ID is provided, the spreadsheet will be created in the root of My Drive.      Returns the spreadsheet ID and a web link to view the sheet.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function createSheet(
  sdk: ServerSdk,
  params: createSheetParams
): Promise<createSheetOutput> {
  return await sdk.callTool("gdrive/1.1.0/createSheet", params) as createSheetOutput;
}


