from django.db import migrations

def create_defaults(apps, schema_editor):
    Warehouse = apps.get_model('stock_ledger', 'Warehouse')
    Location = apps.get_model('stock_ledger', 'Location')
    Product = apps.get_model('stock_ledger', 'Product')

    # 1. Warehouses
    wh1, _ = Warehouse.objects.get_or_create(name='Main Warehouse', defaults={'short_code': 'WH-MAIN'})
    wh2, _ = Warehouse.objects.get_or_create(name='Secondary Warehouse', defaults={'short_code': 'WH-SEC'})
    
    # 2. Locations
    Location.objects.get_or_create(name='Shelf A', warehouse=wh1, defaults={'short_code': 'SHELF-A'})
    Location.objects.get_or_create(name='Shelf B', warehouse=wh1, defaults={'short_code': 'SHELF-B'})
    Location.objects.get_or_create(name='Bin 10', warehouse=wh2, defaults={'short_code': 'BIN-10'})
    Location.objects.get_or_create(name='Bin 20', warehouse=wh2, defaults={'short_code': 'BIN-20'})

    # 3. Products
    Product.objects.get_or_create(
        sku='SKU-001',
        defaults={
            'name': 'Sample Product 1',
            'category': 'Electronics',
            'unit_of_measure': 'Units',
            'current_stock': 100,
            'price': 10.99
        }
    )
    Product.objects.get_or_create(
        sku='SKU-002',
        defaults={
            'name': 'Sample Product 2',
            'category': 'Furniture',
            'unit_of_measure': 'Boxes',
            'current_stock': 50,
            'price': 45.00
        }
    )

class Migration(migrations.Migration):
    dependencies = [
        ('stock_ledger', '0008_alter_location_id_alter_product_id_and_more'),
    ]
    operations = [
        migrations.RunPython(create_defaults),
    ]
