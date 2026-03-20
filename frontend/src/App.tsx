import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadAndConvert, startDownload, resolveDownloadUrl } from './api/client'
import { useJobPoller } from './hooks/useJobPoller'
import type { Job } from './types'

const VIDEO_FMTS = ['avi','mkv','mov','webm','flv','wmv','3gp']
const AUDIO_FMTS = ['mp3','wav','flac','aac','m4a','ogg','opus']
const IMAGE_FMTS = ['jpg','png','webp','gif','bmp','tiff']

const DL_FORMATS = [
  { v:'mp4',  l:'MP4',        q:'best'       },
  { v:'mp3',  l:'MP3 · Audio',q:'audio_only' },
  { v:'webm', l:'WEBM',       q:'best'       },
  { v:'mov',  l:'MOV',        q:'best'       },
  { v:'aac',  l:'AAC · Audio',q:'audio_only' },
  { v:'wav',  l:'WAV · Audio',q:'audio_only' },
]

const MORE = ['Dailymotion','Reddit','Twitch','Pinterest','LinkedIn',
  'SoundCloud','Bilibili','Rumble','Odysee','Mixcloud','Bandcamp','VK','NicoNico']

const PLATFORMS = [
  { id:'py', name:'YouTube',   color:'#FF0000', border:'rgba(255,0,0,0.4)',    glow:'rgba(255,0,0,0.14)',    domains:['youtube.com','youtu.be'] },
  { id:'pi', name:'Instagram', color:'#E1306C', border:'rgba(225,48,108,0.4)', glow:'rgba(225,48,108,0.14)', domains:['instagram.com'] },
  { id:'pt', name:'TikTok',    color:'#00F2EA', border:'rgba(0,242,234,0.4)',  glow:'rgba(0,242,234,0.12)',  domains:['tiktok.com'] },
  { id:'pf', name:'Facebook',  color:'#1877F2', border:'rgba(24,119,242,0.4)', glow:'rgba(24,119,242,0.14)', domains:['facebook.com','fb.watch'] },
  { id:'ps', name:'Snapchat',  color:'#FFFC00', border:'rgba(255,252,0,0.4)',  glow:'rgba(255,252,0,0.1)',   domains:['snapchat.com'] },
  { id:'px', name:'Twitter/X', color:'#FFFFFF', border:'rgba(255,255,255,0.3)',glow:'rgba(255,255,255,0.07)',domains:['twitter.com','x.com'] },
  { id:'pv', name:'Vimeo',     color:'#1AB7EA', border:'rgba(26,183,234,0.4)', glow:'rgba(26,183,234,0.14)', domains:['vimeo.com'] },
]

const ICONS: Record<string, React.ReactElement> = {
  py: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  pi: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>,
  pt: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  pf: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  ps: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.065.001c1.588-.004 3.834.38 5.355 2.034.967 1.066 1.298 2.374 1.393 3.44.054.604.048 1.208.042 1.66v.484c.027.015.083.037.169.056.282.064.634.055.98-.117.19-.093.447-.14.696-.14.383 0 .74.11.967.302.36.3.423.672.326.945-.164.456-.723.752-1.2.936a3.24 3.24 0 0 1-.287.088c-.105.028-.232.06-.315.1-.001.005-.002.013-.002.023 0 .087.055.238.124.416.261.674.745 1.927.745 3.065 0 .48-.073.934-.237 1.35C19.33 16.58 17.17 17.5 14.89 17.89c-.07.123-.16.373-.213.543-.093.3-.213.69-.583.69h-.029c-.2-.019-.39-.09-.604-.165-.38-.134-.85-.3-1.587-.3-.737 0-1.205.168-1.583.3-.212.076-.4.145-.601.165h-.032c-.37 0-.49-.39-.583-.69-.053-.17-.143-.42-.214-.543-2.277-.39-4.437-1.31-5.477-3.565-.163-.416-.236-.87-.236-1.35 0-1.138.483-2.39.744-3.065.07-.178.124-.33.124-.416 0-.01 0-.018-.002-.023-.082-.04-.21-.072-.314-.1a3.336 3.336 0 0 1-.287-.088C3.43 8.97 2.87 8.673 2.706 8.217c-.097-.273-.033-.644.327-.945.227-.192.583-.301.966-.301.25 0 .505.046.695.139.345.172.699.181.981.117.087-.02.143-.04.17-.056l-.001-.484c-.006-.452-.011-1.056.042-1.66.095-1.066.426-2.374 1.393-3.44C8.8.381 10.477-.003 12.065.001z"/></svg>,
  px: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  pv: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.787 4.789.968 5.507.537 2.44 1.133 3.658 1.782 3.658.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.477 4.823z"/></svg>,
}

