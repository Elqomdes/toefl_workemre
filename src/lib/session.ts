import type { Attempt } from '../types'

/** Attempts from this browser session, including audio URLs that are not persisted. */
const sessionAttempts = new Map<string, Attempt>()

export const rememberSessionAttempt = (a: Attempt) => sessionAttempts.set(a.id, a)
export const getSessionAttempt = (id: string) => sessionAttempts.get(id)
