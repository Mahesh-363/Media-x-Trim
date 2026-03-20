import uuid
from django.db import models


class Job(models.Model):
    class JobType(models.TextChoices):
        CONVERT = 'convert', 'Format Convert'
        DOWNLOAD = 'download', 'Video Download'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        DONE = 'done', 'Done'
        ERROR = 'error', 'Error'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_type = models.CharField(max_length=20, choices=JobType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    # Convert jobs
    original_filename = models.CharField(max_length=255, blank=True)
    input_format = models.CharField(max_length=20, blank=True)
    output_format = models.CharField(max_length=20, blank=True)

    # Download jobs
    source_url = models.URLField(blank=True)
    platform = models.CharField(max_length=50, blank=True)
    download_quality = models.CharField(max_length=20, default='best')

    # Result
    output_url = models.URLField(blank=True, max_length=1000)
    output_filename = models.CharField(max_length=255, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.job_type} | {self.status} | {self.id}'