function formatBytes(b: number) {
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`
  return `${(b/1048576).toFixed(1)} MB`
}
function detectPlatform(url: string) {
  const l = url.toLowerCase()
  return PLATFORMS.find(p => p.domains.some(d => l.includes(d))) || null
}
function getGroup(ext: string) {
  if (VIDEO_FMTS.includes(ext)) return 'video'
  if (AUDIO_FMTS.includes(ext)) return 'audio'
  if (IMAGE_FMTS.includes(ext)) return 'image'
  return null
}

// ── Design tokens ──
const C = {
  bg:'#060608', s1:'#0D0D12', s2:'#13131A', s3:'#1A1A24', s4:'#22222E',
  b1:'#2A2A38', b2:'#38384A', b3:'#4A4A60',
  t1:'#FFFFFF', t2:'#D0D0F0', t3:'#9090B8', t4:'#505070',
  gold:'#FFB800', gold2:'#FF8800',
  goldD:'rgba(255,184,0,0.1)', goldB:'rgba(255,184,0,0.35)', goldG:'rgba(255,184,0,0.15)',
  violet:'#7C3AED', red:'#FF4444', redD:'rgba(255,68,68,0.06)',
}
const mono  = "'JetBrains Mono',monospace"
const syne  = "'Syne',sans-serif"
const inter = "'Inter',sans-serif"

// ── Hook: responsive ──
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}

// ── Job card ──
function JobCard({ job }: { job: Job }) {
  const loading = job.status === 'pending' || job.status === 'processing'
  const done    = job.status === 'done'
  const err     = job.status === 'error'
  return (
    <div style={{
      marginTop:20, padding:'18px 20px', borderRadius:16,
      display:'flex', alignItems:'center', gap:14,
      background: done ? C.goldD : err ? C.redD : 'rgba(124,58,237,0.07)',
      border:`1px solid ${done ? C.goldB : err ? 'rgba(255,68,68,0.2)' : 'rgba(124,58,237,0.2)'}`,
    }}>
      {loading && <div style={{ width:34, height:34, borderRadius:'50%', border:`2px solid ${C.violet}`, borderTopColor:'transparent', animation:'spin .75s linear infinite', flexShrink:0 }}/>}
      {done && (
        <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${C.gold},${C.gold2})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 0 20px ${C.goldG}` }}>
          <svg width="15" height="15" fill="none" stroke="#060608" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
      {err && (
        <div style={{ width:34, height:34, borderRadius:'50%', background:C.redD, border:'1px solid rgba(255,68,68,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="15" height="15" fill="none" stroke={C.red} strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        {loading && <>
          <div style={{ fontSize:13, fontWeight:600, color:C.t1, marginBottom:10 }}>
            {job.status==='pending' ? 'Queued — waiting for worker…' : 'Processing…'}
          </div>
          <div style={{ height:2, borderRadius:1, background:C.s4, overflow:'hidden' }}>
            <div style={{ height:'100%', background:`linear-gradient(90deg,${C.violet},${C.gold})`, animation:'prog 1.8s ease-in-out infinite', borderRadius:1 }}/>
          </div>
        </>}
        {done && <>
          <div style={{ fontSize:14, fontWeight:600, color:C.t1, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.output_filename||'File ready'}</div>
          <div style={{ fontFamily:mono, fontSize:11, color:C.t3 }}>{job.file_size ? formatBytes(job.file_size) : ''} · Ready to save</div>
        </>}
        {err && <>
          <div style={{ fontSize:13, fontWeight:600, color:C.red, marginBottom:3 }}>Something went wrong</div>
          <div style={{ fontFamily:mono, fontSize:11, color:C.t3 }}>{job.error_message||'Unknown error'}</div>
        </>}
      </div>
      {done && job.output_url && (
        <a href={resolveDownloadUrl(job.output_url)} download={job.output_filename||'download'} target="_blank" rel="noreferrer"
          style={{ padding:'10px 22px', borderRadius:10, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, fontFamily:syne, fontSize:14, fontWeight:700, color:'#060608', textDecoration:'none', flexShrink:0, boxShadow:`0 0 24px ${C.goldG}` }}>
          Save
        </a>
      )}
    </div>
  )
}
function JobPoller({ jobId }: { jobId:string }) {
  const job = useJobPoller(jobId)
  if (!job) return <JobCard job={{ id:jobId, job_type:'convert', status:'pending', created_at:'' }}/>
  return <JobCard job={job}/>
}

// ── Chip ──
function Chip({ label, active, onClick }: { label:string, active:boolean, onClick:()=>void }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        padding:'8px 16px', borderRadius:9, fontFamily:mono, fontSize:11, cursor:'pointer', transition:'all .15s',
        background: active ? C.goldD : hov ? C.s2 : 'transparent',
        border:`1px solid ${active ? C.goldB : hov ? C.b3 : C.b1}`,
        color: active ? C.gold : hov ? C.t1 : C.t2,
        boxShadow: active ? `0 0 18px ${C.goldG}` : 'none',
      }}>
      {label}
    </button>
  )
}

