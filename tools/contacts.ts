import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "contacts",
   serverVersion: "0.0.1",
   description: "Read only access to your Google Contacts data",
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
    type: 'google',
    email: string
  }>
}

/**
 * Get Google accounts available for contacts access
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function listAccounts(
  sdk: ServerSdk,
  params: listAccountsParams
): Promise<listAccountsOutput> {
  return await sdk.callTool("contacts/0.0.1/listAccounts", params) as listAccountsOutput;
}

/**
 * The type of the input parameter for listContacts tool.
 */
export type listContactsParams = {
  account: string,
  pageToken: (string | null),
  maxResults: (number | null)
}

/**
 * The type of the output of the listContacts tool.
 */
export type listContactsOutput = {
  contacts: Array<{
    name?: string,
    photo?: (string | null),
    phoneNumbers?: Array<string>,
    resourceName: string,
    organizations?: Array<string>,
    emailAddresses?: Array<string>
  }>,
  nextPageToken: (string | null)
}

/**
 * List all contacts for the authenticated user
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function listContacts(
  sdk: ServerSdk,
  params: listContactsParams
): Promise<listContactsOutput> {
  return await sdk.callTool("contacts/0.0.1/listContacts", params) as listContactsOutput;
}

/**
 * The type of the input parameter for searchContacts tool.
 */
export type searchContactsParams = {
  query: string,
  account: string,
  maxResults: (number | null)
}

/**
 * The type of the output of the searchContacts tool.
 */
export type searchContactsOutput = {
  contacts: Array<{
    name?: string,
    photo?: (string | null),
    phoneNumbers?: Array<string>,
    resourceName: string,
    organizations?: Array<string>,
    emailAddresses?: Array<string>
  }>
}

/**
 * Search contacts by name, email, or other fields
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function searchContacts(
  sdk: ServerSdk,
  params: searchContactsParams
): Promise<searchContactsOutput> {
  return await sdk.callTool("contacts/0.0.1/searchContacts", params) as searchContactsOutput;
}

/**
 * The type of the input parameter for getContact tool.
 */
export type getContactParams = {
  account: string,
  resourceName: string
}

/**
 * The type of the output of the getContact tool.
 */
export type getContactOutput = {
  contact: {
    name?: string,
    photo?: (string | null),
    phoneNumbers?: Array<string>,
    resourceName: string,
    organizations?: Array<string>,
    emailAddresses?: Array<string>
  }
}

/**
 * Get detailed information about a specific contact
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getContact(
  sdk: ServerSdk,
  params: getContactParams
): Promise<getContactOutput> {
  return await sdk.callTool("contacts/0.0.1/getContact", params) as getContactOutput;
}

/**
 * The type of the input parameter for listContactGroups tool.
 */
export type listContactGroupsParams = {
  account: string
}

/**
 * The type of the output of the listContactGroups tool.
 */
export type listContactGroupsOutput = {
  groups: Array<{
    name: string,
    groupType: string,
    memberCount: number,
    resourceName: string
  }>
}

/**
 * List all contact groups for the authenticated user
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function listContactGroups(
  sdk: ServerSdk,
  params: listContactGroupsParams
): Promise<listContactGroupsOutput> {
  return await sdk.callTool("contacts/0.0.1/listContactGroups", params) as listContactGroupsOutput;
}

/**
 * The type of the input parameter for getContactsInGroup tool.
 */
export type getContactsInGroupParams = {
  account: string,
  maxResults: (number | null),
  groupResourceName: string
}

/**
 * The type of the output of the getContactsInGroup tool.
 */
export type getContactsInGroupOutput = {
  contacts: Array<{
    name?: string,
    photo?: (string | null),
    phoneNumbers?: Array<string>,
    resourceName: string,
    organizations?: Array<string>,
    emailAddresses?: Array<string>
  }>
}

/**
 * Get all contacts in a specific contact group
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function getContactsInGroup(
  sdk: ServerSdk,
  params: getContactsInGroupParams
): Promise<getContactsInGroupOutput> {
  return await sdk.callTool("contacts/0.0.1/getContactsInGroup", params) as getContactsInGroupOutput;
}


