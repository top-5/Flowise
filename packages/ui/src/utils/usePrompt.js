import { useEffect } from 'react'

// Simple implementation without using router's useBlocker
// This uses the browser's beforeunload event

export function useBlocker(blocker, when = true) {
    useEffect(() => {
        if (!when) return

        const handleBeforeUnload = (e) => {
            e.preventDefault()
            e.returnValue = ''
            return ''
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [blocker, when])
}

export function usePrompt(message, when = true) {
    useEffect(() => {
        if (!when) return

        const handleBeforeUnload = (e) => {
            e.preventDefault()
            e.returnValue = message
            return message
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [message, when])
}
