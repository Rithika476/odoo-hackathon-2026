{
    'name': 'AssetFlow',
    'version': '1.0.0',
    'summary': 'Enterprise Asset and Resource Management',
    'description': 'Asset management, allocations, maintenance, bookings, and audits for Odoo.',
    'author': 'AssetFlow Team',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/assetflow_menu.xml',
        'views/asset_views.xml',
        'views/department_views.xml',
        'views/booking_views.xml',
        'views/maintenance_views.xml'
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3'
}