// ── Platform card ──
function PlatCard({ p, active }: { p:typeof PLATFORMS[0], active:boolean }) {
  const [hov, setHov] = useState(false)
  const lit = active || hov
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        borderRadius:14, padding:'15px 6px 11px', textAlign:'center', cursor:'default',
        border:`1px solid ${lit ? p.border : C.b1}`,
        background: lit ? 'rgba(0,0,0,0.5)' : C.s1,
        transition:'all .22s cubic-bezier(.4,0,.2,1)',
        transform: lit ? 'translateY(-5px) scale(1.03)' : 'none',
        boxShadow: lit ? `0 8px 32px ${p.glow}` : 'none',
        position:'relative', overflow:'hidden',
      }}>
      {lit && <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 115%,${p.glow},transparent 70%)`, pointerEvents:'none' }}/>}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:7, position:'relative', color: lit ? p.color : C.b3, transition:'all .22s', filter: lit ? `drop-shadow(0 0 7px ${p.color})` : 'none' }}>
        {ICONS[p.id]}
      </div>
      <div style={{ fontFamily:mono, fontSize:8, color: lit ? C.t2 : C.t4, letterSpacing:'.05em', position:'relative', transition:'color .22s' }}>{p.name}</div>
      {active && <div style={{ width:4, height:4, borderRadius:'50%', background:p.color, margin:'6px auto 0', boxShadow:`0 0 6px ${p.color}` }}/>}
    </div>
  )
}

// ── Convert panel ──
function ConvertPanel({ isMobile }: { isMobile: boolean }) {
  const [file, setFile]   = useState<File|null>(null)
  const [fmt, setFmt]     = useState('')
  const [jobId, setJobId] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((a:File[]) => {
    setFile(a[0]||null); setFmt(''); setJobId(null); setError('')
  },[])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple:false, maxSize:500*1024*1024 })

  const ext  = file ? file.name.split('.').pop()?.toLowerCase()??'' : ''
  const grp  = getGroup(ext)
  const groups = [
    { label:'VIDEO', fmts: grp==='video' ? VIDEO_FMTS.filter(f=>f!==ext) : grp===null ? VIDEO_FMTS : [] },
    { label:'AUDIO', fmts: grp==='audio' ? AUDIO_FMTS.filter(f=>f!==ext) : grp===null ? AUDIO_FMTS : [] },
    { label:'IMAGE', fmts: grp==='image' ? IMAGE_FMTS.filter(f=>f!==ext) : grp===null ? IMAGE_FMTS : [] },
  ].filter(g=>g.fmts.length>0)

  const go = async () => {
    if (!file||!fmt) return
    setLoading(true); setError('')
    try   { const j = await uploadAndConvert(file, fmt); setJobId(j.id) }
    catch (e:any) { setError(e.response?.data?.error||'Upload failed. Try again.') }
    finally { setLoading(false) }
  }
  const reset = () => { setFile(null); setFmt(''); setJobId(null); setError('') }
  const canGo = !!file && !!fmt && !loading

  const pad = isMobile ? '28px 20px' : '52px 48px'

  return (
    <div style={{ display:'flex', flexDirection:'column', padding:pad, borderBottom: isMobile ? `1px solid ${C.b1}` : 'none', borderRight: !isMobile ? `1px solid ${C.b1}` : 'none', minHeight: isMobile ? 'auto' : 'calc(100vh - 60px)' }}>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
        <span style={{ fontFamily:mono, fontSize:11, color:C.t3, letterSpacing:'.1em' }}>01</span>
        <div style={{ width:1, height:14, background:C.b2 }}/>
        <span style={{ fontFamily:mono, fontSize:11, color:C.t3, letterSpacing:'.1em' }}>FILE CONVERSION</span>
      </div>

      <div style={{ fontFamily:syne, fontSize: isMobile ? 40 : 52, fontWeight:800, lineHeight:.9, letterSpacing:'-.03em', marginBottom:12 }}>
        <div style={{ color:C.t1 }}>Drop.</div>
        <div style={{ color:C.t2, opacity:.7 }}>Pick.</div>
        <div style={{ color:C.t3, opacity:.5 }}>Convert.</div>
      </div>
      <p style={{ fontSize:13, color:C.t3, marginBottom:28 }}>Video · Audio · Image · Up to 500 MB</p>

      {!jobId ? <>
        <div {...getRootProps()} style={{
          flex: file?'none':isMobile?'none':1,
          minHeight: file ? 'auto' : 160,
          border:`1.5px dashed ${isDragActive ? C.goldB : file ? C.goldB : C.b2}`,
          borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', position:'relative', overflow:'hidden',
          background: isDragActive ? C.goldD : file ? 'rgba(255,184,0,0.03)' : C.s1,
          transition:'all .3s',
        }}>
          <input {...getInputProps()}/>
          {!file ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, textAlign:'center', padding:'32px 24px', position:'relative', zIndex:1 }}>
              <div style={{ width:60, height:60, borderRadius:18, background:C.s3, border:`1px solid ${C.b2}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="26" height="26" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize:14, color:C.t2, fontWeight:500 }}>Drop file or <span style={{ color:C.gold, fontWeight:600 }}>browse</span></div>
                <div style={{ fontSize:12, color:C.t3, marginTop:3 }}>Video, audio, or image · Max 500 MB</div>
              </div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'center' }}>
                {['MP4','MP3','PNG','MKV','WEBM','+35'].map(f=>(
                  <span key={f} style={{ fontFamily:mono, fontSize:9, padding:'3px 8px', border:`1px solid ${C.b2}`, borderRadius:5, color:C.t3 }}>{f}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 20px', width:'100%' }}>
              <div style={{ width:48, height:48, borderRadius:12, background:C.goldD, border:`1px solid ${C.goldB}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:mono, fontSize:11, color:C.gold, fontWeight:600, flexShrink:0 }}>
                {ext.toUpperCase()||'?'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.t1, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</div>
                <div style={{ fontFamily:mono, fontSize:11, color:C.t3 }}>{formatBytes(file.size)}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();reset()}} style={{ fontFamily:mono, fontSize:9, padding:'5px 10px', border:`1px solid ${C.b2}`, borderRadius:7, background:'none', color:C.t3, cursor:'pointer' }}>CHANGE</button>
            </div>
          )}
        </div>

        {file && groups.map(g=>(
          <div key={g.label} style={{ marginTop:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ fontFamily:mono, fontSize:10, color:C.t3, letterSpacing:'.12em' }}>{g.label}</span>
              <div style={{ flex:1, height:1, background:C.b1 }}/>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {g.fmts.map(f=><Chip key={f} label={`.${f.toUpperCase()}`} active={fmt===f} onClick={()=>setFmt(f)}/>)}
            </div>
          </div>
        ))}

        {error && <div style={{ marginTop:12, padding:'9px 12px', background:C.redD, border:'1px solid rgba(255,68,68,0.2)', borderRadius:8, fontFamily:mono, fontSize:11, color:C.red }}>{error}</div>}

        <div style={{ marginTop: isMobile ? 24 : 'auto', paddingTop: isMobile ? 0 : 28 }}>
          <button onClick={go} disabled={!canGo} style={{
            width:'100%', padding:16, border:'none', borderRadius:13,
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            fontFamily:syne, fontSize:17, fontWeight:700, letterSpacing:'.01em',
            cursor: canGo?'pointer':'not-allowed',
            background: canGo ? `linear-gradient(135deg,${C.gold},${C.gold2})` : C.s3,
            color: canGo ? '#060608' : C.t4,
            boxShadow: canGo ? `0 0 48px ${C.goldG},0 4px 20px rgba(0,0,0,.4)` : 'none',
            transition:'all .25s',
          } as React.CSSProperties}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            {loading ? 'Uploading…' : 'Convert Now'}
          </button>
        </div>
      </> : <>
        <JobPoller jobId={jobId}/>
        <button onClick={reset} style={{ marginTop:12, background:'none', border:`1px solid ${C.b1}`, borderRadius:10, padding:12, color:C.t3, fontFamily:inter, fontSize:13, cursor:'pointer' }}>
          + Convert another file
        </button>
      </>}
    </div>
  )
}

// ── Download panel ──
function DownloadPanel({ isMobile }: { isMobile: boolean }) {
  const [url, setUrl]     = useState('')
  const [dlFmt, setDlFmt] = useState('mp4')
  const [jobId, setJobId] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plat, setPlat]   = useState<typeof PLATFORMS[0]|null>(null)
  const [more, setMore]   = useState(false)

  useEffect(()=>{ setPlat(detectPlatform(url)) },[url])

  const go = async () => {
    if (!url.trim()) return
    setLoading(true); setError('')
    const q = DL_FORMATS.find(f=>f.v===dlFmt)?.q || 'best'
    try   { const j = await startDownload(url.trim(), q); setJobId(j.id) }
    catch (e:any) {
      const d = e.response?.data
      const msg = typeof d==='object' ? (d.error||d.url?.[0]||d.detail||Object.values(d)[0]) : null
      setError(typeof msg==='string' ? msg : 'Download failed. Check the URL.')
    }
    finally { setLoading(false) }
  }
  const reset = () => { setUrl(''); setDlFmt('mp4'); setJobId(null); setError(''); setPlat(null) }

  const pad = isMobile ? '28px 20px' : '52px 48px'

  return (
    <div style={{ display:'flex', flexDirection:'column', padding:pad, minHeight: isMobile ? 'auto' : 'calc(100vh - 60px)' }}>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
        <span style={{ fontFamily:mono, fontSize:11, color:C.t3, letterSpacing:'.1em' }}>02</span>
        <div style={{ width:1, height:14, background:C.b2 }}/>
        <span style={{ fontFamily:mono, fontSize:11, color:C.t3, letterSpacing:'.1em' }}>VIDEO DOWNLOAD</span>
      </div>

      <div style={{ fontFamily:syne, fontSize: isMobile ? 40 : 52, fontWeight:800, lineHeight:.9, letterSpacing:'-.03em', marginBottom:12 }}>
        <div style={{ color:C.t1 }}>Paste.</div>
        <div style={{ color:C.t2, opacity:.7 }}>Pick.</div>
        <div style={{ color:C.t3, opacity:.5 }}>Done.</div>
      </div>
      <p style={{ fontSize:13, color:C.t3, marginBottom:24 }}>1000+ platforms via yt-dlp</p>

      {!jobId ? <>
        {/* Platform grid — 4 cols desktop, 4 cols mobile */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:10 }}>
          {PLATFORMS.map(p=><PlatCard key={p.id} p={p} active={plat?.id===p.id}/>)}
          <div onClick={()=>setMore(v=>!v)} style={{ borderRadius:14, padding:'15px 6px 11px', border:`1px dashed ${C.b1}`, background:C.s1, textAlign:'center', cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:7 }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={C.b3} strokeWidth="1.5"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
            </div>
            <div style={{ fontFamily:mono, fontSize:8, color:C.t3 }}>+1000</div>
          </div>
        </div>

        {more && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, padding:12, background:C.s1, borderRadius:12, border:`1px solid ${C.b1}`, marginBottom:12 }}>
            {MORE.map(m=>(
              <span key={m} style={{ fontFamily:mono, fontSize:9, padding:'3px 9px', borderRadius:5, border:`1px solid ${C.b1}`, color:C.t3 }}>{m}</span>
            ))}
            <span style={{ fontFamily:mono, fontSize:9, padding:'3px 9px', borderRadius:5, border:`1px dashed ${C.b1}`, color:C.t4 }}>…+987 more</span>
          </div>
        )}

        <div style={{ fontFamily:mono, fontSize:10, color:C.t2, letterSpacing:'.12em', marginBottom:8 }}>PASTE URL</div>
        <div style={{ position:'relative', marginBottom: plat?10:16 }}>
          {plat && (
            <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:plat.color, filter:`drop-shadow(0 0 5px ${plat.color})`, zIndex:1, width:18, height:18, display:'flex', alignItems:'center' }}>
              {ICONS[plat.id]}
            </div>
          )}
          <input type="url" value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()}
            placeholder="https://youtube.com/watch?v=..."
            style={{
              width:'100%', padding: plat?'14px 16px 14px 44px':'14px 16px',
              background:C.s2, border:`1px solid ${plat ? plat.border : url.length>8 ? C.goldB : C.b2}`,
              borderRadius:12, color:C.t1, fontFamily:mono, fontSize:12, outline:'none', transition:'all .22s',
              boxShadow: plat ? `0 0 24px ${plat.glow}` : 'none',
            }}
          />
        </div>

        {plat && (
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 14px', borderRadius:11, border:`1px solid ${plat.border}`, background:plat.glow, marginBottom:14 }}>
            <div style={{ color:plat.color, width:16, height:16, display:'flex', alignItems:'center' }}>{ICONS[plat.id]}</div>
            <span style={{ fontFamily:mono, fontSize:10, color:plat.color, letterSpacing:'.05em', fontWeight:500 }}>Detected: {plat.name}</span>
            <div style={{ width:6, height:6, borderRadius:'50%', background:plat.color, marginLeft:'auto', animation:'blink 1.4s ease-in-out infinite' }}/>
          </div>
        )}

        <div style={{ fontFamily:mono, fontSize:10, color:C.t2, letterSpacing:'.12em', marginBottom:8 }}>OUTPUT FORMAT</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:16 }}>
          {DL_FORMATS.map(f=><Chip key={f.v} label={f.l} active={dlFmt===f.v} onClick={()=>setDlFmt(f.v)}/>)}
        </div>

        <div style={{ padding:'10px 14px', borderLeft:`2px solid ${C.b2}`, marginBottom:16 }}>
          <p style={{ fontSize:11, color:C.t3, lineHeight:1.7 }}>Personal use only · Respect platform terms · Files auto-delete after 30 min</p>
        </div>

        {error && <div style={{ marginBottom:14, padding:'9px 12px', background:C.redD, border:'1px solid rgba(255,68,68,0.2)', borderRadius:8, fontFamily:mono, fontSize:11, color:C.red }}>{error}</div>}

        <button onClick={go} disabled={!url.trim()||loading} style={{
          width:'100%', padding:16, borderRadius:13, fontFamily:syne, fontSize:17, fontWeight:700,
          letterSpacing:'.01em', cursor:(!url.trim()||loading)?'not-allowed':'pointer',
          background:'transparent',
          border:`1px solid ${plat ? plat.border : C.b2}`,
          borderBottom:`3px solid ${plat ? plat.color : C.gold}`,
          color: plat ? plat.color : C.t2,
          opacity:(!url.trim()||loading)?.3:1,
          boxShadow: plat&&url.trim() ? `0 4px 28px ${plat.glow}` : 'none',
          transition:'all .25s',
        } as React.CSSProperties}>
          {loading ? 'Starting…' : `Download as ${dlFmt.toUpperCase()}`}
        </button>
      </> : <>
        <JobPoller jobId={jobId}/>
        <button onClick={reset} style={{ marginTop:12, background:'none', border:`1px solid ${C.b1}`, borderRadius:10, padding:12, color:C.t3, fontFamily:inter, fontSize:13, cursor:'pointer' }}>
          + Download another
        </button>
      </>}
    </div>
  )
}

// ── About drawer ──
function AboutDrawer({ open, onClose }: { open:boolean, onClose:()=>void }) {
  const stack = ['Django','DRF','Celery','Redis','FFmpeg','yt-dlp','PostgreSQL','Cloudflare R2','React','Vite','TypeScript','Render','Vercel']
  const steps = [
    { t:'Drop or upload your file',      d:'Any video, audio or image. Up to 500 MB.' },
    { t:'Pick output format',             d:'40+ formats — MP4, MKV, MP3, WAV, PNG and more.' },
    { t:'FFmpeg converts in background',  d:'Via Celery async worker. Fast and non-blocking.' },
    { t:'Download instantly',             d:'Ready in seconds. Auto-deleted after 30 minutes.' },
    { t:'For video downloads',            d:'Paste any URL. yt-dlp fetches server-side. Done.' },
  ]
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:300, opacity:open?1:0, pointerEvents:open?'all':'none', transition:'opacity .3s', backdropFilter:'blur(10px)' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:'min(500px,100vw)', background:C.s1, borderLeft:`1px solid ${C.b1}`, zIndex:301, transform:open?'translateX(0)':'translateX(100%)', transition:'transform .4s cubic-bezier(.4,0,.2,1)', display:'flex', flexDirection:'column', overflowY:'auto' }}>
        <div style={{ padding:'24px 28px', borderBottom:`1px solid ${C.b1}`, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:C.s1, zIndex:1 }}>
          <div style={{ fontFamily:syne, fontSize:22, fontWeight:800, color:C.t1 }}>About</div>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${C.b2}`, borderRadius:8, color:C.t2, cursor:'pointer', padding:'7px 14px', fontFamily:mono, fontSize:10, letterSpacing:'.06em' }}>✕ CLOSE</button>
        </div>
        <div style={{ padding:28, display:'flex', flexDirection:'column', gap:24 }}>
          <div style={{ background:`linear-gradient(135deg,rgba(255,184,0,0.07),rgba(255,184,0,0.02))`, border:`1px solid ${C.goldB}`, borderRadius:18, padding:20, display:'flex', gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:C.goldD, border:`2px solid ${C.goldB}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:syne, fontSize:20, fontWeight:800, color:C.gold, flexShrink:0, boxShadow:`0 0 28px ${C.goldG}` }}>UM</div>
            <div>
              <div style={{ fontFamily:syne, fontSize:20, fontWeight:800, color:C.t1, marginBottom:3 }}>Uma Mahesh</div>
              <div style={{ fontFamily:mono, fontSize:10, color:C.gold, letterSpacing:'.07em', marginBottom:8 }}>FULL STACK · BACKEND ENGINEER</div>
              <div style={{ fontSize:12, color:C.t3, display:'flex', alignItems:'center', gap:5, marginBottom:10 }}>
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Visakhapatnam, India
              </div>
              <a href="https://github.com/Mahesh-363" target="_blank" rel="noreferrer" style={{ fontFamily:mono, fontSize:10, padding:'5px 12px', borderRadius:7, border:`1px solid ${C.b2}`, color:C.t2, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                github.com/Mahesh-363
              </a>
            </div>
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}><span style={{ fontFamily:mono, fontSize:9, color:C.t3, letterSpacing:'.14em' }}>ABOUT</span><div style={{ flex:1, height:1, background:C.b1 }}/></div>
            <p style={{ fontSize:13, color:C.t2, lineHeight:1.8 }}><strong style={{ color:C.t1 }}>Media X Trim</strong> is a free, no-login tool for converting video, audio and image files — and downloading from YouTube, Instagram, TikTok, Facebook and 1000+ platforms. No ads, no accounts needed.</p>
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}><span style={{ fontFamily:mono, fontSize:9, color:C.t3, letterSpacing:'.14em' }}>BUILT WITH</span><div style={{ flex:1, height:1, background:C.b1 }}/></div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {stack.map(s=><span key={s} style={{ fontFamily:mono, fontSize:10, padding:'5px 12px', borderRadius:7, border:`1px solid ${C.b1}`, color:C.t2, background:C.s2 }}>{s}</span>)}
            </div>
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}><span style={{ fontFamily:mono, fontSize:9, color:C.t3, letterSpacing:'.14em' }}>HOW IT WORKS</span><div style={{ flex:1, height:1, background:C.b1 }}/></div>
            {steps.map((s,i)=>(
              <div key={i} style={{ display:'flex', gap:14, padding:'12px 0', borderBottom: i<steps.length-1?`1px solid ${C.b1}`:'none' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', border:`1px solid ${C.b2}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:mono, fontSize:11, color:C.gold, flexShrink:0 }}>{i+1}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.t1, marginBottom:2 }}>{s.t}</div>
                  <div style={{ fontSize:12, color:C.t3, lineHeight:1.6 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Mobile tab bar ──
function MobileTabBar({ active, onChange }: { active:'convert'|'download', onChange:(t:'convert'|'download')=>void }) {
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:'rgba(6,6,8,0.97)', backdropFilter:'blur(20px)', borderTop:`1px solid ${C.b1}`, display:'flex', padding:'8px 16px 20px' }}>
      {(['convert','download'] as const).map(tab=>{
        const isActive = active === tab
        return (
          <button key={tab} onClick={()=>onChange(tab)} style={{
            flex:1, padding:'12px 8px', border:'none', borderRadius:12,
            background: isActive ? C.s3 : 'none',
            color: isActive ? C.t1 : C.t3,
            fontFamily:syne, fontSize:14, fontWeight:700, cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:6,
            transition:'all .2s',
          }}>
            {tab === 'convert' ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            )}
            <span style={{ fontSize:11 }}>{tab === 'convert' ? 'Convert' : 'Download'}</span>
            {isActive && <div style={{ width:4, height:4, borderRadius:'50%', background:C.gold, boxShadow:`0 0 6px ${C.gold}` }}/>}
          </button>
        )
      })}
    </div>
  )
}

