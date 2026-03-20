import { useState, useEffect, useRef } from 'react'
import type { Job } from '../types'
import { getJobStatus } from '../api/client'

export function useJobPoller(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!jobId) return

    const poll = async () => {
      try {
        const data = await getJobStatus(jobId)
        setJob(data)
        if (data.status === 'done' || data.status === 'error') {
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      } catch {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 2000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [jobId])

  return job
}