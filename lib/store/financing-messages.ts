import { Store } from '@tanstack/react-store'

interface FinancingMessage {
  message: string
  imagePath: string[]
}

interface MessagesState {
  financingMessage: FinancingMessage | null
}

// Create the store
export const financingMessagesStore = new Store<MessagesState>({
  financingMessage: null,
})

// Actions
export const financingMessagesActions = {
  updateMessage: (message: string, imagePath: string[]) => {
    financingMessagesStore.setState({
      financingMessage: { message, imagePath },
    })
  },

  clearMessage: () => {
    financingMessagesStore.setState({ financingMessage: null })
  },

  getMessage: () => {
    return financingMessagesStore.state.financingMessage
  },
}
