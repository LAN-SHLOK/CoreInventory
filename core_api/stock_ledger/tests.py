from django.test import TestCase
from .models import Warehouse, Location, Product, StockMovement
from django.contrib.auth.models import User

class StockLedgerModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='stockuser', password='password123')
        self.warehouse = Warehouse.objects.create(name='Main Warehouse', short_code='MWH')
        self.location = Location.objects.create(warehouse=self.warehouse, name='Shelf A', is_internal=True)
        self.product = Product.objects.create(
            name='Test Product',
            sku='TEST-001',
            category='Raw Material',
            unit_of_measure='kg',
            current_stock=50,
            reorder_level=10
        )

    def test_warehouse_creation(self):
        self.assertEqual(self.warehouse.name, 'Main Warehouse')
        self.assertEqual(str(self.warehouse), 'Main Warehouse')

    def test_location_creation(self):
        self.assertEqual(self.location.warehouse.name, 'Main Warehouse')
        self.assertEqual(str(self.location), 'Main Warehouse - Shelf A')

    def test_product_creation(self):
        self.assertEqual(self.product.current_stock, 50)
        self.assertEqual(str(self.product), '[TEST-001] Test Product')

    def test_stock_movement_creation(self):
        movement = StockMovement.objects.create(
            product=self.product,
            movement_type='RECEIPT',
            status='DONE',
            quantity=25,
            destination=self.location,
            user=self.user
        )
        self.assertEqual(movement.movement_type, 'RECEIPT')
        self.assertEqual(movement.quantity, 25)
        self.assertEqual(str(movement), 'RECEIPT - TEST-001 (25)')