// ── App root ──
export default function App() {
  const [about, setAbout]   = useState(false)
  const [mobileTab, setMobileTab] = useState<'convert'|'download'>('convert')
  const isMobile = useIsMobile()

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:inter }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&family=Inter:wght@300;400;500&display=swap');
        @keyframes spin  { to { transform:rotate(360deg) } }
        @keyframes prog  { 0%{width:0%;margin-left:0} 60%{width:60%;margin-left:20%} 100%{width:0%;margin-left:100%} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,184,0,0.6)} 50%{box-shadow:0 0 0 8px rgba(255,184,0,0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.15} }
        @keyframes bgd1  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(4%,3%)} }
        @keyframes bgd2  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-3%,-4%)} }
        * { box-sizing:border-box }
        input { color:#FFFFFF }
        input::placeholder { color:#505070 }
        button { font-family:inherit }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-track { background:${C.bg} }
        ::-webkit-scrollbar-thumb { background:${C.b2}; border-radius:2px }
      `}</style>

      {/* Background */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20%', left:'-10%', width:'60%', height:'60%', background:'radial-gradient(ellipse,rgba(124,58,237,0.08) 0%,transparent 65%)', animation:'bgd1 18s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:'55%', height:'55%', background:'radial-gradient(ellipse,rgba(255,184,0,0.08) 0%,transparent 65%)', animation:'bgd2 22s ease-in-out infinite' }}/>
      </div>
      <div style={{ position:'fixed', inset:0, zIndex:0, backgroundImage:`linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)`, backgroundSize:'48px 48px', pointerEvents:'none' }}/>

      {/* Topbar */}
      <div style={{ position:'fixed', top:0, left:0, right:0, height:60, display:'flex', alignItems:'center', justifyContent:'space-between', padding:`0 ${isMobile ? '16px' : '40px'}`, zIndex:100, borderBottom:`1px solid ${C.b1}`, background:'rgba(6,6,8,0.92)', backdropFilter:'blur(24px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${C.gold},${C.gold2})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 20px rgba(255,184,0,0.4)` }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="#060608" strokeWidth="2.2" strokeLinecap="round" width="14" height="14"><path d="M3 8h10M8 3l5 5-5 5"/></svg>
          </div>
          <span style={{ fontFamily:syne, fontSize: isMobile ? 16 : 18, fontWeight:800, color:C.t1, letterSpacing:'-.02em' }}>
            Media <span style={{ color:C.gold }}>X</span> Trim
          </span>
        </div>

        {/* Desktop tabs */}
        {!isMobile && (
          <div style={{ display:'flex', alignItems:'center', gap:4, background:C.s2, border:`1px solid ${C.b1}`, borderRadius:10, padding:4 }}>
            <button style={{ padding:'7px 20px', borderRadius:7, border:'none', background:C.s4, color:C.t1, fontFamily:inter, fontSize:12, fontWeight:500, cursor:'pointer', boxShadow:'0 1px 6px rgba(0,0,0,.5)' }}>Convert File</button>
            <button style={{ padding:'7px 20px', borderRadius:7, border:'none', background:'none', color:C.t3, fontFamily:inter, fontSize:12, fontWeight:500, cursor:'pointer' }}>Download Video</button>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={()=>setAbout(true)} style={{ fontFamily:mono, fontSize:10, padding:'6px 14px', border:`1px solid ${C.b2}`, borderRadius:8, background:'none', color:C.t2, cursor:'pointer', letterSpacing:'.05em' }}>ABOUT</button>
          {!isMobile && <div style={{ fontFamily:mono, fontSize:10, padding:'5px 10px', borderRadius:8, border:`1px solid ${C.goldB}`, background:C.goldD, color:C.gold, letterSpacing:'.05em' }}>FREE</div>}
        </div>
      </div>

      {/* Main content */}
      <div style={{
        marginTop:60,
        marginBottom: isMobile ? 80 : 0,
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: isMobile ? undefined : '1fr 1fr',
        minHeight:'calc(100vh - 60px)',
        position:'relative', zIndex:1,
      }}>
        {/* Desktop divider */}
        {!isMobile && <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, background:`linear-gradient(180deg,transparent,${C.b2} 15%,${C.b2} 85%,transparent)` }}/>}

        {/* Show both on desktop, toggle on mobile */}
        {(!isMobile || mobileTab === 'convert') && <ConvertPanel isMobile={isMobile}/>}
        {(!isMobile || mobileTab === 'download') && <DownloadPanel isMobile={isMobile}/>}
      </div>

      {/* Footer — desktop only */}
      {!isMobile && (
        <div style={{ borderTop:`1px solid ${C.b1}`, padding:'20px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', zIndex:1 }}>
          <div style={{ fontFamily:syne, fontSize:14, fontWeight:700, color:C.t2 }}>Media <span style={{ color:C.gold }}>X</span> Trim</div>
          <div style={{ fontFamily:mono, fontSize:10, color:C.t3 }}>Made by a developer, for developers</div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      {isMobile && <MobileTabBar active={mobileTab} onChange={setMobileTab}/>}

      <AboutDrawer open={about} onClose={()=>setAbout(false)}/>
    </div>
  )
}