import uuid
from django.db import models
from django.conf import settings


class SOSRequest(models.Model):
    """SOS Emergency Request model."""

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )

    TYPE_CHOICES = (
        ('Ambulance', 'Ambulance'),
        ('Police', 'Police'),
        ('Medical Help', 'Medical Help'),
        ('NGO Support', 'NGO Support'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sos_requests'
    )
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    accuracy = models.FloatField(null=True, blank=True)
    address = models.CharField(max_length=500, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    responded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responded_requests'
    )
    response_time = models.CharField(max_length=50, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"SOS {self.type} by {self.user.name} - {self.status}"

    def calculate_response_time(self):
        """Calculate response time when request is accepted."""
        if self.accepted_at and self.created_at:
            diff = self.accepted_at - self.created_at
            minutes = int(diff.total_seconds() / 60)
            if minutes < 1:
                return "Less than 1 minute"
            return f"{minutes} minutes"
        return ""
