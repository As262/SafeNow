import json
import uuid
import logging
from decimal import Decimal
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger('sos')


class SafeJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles UUID, Decimal, datetime."""
    def default(self, obj):
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


class SOSConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time SOS notifications."""

    async def connect(self):
        """Handle WebSocket connection."""
        self.user_mobile = self.scope.get('url_route', {}).get('kwargs', {}).get('mobile', None)
        self.user_role = self.scope.get('url_route', {}).get('kwargs', {}).get('role', 'user')

        query_string = self.scope.get('query_string', b'').decode()
        params = dict(p.split('=') for p in query_string.split('&') if '=' in p)

        self.user_role = params.get('role', 'user')
        self.user_mobile = params.get('mobile', '')

        if self.user_role == 'admin':
            await self.channel_layer.group_add('admin_sos', self.channel_name)
            logger.info(f"Admin connected to WebSocket: {self.channel_name}")
        else:
            if self.user_mobile:
                await self.channel_layer.group_add(
                    f'user_{self.user_mobile}', self.channel_name
                )
            logger.info(f"User {self.user_mobile} connected to WebSocket")

        await self.accept()

        if self.user_role == 'admin':
            pending = await self.get_pending_requests()
            await self.send(text_data=json.dumps({
                'type': 'initial_requests',
                'requests': pending,
            }, cls=SafeJSONEncoder))

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if self.user_role == 'admin':
            await self.channel_layer.group_discard('admin_sos', self.channel_name)
        elif self.user_mobile:
            await self.channel_layer.group_discard(
                f'user_{self.user_mobile}', self.channel_name
            )
        logger.info(f"WebSocket disconnected: {self.channel_name}")

    async def receive(self, text_data=None, bytes_data=None):
        """Handle incoming WebSocket messages."""
        try:
            content = json.loads(text_data)
            msg_type = content.get('type', '')

            if msg_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except json.JSONDecodeError:
            pass

    async def new_sos_request(self, event):
        """Broadcast new SOS request to admin group."""
        await self.send(text_data=json.dumps({
            'type': 'new_request',
            'request': event['request'],
        }, cls=SafeJSONEncoder))

    async def sos_status_update(self, event):
        """Broadcast status update to relevant parties."""
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'request': event['request'],
        }, cls=SafeJSONEncoder))

    @database_sync_to_async
    def get_pending_requests(self):
        """Get all pending SOS requests for admin initial load."""
        from .models import SOSRequest
        from .serializers import SOSRequestSerializer

        requests = SOSRequest.objects.filter(
            status='pending'
        ).select_related('user').order_by('-created_at')

        return SOSRequestSerializer(requests, many=True).data
