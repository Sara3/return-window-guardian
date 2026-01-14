import type { ServerSdk } from "@dev-agents/sdk-server";

/**
 * This file is auto-generated. DO NOT modify directly.
 * Any changes will be overwritten when the code is regenerated.
 */

export const SERVER_INFO = {
   serverName: "31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance",
   serverVersion: "1.0.0",
   description: "Custom MCP server",
} as const;

/**
 * The type of the input parameter for connect_account tool.
 */
export type connect_accountParams = {

}

/**
 * The type of the output of the connect_account tool.
 */
export type connect_accountOutput = any

/**
 * Connect a bank, credit card, or investment account to get started. Opens a secure browser window where the user can safely authenticate with their financial institution. IMPORTANT: Only call this tool one at a time - wait for the user to complete the connection before calling again. Encourage users to connect multiple institutions (checking, savings, credit cards, investments) to get the full value of budgeting, transaction tracking, and financial insights across all their accounts.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function connect_account(
  sdk: ServerSdk,
  params: connect_accountParams
): Promise<connect_accountOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/connect-account", params) as connect_accountOutput;
}

/**
 * The type of the input parameter for get_account_status tool.
 */
export type get_account_statusParams = {

}

/**
 * The type of the output of the get_account_status tool.
 */
export type get_account_statusOutput = any

/**
 * View connected institutions with balance details, connection health, and last sync timestamps. Use this before updating or disconnecting an institution.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_account_status(
  sdk: ServerSdk,
  params: get_account_statusParams
): Promise<get_account_statusOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/get-account-status", params) as get_account_statusOutput;
}

/**
 * The type of the input parameter for update_account_link tool.
 */
export type update_account_linkParams = {
  // The account's item_id to update (get this from get-account-status)
  item_id: string
}

/**
 * The type of the output of the update_account_link tool.
 */
export type update_account_linkOutput = any

/**
 * IMPORTANT: Only use this tool when an account connection is broken. ALWAYS call get-account-status FIRST to verify the connection shows an error status (⚠️) before calling this tool. This tool updates a broken or expired account connection by re-authenticating with the financial institution. Returns a secure link for the user to complete re-authentication. After the user completes the update, they should say 'I've updated it, please refresh my transactions' to sync their data.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function update_account_link(
  sdk: ServerSdk,
  params: update_account_linkParams
): Promise<update_account_linkOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/update-account-link", params) as update_account_linkOutput;
}

/**
 * The type of the input parameter for disconnect_account tool.
 */
export type disconnect_accountParams = {
  // The account's item_id to disconnect (get this from get-account-status)
  item_id: string
}

/**
 * The type of the output of the disconnect_account tool.
 */
export type disconnect_accountOutput = any

/**
 * Remove a connected account and revoke access. This will delete all stored connection data for the specified account.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function disconnect_account(
  sdk: ServerSdk,
  params: disconnect_accountParams
): Promise<disconnect_accountOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/disconnect-account", params) as disconnect_accountOutput;
}

/**
 * The type of the input parameter for financial_summary tool.
 */
export type financial_summaryParams = {

}

/**
 * The type of the output of the financial_summary tool.
 */
