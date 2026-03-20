export type JobStatus = 'pending' | 'processing' | 'done' | 'error'
export type JobType = 'convert' | 'download'

export interface Job {
  id: string
  job_type: JobType
  status: JobStatus
  original_filename?: string
  input_format?: string
  output_format?: string
  source_url?: string
  platform?: string
  download_quality?: string
  output_url?: string
  output_filename?: string
  file_size?: number
  error_message?: string
  created_at: string
}

export interface FormatsResponse {
  video: string[]
  audio: string[]
  image: string[]
  download_platforms: string[]
  download_qualities: string[]
}