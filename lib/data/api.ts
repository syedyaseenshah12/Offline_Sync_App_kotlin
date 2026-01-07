/**
 * API Layer
 * 
 * Handles communication with the remote REST API.
 * Uses axios for HTTP requests with proper error handling.
 */

import axios, { AxiosError } from 'axios';
import type { CreatePostDTO, PostResponseDTO } from './types';

const API_BASE_URL = 'https://jsonplaceholder.typicode.com';
const API_TIMEOUT = 10000; // 10 seconds

/**
 * API client instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API error types for structured error handling
 */
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CLIENT_ERROR = 'CLIENT_ERROR', // 4xx
  SERVER_ERROR = 'SERVER_ERROR', // 5xx
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured API error
 */
export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    public statusCode?: number,
    message?: string
  ) {
    super(message || type);
    this.name = 'ApiError';
  }
}

/**
 * Parse axios error into structured ApiError
 */
function parseAxiosError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    // Network error (no response received)
    if (!axiosError.response) {
      if (axiosError.code === 'ECONNABORTED') {
        return new ApiError(ApiErrorType.TIMEOUT, undefined, 'Request timeout');
      }
      return new ApiError(
        ApiErrorType.NETWORK_ERROR,
        undefined,
        'Network error: ' + (axiosError.message || 'No connection')
      );
    }

    // HTTP error response
    const status = axiosError.response.status;
    if (status >= 400 && status < 500) {
      return new ApiError(
        ApiErrorType.CLIENT_ERROR,
        status,
        `Client error: ${status}`
      );
    }
    if (status >= 500) {
      return new ApiError(
        ApiErrorType.SERVER_ERROR,
        status,
        `Server error: ${status}`
      );
    }
  }

  return new ApiError(
    ApiErrorType.UNKNOWN_ERROR,
    undefined,
    error instanceof Error ? error.message : 'Unknown error'
  );
}

/**
 * Create a new post on the API
 */
export async function createPost(data: CreatePostDTO): Promise<PostResponseDTO> {
  try {
    console.log('[API] Creating post:', data.title);
    const response = await apiClient.post<PostResponseDTO>('/posts', data);
    console.log('[API] Post created successfully:', response.data.id);
    return response.data;
  } catch (error) {
    const apiError = parseAxiosError(error);
    console.error('[API] Create post failed:', apiError.message);
    throw apiError;
  }
}

/**
 * Fetch all posts from the API
 */
export async function getAllPosts(): Promise<PostResponseDTO[]> {
  try {
    console.log('[API] Fetching all posts');
    const response = await apiClient.get<PostResponseDTO[]>('/posts');
    console.log('[API] Fetched posts:', response.data.length);
    return response.data;
  } catch (error) {
    const apiError = parseAxiosError(error);
    console.error('[API] Fetch posts failed:', apiError.message);
    throw apiError;
  }
}

/**
 * Fetch a single post by ID
 */
export async function getPostById(id: number): Promise<PostResponseDTO> {
  try {
    console.log('[API] Fetching post:', id);
    const response = await apiClient.get<PostResponseDTO>(`/posts/${id}`);
    console.log('[API] Post fetched:', response.data.id);
    return response.data;
  } catch (error) {
    const apiError = parseAxiosError(error);
    console.error('[API] Fetch post failed:', apiError.message);
    throw apiError;
  }
}

/**
 * Check if error is retryable (network or server error)
 */
export function isRetryableError(error: ApiError): boolean {
  return (
    error.type === ApiErrorType.NETWORK_ERROR ||
    error.type === ApiErrorType.TIMEOUT ||
    error.type === ApiErrorType.SERVER_ERROR
  );
}

/**
 * Check if error is permanent (client error)
 */
export function isPermanentError(error: ApiError): boolean {
  return error.type === ApiErrorType.CLIENT_ERROR;
}