export type financial_summaryOutput = {
  // View type identifier
  view: 'financial-summary',
  summary?: {
    netWorth: number,
    lastSynced: (string | null),
    assetsTotal: number,
    liabilities: {
      total: number,
      credit: number,
      student: number,
      mortgage: number
    },
    netWorthTrend: ({
      direction: ('up' | 'down' | 'flat'),
      amountChange: number,
      baselineDate: string,
      percentChange: (number | null)
    } | null),
    totalAccounts: number,
    liabilitiesTotal: number,
    accountsByCategory: {

    }
  },
  // Array of account details
  accounts?: Array<any>,
  dashboard: {
    hero: {
      trend: ({
        label: string,
        direction: ('up' | 'down' | 'flat'),
        amountChange: number,
        baselineDate: string,
        percentChange: (number | null)
      } | null),
      hasData: boolean,
      netWorth: number,
      nextSteps: Array<{
        id: string,
        icon: string,
        kind: ('tool' | 'prompt'),
        tool?: string,
        label: string,
        prompt?: string,
        variant?: ('primary' | 'secondary'),
        toolArgs?: {

        },
        description?: string,
        promptFallback: string
      }>,
      assetsTotal: number,
      lastUpdatedAt: (string | null),
      liabilitiesTotal: number
    }
  },
  // Historical net worth snapshots (up to 8, ordered newest to oldest)
  snapshots?: Array<{
    id: string,
    user_id: string,
    created_at: (string | null),
    updated_at: (string | null),
    assets_total: number,
    snapshot_date: string,
    net_worth_amount: number,
    liabilities_total: number
  }>
}

/**
 * Get a comprehensive overview of your financial status including net worth, assets, liabilities, and week-over-week trends. Shows account balances grouped by type and provides suggested next steps. This is a read-only tool that provides instant access to your financial data stored in the database.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function financial_summary(
  sdk: ServerSdk,
  params: financial_summaryParams
): Promise<financial_summaryOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/financial-summary", params) as financial_summaryOutput;
}

/**
 * The type of the input parameter for batch_update_categories tool.
 */
export type batch_update_categoriesParams = {
  // Array of transaction updates (recommended batch size: 30)
  updates: Array<{
    category: string,
    confidence?: number,
    transactionId: string
  }>
}

/**
 * The type of the output of the batch_update_categories tool.
 */
export type batch_update_categoriesOutput = {
  success: boolean,
  updatedCount: number
}

/**
 * Update categories for multiple transactions at once. Use this when the user asks you to recategorize transactions.  Process transactions in batches of ~30 at a time. For each transaction, assign an appropriate category.  These updates do NOT mark transactions as manually categorized - they can still be recategorized by background sync if the user updates their categorization rules.  Common categories: - FOOD_AND_DRINK_COFFEE, FOOD_AND_DRINK_RESTAURANT, FOOD_AND_DRINK_GROCERIES - TRANSPORTATION_GAS, TRANSPORTATION_TAXIS_AND_RIDE_SHARES - ENTERTAINMENT_TV_AND_MOVIES, ENTERTAINMENT_MUSIC_AND_AUDIO - GENERAL_MERCHANDISE_ONLINE_MARKETPLACES, GENERAL_MERCHANDISE_ELECTRONICS - RENT_AND_UTILITIES_INTERNET_AND_CABLE, RENT_AND_UTILITIES_GAS_AND_ELECTRICITY
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function batch_update_categories(
  sdk: ServerSdk,
  params: batch_update_categoriesParams
): Promise<batch_update_categoriesOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/batch-update-categories", params) as batch_update_categoriesOutput;
}

/**
 * The type of the input parameter for set_transaction_category tool.
 */
export type set_transaction_categoryParams = {
  // New category to assign (e.g., 'FOOD_AND_DRINK_COFFEE'). If omitted, accepts the current category.
  category?: string,
  // The transaction ID to update
  transactionId: string
}

/**
 * The type of the output of the set_transaction_category tool.
 */
export type set_transaction_categoryOutput = {
  success: boolean,
  // The final category after update
  category: string,
  transactionId: string
}

/**
 * Confirm or change a SINGLE transaction's category and mark it as manually categorized. Use this when the user explicitly confirms a category for one transaction. The transaction will NOT be changed by future background recategorizations.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function set_transaction_category(
  sdk: ServerSdk,
  params: set_transaction_categoryParams
): Promise<set_transaction_categoryOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/set-transaction-category", params) as set_transaction_categoryOutput;
}

/**
 * The type of the input parameter for get_financial_context tool.
 */
export type get_financial_contextParams = {

}

/**
 * The type of the output of the get_financial_context tool.
 */
