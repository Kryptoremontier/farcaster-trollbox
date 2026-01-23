import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * ⚠️ IMPORTANT: Solidity Timestamp Conversion
 * 
 * JavaScript: Date.now() returns MILLISECONDS (13 digits)
 * Solidity: block.timestamp expects SECONDS (10 digits)
 * 
 * Always use these helpers when working with smart contract timestamps!
 */

/**
 * Convert JavaScript Date to Solidity timestamp (seconds)
 * @param date - JavaScript Date object or milliseconds
 * @returns Unix timestamp in SECONDS for Solidity
 */
export function toSolidityTimestamp(date: Date | number): number {
  const ms = typeof date === 'number' ? date : date.getTime();
  return Math.floor(ms / 1000);
}

/**
 * Convert Solidity timestamp (seconds) to JavaScript Date
 * @param timestamp - Unix timestamp in SECONDS from Solidity
 * @returns JavaScript Date object
 */
export function fromSolidityTimestamp(timestamp: number | bigint): Date {
  return new Date(Number(timestamp) * 1000);
}

/**
 * Get current timestamp in Solidity format (seconds)
 * @returns Current Unix timestamp in SECONDS
 */
export function nowSolidityTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Create a future timestamp for Solidity (e.g., for market end times)
 * @param daysFromNow - Number of days in the future
 * @returns Unix timestamp in SECONDS
 */
export function futureSolidityTimestamp(daysFromNow: number): number {
  return Math.floor((Date.now() + daysFromNow * 24 * 60 * 60 * 1000) / 1000);
}