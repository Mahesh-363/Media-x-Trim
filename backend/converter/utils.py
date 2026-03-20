import boto3
from django.conf import settings


def get_r2_client():
    return boto3.client(
        's3',
        endpoint_url=settings.R2_ENDPOINT,
        aws_access_key_id=settings.R2_ACCESS_KEY,
        aws_secret_access_key=settings.R2_SECRET_KEY,
        region_name='auto',
    )


def upload_to_r2(local_path: str, r2_key: str) -> str:
    """Upload a file to Cloudflare R2 and return its public URL."""
    client = get_r2_client()
    with open(local_path, 'rb') as f:
        client.upload_fileobj(f, settings.R2_BUCKET, r2_key)
    return f"{settings.R2_PUBLIC_URL}/{r2_key}"


def delete_from_r2(r2_key: str):
    """Delete a file from R2."""
    client = get_r2_client()
    client.delete_object(Bucket=settings.R2_BUCKET, Key=r2_key)