export type get_financial_contextOutput = {
  // The Financial Context content, or null if not created yet
  content: (string | null),
  // When the context was last updated (ISO format)
  updatedAt: (string | null)
}

/**
 * Retrieve the user's Financial Context - their personal financial document.  This document contains important information about the user's financial situation that you should reference when: - Providing personalized financial advice - Understanding spending patterns and goals - Making budget recommendations - Analyzing transactions in context - Discussing financial planning  If empty or not yet created, consider asking the user about their financial goals, income, expenses, and situation, then save it using update-financial-context.  Returns the document content and last updated timestamp, or null if not yet created.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_financial_context(
  sdk: ServerSdk,
  params: get_financial_contextParams
): Promise<get_financial_contextOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/get-financial-context", params) as get_financial_contextOutput;
}

/**
 * The type of the input parameter for update_financial_context tool.
 */
export type update_financial_contextParams = {
  // The complete Financial Context content (replaces existing)
  content: string
}

/**
 * The type of the output of the update_financial_context tool.
 */
export type update_financial_contextOutput = {
  // Whether the update was successful
  success: boolean,
  // Length of saved content in characters
  contentLength: number
}

/**
 * Update the user's Financial Context - their personal financial situation document.  Use this to record important information learned during conversations: - Financial goals (retirement, house purchase, debt payoff, emergency fund) - Income sources and approximate amounts - Regular expenses and financial commitments - Investment preferences and risk tolerance - Life circumstances affecting finances (dependents, job situation, location) - Spending habits and patterns observed - Budget preferences and constraints - Specific merchant context (e.g., "Locale near my house is a grocery store, not a restaurant")  The content should be free-form text written in a way that helps future conversations understand the user's complete financial picture. Think of it like a CLAUDE.md file but for personal finance.  IMPORTANT: This REPLACES the entire document. Always call get-financial-context first to preserve existing content and append/update it rather than overwriting.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function update_financial_context(
  sdk: ServerSdk,
  params: update_financial_contextParams
): Promise<update_financial_contextOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/update-financial-context", params) as update_financial_contextOutput;
}

/**
 * The type of the input parameter for get_opinion tool.
 */
export type get_opinionParams = {
  // The ID of the opinion to retrieve (e.g., 'graham-20-percent-rule')
  opinion_id: string
}

/**
 * The type of the output of the get_opinion tool.
 */
export type get_opinionOutput = any

/**
 * Get an expert opinion prompt to apply to your financial analysis. Returns the full analysis instructions for a specific methodology (e.g., Graham Stephan's 20% Rule, Minimalist budgeting).
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_opinion(
  sdk: ServerSdk,
  params: get_opinionParams
): Promise<get_opinionOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/get-opinion", params) as get_opinionOutput;
}

/**
 * The type of the input parameter for get_budgets tool.
 */
export type get_budgetsParams = {
  // Optional: Get specific budget by ID. If omitted, returns all budgets.
  budget_id?: string,
  // Include matching transactions in the response (default: false)
  showTransactions?: boolean
}

/**
 * The type of the output of the get_budgets tool.
 */
export type get_budgetsOutput = {
  // List of budgets with current spending status. Each budget may be in different states: processing, error, ready, or failed.
  budgets: Array<{
    id: string,
    error?: string,
    spent: number,
    title: string,
    amount: number,
    period: string,
    status: string,
    dateRange?: {
      end: string,
      start: string
    },
    remaining: number,
    percentage: number,
    transactions?: Array<{
      date: string,
      amount: number,
      pending: boolean,
      category: string,
      description: string,
      account_name: string
    }>,
    processingError?: string,
    customPeriodDays?: number,
    processingStatus?: string,
    transactionCount: number
  }>,
  // Example budget descriptions to help users create their first budget
  exampleBudgets: Array<string>,
  // Detailed guidance for creating and managing budgets, including time period options and example flows
  widgetInstructions: string
}

