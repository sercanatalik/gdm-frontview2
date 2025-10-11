import { Store } from '@tanstack/react-store'

interface FinancingMessage {
  message: string
  imagePath: string[]
}

interface MessagesState {
  messages: Record<string, FinancingMessage>
}

// Create the store
export const financingMessagesStore = new Store<MessagesState>({
  messages: {},
})

// Actions
export const financingMessagesActions = {
  addMessage: (id: string, message: string, imagePath: string[]) => {
    financingMessagesStore.setState((state) => ({
      messages: {
        ...state.messages,
        [id]: { message, imagePath },
      },
    }))
  },

  clearMessages: () => {
    financingMessagesStore.setState({ messages: {} })
  },

  removeMessage: (id: string) => {
    financingMessagesStore.setState((state) => {
      const { [id]: _, ...rest } = state.messages
      return { messages: rest }
    })
  },

  updateMessage: (id: string, message: string, imagePath: string[]) => {
    financingMessagesStore.setState((state) => ({
      messages: {
        ...state.messages,
        [id]: { message, imagePath },
      },
    }))
  },

  getMessage: (id: string) => {
    return financingMessagesStore.state.messages[id]
  },

  getAllMessages: () => {
    return financingMessagesStore.state.messages
  },
}
