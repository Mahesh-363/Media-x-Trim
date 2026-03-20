from django.urls import path
from .views import ConvertView, DownloadView, JobStatusView, FormatsView, DownloadFileView

urlpatterns = [
    path('convert/', ConvertView.as_view(), name='convert'),
    path('download/', DownloadView.as_view(), name='download'),
    path('jobs/<uuid:job_id>/', JobStatusView.as_view(), name='job-status'),
    path('formats/', FormatsView.as_view(), name='formats'),
    path('file/<str:filename>/', DownloadFileView.as_view(), name='download-file'),
]