from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from authentication.models import ServiceProvider


class Command(BaseCommand):
    help = 'Create sample service provider accounts for testing'

    def handle(self, *args, **options):
        service_providers = [
            {
                'service_id': 'ADM-001',
                'name': 'SafeNow Admin',
                'email': 'admin@safenow.com',
                'password': 'admin123',
                'role': 'admin',
                'phone': '9876543210',
                'address': 'SafeNow Headquarters',
            },
            {
                'service_id': 'HSP-001',
                'name': 'City General Hospital',
                'email': 'admin@cityhospital.com',
                'password': 'hospital123',
                'role': 'hospital',
                'phone': '9876543211',
                'address': '123 Hospital Road, City Center',
            },
            {
                'service_id': 'HSP-002',
                'name': 'Emergency Medical Center',
                'email': 'admin@emc.com',
                'password': 'hospital123',
                'role': 'hospital',
                'phone': '9876543212',
                'address': '456 Medical Avenue, Downtown',
            },
            {
                'service_id': 'HSP-003',
                'name': 'Community Health Hospital',
                'email': 'admin@communityhospital.com',
                'password': 'hospital123',
                'role': 'hospital',
                'phone': '9876543213',
                'address': '789 Health Street, Suburb',
            },
            {
                'service_id': 'FIR-001',
                'name': 'City Fire Department',
                'email': 'admin@cityfire.com',
                'password': 'fire123',
                'role': 'fire',
                'phone': '9876543221',
                'address': '100 Fire Station Road',
            },
            {
                'service_id': 'FIR-002',
                'name': 'District Fire Brigade',
                'email': 'admin@districtfire.com',
                'password': 'fire123',
                'role': 'fire',
                'phone': '9876543222',
                'address': '200 Brigade Avenue',
            },
            {
                'service_id': 'NGO-001',
                'name': 'Community Support NGO',
                'email': 'admin@supportngo.com',
                'password': 'ngo123',
                'role': 'ngo',
                'phone': '9876543231',
                'address': '300 NGO Lane, Community Center',
            },
            {
                'service_id': 'NGO-002',
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

        for provider_data in service_providers:
            service_id = provider_data['service_id']
            password = provider_data.pop('password')
            
            # Check if provider already exists
            provider, created = ServiceProvider.objects.get_or_create(
                service_id=service_id,
                defaults={
                    **provider_data,
                    'password': make_password(password),
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created: {service_id} - {provider.name}')
                )
            else:
                # Update existing provider
                for key, value in provider_data.items():
                    setattr(provider, key, value)
                provider.password = make_password(password)
                provider.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'⟳ Updated: {service_id} - {provider.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Complete! Created: {created_count}, Updated: {updated_count}'
            )
        )
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('TEST CREDENTIALS:'))
        self.stdout.write('='*60)
        self.stdout.write('Admin:')
        self.stdout.write('  Service ID: ADM-001  |  Password: admin123')
        self.stdout.write('\nHospitals:')
        self.stdout.write('  Service ID: HSP-001  |  Password: hospital123')
        self.stdout.write('  Service ID: HSP-002  |  Password: hospital123')
        self.stdout.write('  Service ID: HSP-003  |  Password: hospital123')
        self.stdout.write('\nFire Departments:')
        self.stdout.write('  Service ID: FIR-001  |  Password: fire123')
        self.stdout.write('  Service ID: FIR-002  |  Password: fire123')
        self.stdout.write('\nNGOs:')
        self.stdout.write('  Service ID: NGO-001  |  Password: ngo123')
        self.stdout.write('  Service ID: NGO-002  |  Password: ngo123')
        self.stdout.write('='*60 + '\n')
