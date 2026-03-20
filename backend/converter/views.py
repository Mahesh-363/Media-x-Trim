import os
import uuid
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Job
from .serializers import JobSerializer, ConvertRequestSerializer, DownloadRequestSerializer
from .tasks import convert_file_task, download_video_task

# All formats FFmpeg can handle as INPUT
SUPPORTED_INPUT_FORMATS = [
    'mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv', '3gp',
    'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus',
    'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff',
    'pdf',  # FFmpeg can convert PDF pages to images
]


class ConvertView(APIView):
    def post(self, request):
        serializer = ConvertRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = serializer.validated_data['file']
        output_format = serializer.validated_data['output_format']
        original_name = uploaded_file.name
        input_format = original_name.rsplit('.', 1)[-1].lower() if '.' in original_name else ''

        if input_format not in SUPPORTED_INPUT_FORMATS:
            return Response(
                {'error': f'Input format ".{input_format}" is not supported. Supported: video, audio, and image files.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if input_format == output_format:
            return Response(
                {'error': 'Input and output formats are the same.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save to temp
        temp_filename = f"{uuid.uuid4()}.{input_format}"
        temp_path = os.path.join(settings.TEMP_DIR, temp_filename)
        with open(temp_path, 'wb') as f:
            for chunk in uploaded_file.chunks():
                f.write(chunk)

        job = Job.objects.create(
            job_type=Job.JobType.CONVERT,
            original_filename=original_name,
            input_format=input_format,
            output_format=output_format,
        )
        convert_file_task.delay(str(job.id), temp_path)
        return Response(JobSerializer(job).data, status=status.HTTP_202_ACCEPTED)


class DownloadView(APIView):
    def post(self, request):
        serializer = DownloadRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        job = Job.objects.create(
            job_type=Job.JobType.DOWNLOAD,
            source_url=serializer.validated_data['url'],
            download_quality=serializer.validated_data['quality'],
        )
        download_video_task.delay(str(job.id))
        return Response(JobSerializer(job).data, status=status.HTTP_202_ACCEPTED)


class JobStatusView(APIView):
    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(JobSerializer(job).data)


class FormatsView(APIView):
    def get(self, request):
        return Response({
            'video': ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv', '3gp'],
            'audio': ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus'],
            'image': ['jpg', 'png', 'webp', 'gif', 'bmp', 'tiff'],
            'download_platforms': ['YouTube', 'Facebook', 'Instagram', 'Snapchat', 'TikTok', 'Twitter/X', 'Vimeo'],
            'download_qualities': ['best', '1080p', '720p', '480p', '360p', 'audio_only'],
        })

import mimetypes
from django.http import FileResponse, Http404

class DownloadFileView(APIView):
    """Serves files from MEDIA_ROOT as proper attachments."""
    permission_classes = []

    def get(self, request, filename):
        # Security: strip any path traversal
        filename = os.path.basename(filename)
        file_path = os.path.join(settings.MEDIA_ROOT, filename)

        if not os.path.exists(file_path):
            raise Http404("File not found or already deleted.")

        mime_type, _ = mimetypes.guess_type(file_path)
        mime_type = mime_type or 'application/octet-stream'

        response = FileResponse(
            open(file_path, 'rb'),
            content_type=mime_type,
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = os.path.getsize(file_path)
        return response