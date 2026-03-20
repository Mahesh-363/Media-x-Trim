import os
import uuid
import ffmpeg
import yt_dlp
from celery import shared_task
from django.conf import settings

from .models import Job
from .utils import upload_to_r2

VIDEO_FORMATS = ['mp4','avi','mkv','mov','webm','flv','wmv','3gp']
AUDIO_FORMATS = ['mp3','wav','flac','aac','m4a','ogg','opus']
IMAGE_FORMATS = ['jpg','jpeg','png','webp','gif','bmp','tiff']

def _format_type(fmt):
    fmt = fmt.lower()
    if fmt in VIDEO_FORMATS: return 'video'
    if fmt in AUDIO_FORMATS: return 'audio'
    if fmt in IMAGE_FORMATS: return 'image'
    return 'unknown'


@shared_task(bind=True, max_retries=2)
def convert_file_task(self, job_id: str, input_path: str):
    job = Job.objects.get(id=job_id)
    job.status = Job.Status.PROCESSING
    job.save(update_fields=['status'])

    output_filename = f"{uuid.uuid4()}.{job.output_format}"
    output_path = os.path.join(settings.TEMP_DIR, output_filename)

    try:
        out_type = _format_type(job.output_format)
        stream = ffmpeg.input(input_path)

        if out_type == 'audio':
            stream = ffmpeg.output(stream.audio, output_path)
        else:
            stream = ffmpeg.output(stream, output_path)

        ffmpeg.run(stream, overwrite_output=True, quiet=True)

        if settings.R2_PUBLIC_URL:
            r2_key = f"converted/{output_filename}"
            public_url = upload_to_r2(output_path, r2_key)
        else:
            import shutil
            dest = os.path.join(settings.MEDIA_ROOT, output_filename)
            shutil.copy(output_path, dest)
            public_url = f"/api/file/{output_filename}"

        file_size = os.path.getsize(output_path)
        job.status = Job.Status.DONE
        job.output_url = public_url
        job.output_filename = output_filename
        job.file_size = file_size
        job.save(update_fields=['status','output_url','output_filename','file_size'])

    except Exception as exc:
        job.status = Job.Status.ERROR
        job.error_message = str(exc)
        job.save(update_fields=['status','error_message'])
        raise self.retry(exc=exc, countdown=10)

    finally:
        for path in [input_path, output_path]:
            if path and os.path.exists(path):
                try: os.remove(path)
                except: pass


@shared_task(bind=True, max_retries=2)
def download_video_task(self, job_id: str):
    job = Job.objects.get(id=job_id)
    job.status = Job.Status.PROCESSING
    job.save(update_fields=['status'])

    uid = str(uuid.uuid4())
    output_template = os.path.join(settings.TEMP_DIR, f"{uid}.%(ext)s")

    quality_map = {
        '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
        '720p':  'bestvideo[height<=720]+bestaudio/best[height<=720]',
        '480p':  'bestvideo[height<=480]+bestaudio/best[height<=480]',
        '360p':  'bestvideo[height<=360]+bestaudio/best[height<=360]',
        'audio_only': 'bestaudio/best',
    }

    ydl_opts = {
    'format': quality_map.get(job.download_quality, 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best'),
    'outtmpl': output_template,
    'merge_output_format': 'mp4',
    'quiet': True,
    'no_warnings': True,
    'noprogress': True,
    'postprocessor_args': {
        'ffmpeg': ['-c:a', 'aac', '-b:a', '192k'],
    },
    }



    if job.download_quality == 'audio_only':
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
        }]

    actual_path = None
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(job.source_url, download=True)
            title = info.get('title', 'video')[:60]
            platform = info.get('extractor_key', 'unknown').lower()

        # Find the actual downloaded file by uid prefix
        for f in os.listdir(settings.TEMP_DIR):
            if f.startswith(uid):
                actual_path = os.path.join(settings.TEMP_DIR, f)
                break

        if not actual_path or not os.path.exists(actual_path):
            raise Exception("Downloaded file not found after yt-dlp")

        ext = actual_path.rsplit('.', 1)[-1]
        output_filename = f"{uid}.{ext}"

        if settings.R2_PUBLIC_URL:
            r2_key = f"downloads/{output_filename}"
            public_url = upload_to_r2(actual_path, r2_key)
        else:
            import shutil
            dest = os.path.join(settings.MEDIA_ROOT, output_filename)
            shutil.copy(actual_path, dest)
            public_url = f"/api/file/{output_filename}"

        file_size = os.path.getsize(actual_path)
        job.status = Job.Status.DONE
        job.output_url = public_url
        job.output_filename = f"{title}.{ext}"
        job.file_size = file_size
        job.platform = platform
        job.save(update_fields=['status','output_url','output_filename','file_size','platform'])

    except Exception as exc:
        job.status = Job.Status.ERROR
        job.error_message = str(exc)
        job.save(update_fields=['status','error_message'])
        raise self.retry(exc=exc, countdown=15)

    finally:
        if actual_path and os.path.exists(actual_path):
            try: os.remove(actual_path)
            except: pass