import { Store } from '@tanstack/react-store'

interface MessagesState {
  messages: Record<string, string>
}

// Create the store
export const messagesStore = new Store<MessagesState>({
  messages: {},
})

// Actions
export const messagesActions = {
  addMessage: (id: string, text: string) => {
    messagesStore.setState((state) => ({
      messages: {
        ...state.messages,
        [id]: text,
      },
    }))
  },

  clearMessages: () => {
    messagesStore.setState({ messages: {} })
  },

  removeMessage: (id: string) => {
    messagesStore.setState((state) => {
      const { [id]: _, ...rest } = state.messages
      return { messages: rest }
    })
  },

  updateMessage: (id: string, text: string) => {
    messagesStore.setState((state) => ({
      messages: {
        ...state.messages,
        [id]: text,
      },
    }))
  },

  getMessage: (id: string) => {
    return messagesStore.state.messages[id]
  },

  getAllMessages: () => {
    return messagesStore.state.messages
  },
}
