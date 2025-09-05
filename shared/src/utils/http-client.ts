/**
 * Shared HTTP client utilities for communicating with the web API
 * 
 * Provides centralized HTTP functions to eliminate duplication between
 * the MCP server and shared library API clients.
 */

// Web app base URL for API calls (configurable via environment)
export const WEB_API_BASE = process.env.WEB_API_BASE || 'http://localhost:3000'

/**
 * Performs an HTTP GET request
 * 
 * @param url - The URL to fetch from
 * @returns Promise resolving to the JSON response
 * @throws Error if the request fails or returns non-2xx status
 */
export async function httpGet<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Performs an HTTP POST request with JSON data
 * 
 * @param url - The URL to post to
 * @param data - The data to send in the request body
 * @returns Promise resolving to the JSON response
 * @throws Error if the request fails or returns non-2xx status
 */
export async function httpPost<T = unknown>(url: string, data: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}