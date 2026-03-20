from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'id', 'job_type', 'status',
            'original_filename', 'input_format', 'output_format',
            'source_url', 'platform', 'download_quality',
            'output_url', 'output_filename', 'file_size',
            'error_message', 'created_at',
        ]
        read_only_fields = [
            'id', 'status', 'output_url', 'output_filename',
            'file_size', 'error_message', 'created_at',
        ]


class ConvertRequestSerializer(serializers.Serializer):
    file = serializers.FileField()
    output_format = serializers.CharField(max_length=20)

    SUPPORTED_FORMATS = [
        'mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv', '3gp',
        'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus',
        'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff',
    ]

    def validate_output_format(self, value):
        if value.lower() not in self.SUPPORTED_FORMATS:
            raise serializers.ValidationError(
                f'Unsupported output format: {value}. Supported: {", ".join(self.SUPPORTED_FORMATS)}'
            )
        return value.lower()


class DownloadRequestSerializer(serializers.Serializer):
    url = serializers.URLField()
    quality = serializers.ChoiceField(
        choices=['best', '1080p', '720p', '480p', '360p', 'audio_only'],
        default='best'
    )

    # yt-dlp supports 1000+ sites — we only reject truly unsupported ones
    BLOCKED_DOMAINS = [
        'netflix.com', 'spotify.com', 'apple.com',
        'disneyplus.com', 'primevideo.com', 'hulu.com',
    ]

    def validate_url(self, value):
        from urllib.parse import urlparse
        domain = urlparse(value).netloc.lower().replace('www.', '')
        if any(b in domain for b in self.BLOCKED_DOMAINS):
            raise serializers.ValidationError(
                f'This platform uses DRM protection and cannot be downloaded.'
            )
        return value