import axios from 'axios'
import type { Job, FormatsResponse } from '../types'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE,
  timeout: 60000,
})

export const uploadAndConvert = async (file: File, outputFormat: string): Promise<Job> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('output_format', outputFormat)
  const { data } = await api.post<Job>('/convert/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const startDownload = async (url: string, quality: string): Promise<Job> => {
  const { data } = await api.post<Job>('/download/', { url, quality })
  return data
}

export const getJobStatus = async (jobId: string): Promise<Job> => {
  const { data } = await api.get<Job>(`/jobs/${jobId}/`)
  return data
}

export const getFormats = async (): Promise<FormatsResponse> => {
  const { data } = await api.get<FormatsResponse>('/formats/')
  return data
}

// Resolve download URL — if it starts with /api/, go through proxy
export function resolveDownloadUrl(url: string): string {
  if (url.startsWith('/api/')) {
    return `http://localhost:8000${url}`
  }
  return url
}