import { Store } from '@tanstack/react-store'

export interface ToolOutput {
  toolName: string
  output: unknown
  input: unknown
  state?: string
  timestamp: number
  id: string
}

interface ToolOutputsState {
  outputs: ToolOutput[]
}

// Create the store
export const toolOutputsStore = new Store<ToolOutputsState>({
  outputs: [],
})

// Helper function to create a deterministic ID from input
const createIdFromInput = (toolName: string, input: unknown): string => {
  // Create a stable hash of the input
  const inputStr = JSON.stringify(input)
  const trimmedInput = inputStr.substring(0, 100) // Trim to first 100 chars for ID

  // Simple hash function
  let hash = 0
  for (let i = 0; i < trimmedInput.length; i++) {
    const char = trimmedInput.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  return `${toolName}-${hash.toString(36)}`
}

// Actions
export const toolOutputsActions = {
  addOutput: (toolOutput: Omit<ToolOutput, 'timestamp' | 'id'>) => {
    // Generate deterministic ID based on tool name and input
    const id = createIdFromInput(toolOutput.toolName, toolOutput.input)

    const newOutput: ToolOutput = {
      ...toolOutput,
      timestamp: Date.now(),
      id,
    }

    toolOutputsStore.setState((state) => {
      // Check if an identical output already exists by ID
      const existingIndex = state.outputs.findIndex(
        (output) => output.id === id
      )

      // If exists, update it; otherwise, add new
      if (existingIndex !== -1) {
        const newOutputs = [...state.outputs]
        newOutputs[existingIndex] = newOutput
        return { outputs: newOutputs }
      }

      return { outputs: [...state.outputs, newOutput] }
    })
  },

  clearOutputs: () => {
    toolOutputsStore.setState({ outputs: [] })
  },

  removeOutput: (id: string) => {
    toolOutputsStore.setState((state) => ({
      outputs: state.outputs.filter((output) => output.id !== id),
    }))
  },
}
