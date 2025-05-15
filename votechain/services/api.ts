import { useWallet } from "@/context/wallet-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper function to handle API responses
async function handleResponse(response: Response) {
  const data = await response.json()

  if (!response.ok) {
    // Extract the error message from the response
    const errorMessage = data.message || response.statusText
    throw new Error(errorMessage)
  }

  return data
}

// Function to get auth headers
function getAuthHeaders(token: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

// Poll API service
export const pollService = {
  // Get all polls with optional filters
  getPolls: async (token: string | null, filters = {}) => {
    const queryParams = new URLSearchParams(filters as Record<string, string>).toString()
    const url = `${API_URL}/polls${queryParams ? `?${queryParams}` : ""}`

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(token),
    })

    return handleResponse(response)
  },

  // Get a single poll by ID
  getPoll: async (id: string, token: string | null) => {
    const response = await fetch(`${API_URL}/polls/${id}`, {
      method: "GET",
      headers: getAuthHeaders(token),
    })

    return handleResponse(response)
  },

  // Get polls created by the authenticated user (admin only)
  getMyPolls: async (token: string | null, filters = {}) => {
    const queryParams = new URLSearchParams(filters as Record<string, string>).toString()
    const url = `${API_URL}/polls/admin/mypolls${queryParams ? `?${queryParams}` : ""}`

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(token),
    })

    return handleResponse(response)
  },

  // Create a new poll (admin only)
  createPoll: async (pollData: any, token: string | null) => {
    const response = await fetch(`${API_URL}/polls`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(pollData),
    })

    return handleResponse(response)
  },

  // Update a poll (admin only)
  updatePoll: async (id: string, pollData: any, token: string | null) => {
    const response = await fetch(`${API_URL}/polls/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify(pollData),
    })

    return handleResponse(response)
  },

  // Close a poll (admin only)
  closePoll: async (id: string, token: string | null) => {
    const response = await fetch(`${API_URL}/polls/${id}/close`, {
      method: "PUT",
      headers: getAuthHeaders(token),
    })

    return handleResponse(response)
  },

  // Delete a poll (admin only)
  deletePoll: async (id: string, token: string | null) => {
    const response = await fetch(`${API_URL}/polls/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(token),
    })

    return handleResponse(response)
  },
}

// Vote API service
export const voteService = {
  // Cast a vote
  castVote: async (pollId: string, optionIndex: number, token: string | null) => {
    const response = await fetch(`${API_URL}/votes`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ pollId, optionIndex }),
    })

    return handleResponse(response)
  },

  // Get all votes for a poll (admin only)
  getPollVotes: async (pollId: string, token: string | null) => {
    const response = await fetch(`${API_URL}/votes/poll/${pollId}`, {
      method: "GET",
      headers: getAuthHeaders(token),
    })

    return handleResponse(response)
  },

  // Get voting history for the authenticated user
  getUserVotes: async (token: string | null) => {
    const response = await fetch(`${API_URL}/votes/history`, {
      method: "GET",
      headers: getAuthHeaders(token),
    })

    return handleResponse(response)
  },
}

// Custom hook to use the API services with the wallet context
export function useApi() {
  const { token } = useWallet()

  return {
    polls: {
      getAll: (filters = {}) => pollService.getPolls(token, filters),
      getOne: (id: string) => pollService.getPoll(id, token),
      getMine: (filters = {}) => pollService.getMyPolls(token, filters),
      create: (pollData: any) => pollService.createPoll(pollData, token),
      update: (id: string, pollData: any) => pollService.updatePoll(id, pollData, token),
      close: (id: string) => pollService.closePoll(id, token),
      delete: (id: string) => pollService.deletePoll(id, token),
    },
    votes: {
      cast: (pollId: string, optionIndex: number) => voteService.castVote(pollId, optionIndex, token),
      getPollVotes: (pollId: string) => voteService.getPollVotes(pollId, token),
      getHistory: () => voteService.getUserVotes(token),
    },
  }
}
