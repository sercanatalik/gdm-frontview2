import { Store } from '@tanstack/react-store'

export interface MessageObject {
  id: string
  text: string
  state: string
  timestamp: number
}

interface MessagesState {
  messages: MessageObject[]
}

// Create the store
export const messagesStore = new Store<MessagesState>({
  messages: [],
})

// Actions
export const messagesActions = {
  addMessage: (message: Omit<MessageObject, 'timestamp' | 'id'>) => {
    const newMessage: MessageObject = {
      ...message,
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    }

    messagesStore.setState((state) => ({
      messages: [...state.messages, newMessage],
    }))
  },

  clearMessages: () => {
    messagesStore.setState({ messages: [] })
  },

  removeMessage: (id: string) => {
    messagesStore.setState((state) => ({
      messages: state.messages.filter((message) => message.id !== id),
    }))
  },

  updateMessage: (id: string, updates: Partial<MessageObject>) => {
    messagesStore.setState((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, ...updates } : message
      ),
    }))
  },
}