/**
 * CALL THIS FIRST when user asks about budgets, wants to create a budget, or view budget status. Shows existing budgets with spending progress or provides creation guidance if no budgets exist. Use showTransactions=true to include matching transactions, or false (default) to get just spending totals. Optionally filter by budget_id to get a specific budget. Returns widget visualization showing budget progress bars.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_budgets(
  sdk: ServerSdk,
  params: get_budgetsParams
): Promise<get_budgetsOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/get-budgets", params) as get_budgetsOutput;
}

/**
 * The type of the input parameter for create_budget tool.
 */
export type create_budgetParams = {
  // Display name for the budget (e.g., 'Coffee Shop Budget')
  title: string,
  // Budget type: 'rolling' for last N days, or fixed periods (weekly/biweekly/monthly/quarterly/yearly)
  time_period: ('rolling' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'),
  // Dollar amount limit for the budget
  budget_amount: number,
  // Natural language filter criteria describing which transactions to include
  filter_prompt: string,
  // Required for 'rolling' budgets: number of days to track (e.g., 7, 30, 90)
  custom_period_days?: number,
  // Required for fixed budgets: anchor date in YYYY-MM-DD format (e.g., '2025-01-15' for monthly budget starting on 15th)
  fixed_period_start_date?: string
}

/**
 * The type of the output of the create_budget tool.
 */
export type create_budgetOutput = any

/**
 * Create a new budget after calling get-budgets first. Two budget types: ROLLING (last N days, continuously rolling) or FIXED (calendar-based with custom start date). For rolling budgets: provide time_period='rolling' and custom_period_days. For fixed budgets: provide time_period (weekly/biweekly/monthly/quarterly/yearly) and fixed_period_start_date in YYYY-MM-DD format.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function create_budget(
  sdk: ServerSdk,
  params: create_budgetParams
): Promise<create_budgetOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/create-budget", params) as create_budgetOutput;
}

/**
 * The type of the input parameter for update_budget_rules tool.
 */
export type update_budget_rulesParams = {
  // Budget ID to update (required - get from get-budgets tool)
  id: string,
  // Optional: Update display name for the budget
  title?: string,
  // Optional: Update budget type
  time_period?: ('rolling' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'),
  // Optional: Update dollar amount limit
  budget_amount?: number,
  // Optional: Update natural language filter criteria
  filter_prompt?: string,
  // Optional: Update number of days for rolling budgets
  custom_period_days?: number,
  // Optional: Update anchor date for fixed budgets (YYYY-MM-DD)
  fixed_period_start_date?: string
}

/**
 * The type of the output of the update_budget_rules tool.
 */
export type update_budget_rulesOutput = any

/**
 * Update an existing budget's configuration (title, filter rules, amount, or time period). Call get-budgets first to get the budget ID. All parameters except 'id' are optional - only provide the fields you want to change. After updating, transactions will be re-matched against the new rules.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function update_budget_rules(
  sdk: ServerSdk,
  params: update_budget_rulesParams
): Promise<update_budget_rulesOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/update-budget-rules", params) as update_budget_rulesOutput;
}

/**
 * The type of the input parameter for delete_budget tool.
 */
export type delete_budgetParams = {
  // Budget ID to delete
  id: string
}

/**
 * The type of the output of the delete_budget tool.
 */
export type delete_budgetOutput = any

/**
 * Delete a budget by ID. Use get-budgets to find the budget ID.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function delete_budget(
  sdk: ServerSdk,
  params: delete_budgetParams
): Promise<delete_budgetOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/delete-budget", params) as delete_budgetOutput;
}

/**
 * The type of the input parameter for get_transactions tool.
 */
export type get_transactionsParams = {
  // End date in YYYY-MM-DD format (default: today)
  end_date?: string,
  // Filter transactions tagged to a specific budget (exact match). Get budget IDs by calling get-budgets tool first. Example: 'budget_123'
  budget_id?: string,
  // Filter transactions by category names (case-insensitive partial match). Searches AI-generated custom categories. Multiple categories use OR logic. Example: ['Food', 'Transport'] will match 'Food & Dining', 'Transportation', etc.
  categories?: Array<string>,
  // Start date in YYYY-MM-DD format (default: all available data)
  start_date?: string,
  // Filter transactions by account IDs (exact match). Get account IDs by calling get-account-status tool first. Example: ['account_123', 'account_456']
  account_ids?: Array<string>,
  // Show only pending transactions (exact match). Useful for cash flow management and seeing what charges haven't cleared yet. Cannot be used with exclude_pending.
  pending_only?: boolean,
  // Exclude pending transactions (exact match). Shows only confirmed/cleared transactions. Useful for accurate spending analysis. Cannot be used with pending_only.
  exclude_pending?: boolean
}

/**
 * The type of the output of the get_transactions tool.
 */
export type get_transactionsOutput = {
  summary: {
    dateRange: {
      end: string,
      start: string
    },
    transactionCount: number
  },
  // Array of transactions with AI-powered categorization
  transactions: Array<{
    date: string,
    amount: number,
    pending: boolean,
    category: string,
    description: string,
    account_name: string,
    transaction_id: string,
    category_confidence: (number | null)
  }>,
  // Guidelines for analyzing transaction data (spending categories, large expenses, data structure)
  dataInstructions: string,
  availableCategories: {

  },
  // Recommendations for visualizing transaction data (spending by category, trends over time, top merchants, account breakdown)
  visualizationInstructions: string
}

/**
 * Retrieve categorized transaction data from the user's connected financial institution. Returns structured transaction data with AI-powered categorization, along with analysis and visualization guidance.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_transactions(
  sdk: ServerSdk,
  params: get_transactionsParams
): Promise<get_transactionsOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/get-transactions", params) as get_transactionsOutput;
}

/**
 * The type of the input parameter for get_raw_transactions tool.
 */
export type get_raw_transactionsParams = {
  // End date in YYYY-MM-DD format (default: today)
  end_date?: string,
  // Start date in YYYY-MM-DD format (default: 90 days ago)
  start_date?: string
}

/**
 * The type of the output of the get_raw_transactions tool.
 */
export type get_raw_transactionsOutput = any

/**
 * Download raw transaction data as CSV without AI categorization. Use this when you need the pure data export for external analysis or spreadsheet tools. For analyzed data with categories, use 'get-transactions' instead.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_raw_transactions(
  sdk: ServerSdk,
  params: get_raw_transactionsParams
): Promise<get_raw_transactionsOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/get-raw-transactions", params) as get_raw_transactionsOutput;
}

/**
 * The type of the input parameter for get_investment_holdings tool.
 */
export type get_investment_holdingsParams = {

}

/**
 * The type of the output of the get_investment_holdings tool.
 */
export type get_investment_holdingsOutput = {
  summary: {
    totalValue: number,
    accountCount: number,
    holdingCount: number,
    totalGainLoss: (number | null),
    totalCostBasis: (number | null),
    totalGainLossPercentage: (number | null)
  },
  // Array of investment holdings with current valuations and performance metrics
  holdings: Array<{
    quantity: number,
    gain_loss: (number | null),
    account_id: string,
    cost_basis: (number | null),
    security_id: string,
    account_name: string,
    account_type: (string | null),
    security_name: (string | null),
    security_type: (string | null),
    ticker_symbol: (string | null),
    account_subtype: (string | null),
    security_subtype: (string | null),
    institution_price: number,
    institution_value: number,
    iso_currency_code: (string | null),
    gain_loss_percentage: (number | null),
    institution_price_as_of: (string | null),
    unofficial_currency_code: (string | null)
  }>
}

/**
 * View your investment portfolio across all connected investment accounts (401k, IRA, brokerage, crypto exchange). Shows total portfolio value, breakdown by security with current prices, quantity held, and gain/loss if cost basis is available. This is a read-only tool that provides instant access to your holdings data stored in the database.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_investment_holdings(
  sdk: ServerSdk,
  params: get_investment_holdingsParams
): Promise<get_investment_holdingsOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/get-investment-holdings", params) as get_investment_holdingsOutput;
}

/**
 * The type of the input parameter for get_liabilities tool.
 */
export type get_liabilitiesParams = {
  // Optional filter by liability type: 'credit' (credit cards), 'mortgage' (home loans), or 'student' (student loans)
  type?: ('credit' | 'mortgage' | 'student')
}

/**
 * The type of the output of the get_liabilities tool.
 */
export type get_liabilitiesOutput = {
  summary: {
    creditCount: number,
    studentCount: number,
    mortgageCount: number,
    totalLiabilities: number
  },
  // Array of liabilities with detailed information
  liabilities: Array<{
    data?: any,
    type: ('credit' | 'mortgage' | 'student'),
    account_id: string,
    account_name: (string | null),
    account_type: (string | null),
    account_subtype: (string | null)
  }>,
  // Guidelines for analyzing liability data (credit card APRs, mortgage terms, student loan repayment)
  dataInstructions: string
}

/**
 * View your liabilities across all connected accounts including credit cards, mortgages, and student loans. Shows payment schedules, interest rates, balances, and overdue status. Optionally filter by liability type (credit, mortgage, or student). Data is fetched from Plaid on first call and then cached in the database for instant access.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_liabilities(
  sdk: ServerSdk,
  params: get_liabilitiesParams
): Promise<get_liabilitiesOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/get-liabilities", params) as get_liabilitiesOutput;
}

/**
 * The type of the input parameter for get_recurring_transactions tool.
 */
export type get_recurring_transactionsParams = {
  // Optional filter by transaction type: 'inflow' (income like payroll), 'outflow' (expenses like rent, subscriptions)
  type?: ('inflow' | 'outflow')
}

/**
 * The type of the output of the get_recurring_transactions tool.
 */
export type get_recurring_transactionsOutput = {
  summary: {
    totalInflows: number,
    totalOutflows: number,
    estimatedMonthlyIncome: number,
    estimatedMonthlyExpenses: number
  },
  // Recurring income streams (payroll, deposits, etc.)
  inflowStreams: Array<{
    status: string,
    frequency: ('WEEKLY' | 'BIWEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY' | 'ANNUALLY' | 'UNKNOWN'),
    is_active: boolean,
    last_date: string,
    stream_id: string,
    account_id: string,
    first_date: string,
    description: string,
    last_amount: number,
    merchant_name: (string | null),
    average_amount: number,
    category_primary: (string | null),
    category_detailed: (string | null),
    transaction_count: number,
    category_confidence: (('VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN') | null),
    predicted_next_date: (string | null)
  }>,
  // Recurring expense streams (subscriptions, bills, etc.)
  outflowStreams: Array<any>,
  // Guidelines for analyzing recurring transaction data
  dataInstructions: string
}

/**
 * view your recurring transactions from all connected accounts
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function get_recurring_transactions(
  sdk: ServerSdk,
  params: get_recurring_transactionsParams
): Promise<get_recurring_transactionsOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/get-recurring-transactions", params) as get_recurring_transactionsOutput;
}

/**
 * The type of the input parameter for next_steps tool.
 */
export type next_stepsParams = {

}

/**
 * The type of the output of the next_steps tool.
 */
export type next_stepsOutput = any

/**
 * Get personalized onboarding guidance for Attain Finance. Returns a welcome message, explains available features, and suggests the next action to take. Call this tool to help new users get started.
 * @param sdk - The SDK object.
 * @param params - The parameters for the tool.
 * @returns The result of the tool, matching the type defined by the outputSchema.
 */
export async function next_steps(
  sdk: ServerSdk,
  params: next_stepsParams
): Promise<next_stepsOutput> {
  return await sdk.callTool("31ed98c5-7fd6-47d9-b21b-b55436a4076e.finance/1.0.0/next-steps", params) as next_stepsOutput;
}


