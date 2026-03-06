from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from authentication.models import ServiceProvider


class Command(BaseCommand):
    help = 'Create sample service provider accounts for testing'

    def handle(self, *args, **options):
        # 7-digit pin code IDs:
        # 400xxxx = Admin, 100xxxx = Hospital, 300xxxx = Fire, 200xxxx = NGO
        service_providers = [
            {
                'service_id': '4001923',
                'name': 'SafeNow Admin',
                'email': 'admin@safenow.com',
                'password': 'admin123',
                'role': 'admin',
                'phone': '9876543210',
                'address': 'SafeNow Headquarters',
            },
            {
                'service_id': '1004782',
                'name': 'City General Hospital',
                'email': 'admin@cityhospital.com',
                'password': 'hospital123',
                'role': 'hospital',
                'phone': '9876543211',
                'address': '123 Hospital Road, City Center',
            },
            {
                'service_id': '1007361',
                'name': 'Emergency Medical Center',
                'email': 'admin@emc.com',
                'password': 'hospital123',
                'role': 'hospital',
                'phone': '9876543212',
                'address': '456 Medical Avenue, Downtown',
            },
            {
                'service_id': '1002594',
                'name': 'Community Health Hospital',
                'email': 'admin@communityhospital.com',
                'password': 'hospital123',
                'role': 'hospital',
                'phone': '9876543213',
                'address': '789 Health Street, Suburb',
            },
            {
                'service_id': '3006147',
                'name': 'City Fire Department',
                'email': 'admin@cityfire.com',
                'password': 'fire123',
                'role': 'fire',
                'phone': '9876543221',
                'address': '100 Fire Station Road',
            },
            {
                'service_id': '3008253',
                'name': 'District Fire Brigade',
                'email': 'admin@districtfire.com',
                'password': 'fire123',
                'role': 'fire',
                'phone': '9876543222',
                'address': '200 Brigade Avenue',
            },
            {
                'service_id': '2003891',
                'name': 'Community Support NGO',
                'email': 'admin@supportngo.com',
                'password': 'ngo123',
                'role': 'ngo',
                'phone': '9876543231',
                'address': '300 NGO Lane, Community Center',
            },
            {
                'service_id': '2005674',
                'name': 'Help Foundation',
                'email': 'admin@helpfoundation.org',
                'password': 'ngo123',
                'role': 'ngo',
                'phone': '9876543232',
                'address': '400 Foundation Street',
            },
        ]

        created_count = 0
        updated_count = 0

        # Remove old-format service providers (ADM-xxx, HSP-xxx, etc.)
        old_deleted, _ = ServiceProvider.objects.filter(
            service_id__regex=r'^(ADM|HSP|FIR|NGO)-'
        ).delete()
        if old_deleted:
            self.stdout.write(
                self.style.WARNING(f'Removed {old_deleted} old-format service providers')
            )

        for provider_data in service_providers:
            service_id = provider_data['service_id']
            password = provider_data.pop('password')
            
            # Use email as the lookup to handle re-runs cleanly
            provider, created = ServiceProvider.objects.update_or_create(
                email=provider_data['email'],
                defaults={
                    **provider_data,
                    'password': make_password(password),
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created: {provider.service_id} - {provider.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'⟳ Updated: {provider.service_id} - {provider.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Complete! Created: {created_count}, Updated: {updated_count}'
            )
        )
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('TEST CREDENTIALS:'))
        self.stdout.write('='*60)
        self.stdout.write('PIN Code Format: 400xxxx=Admin, 100xxxx=Hospital, 300xxxx=Fire, 200xxxx=NGO')
        self.stdout.write('-'*60)
        self.stdout.write('Admin:')
        self.stdout.write('  Service ID: 4001923  |  Password: admin123')
        self.stdout.write('\nHospitals:')
        self.stdout.write('  Service ID: 1004782  |  Password: hospital123')
        self.stdout.write('  Service ID: 1007361  |  Password: hospital123')
        self.stdout.write('  Service ID: 1002594  |  Password: hospital123')
        self.stdout.write('\nFire Departments:')
        self.stdout.write('  Service ID: 3006147  |  Password: fire123')
        self.stdout.write('  Service ID: 3008253  |  Password: fire123')
        self.stdout.write('\nNGOs:')
        self.stdout.write('  Service ID: 2003891  |  Password: ngo123')
        self.stdout.write('  Service ID: 2005674  |  Password: ngo123')
        self.stdout.write('='*60 + '\n')
