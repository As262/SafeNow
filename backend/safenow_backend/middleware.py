"""
Middleware to handle database connection management
"""
from django.db import connection


class DatabaseConnectionMiddleware:
    """Ensure database connections are properly closed after each request."""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Close the database connection if it's still open
        if connection.connection is not None:
            connection.close()
        
        return response
