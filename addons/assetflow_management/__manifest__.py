{
    'name': 'AssetFlow Management',
    'version': '1.0.0',
    'summary': 'Enterprise asset and resource management',
    'description': 'Odoo addon for managing assets, categories, and allocations.',
    'author': 'AssetFlow Team',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/asset_views.xml',
        'views/allocation_views.xml',
        'views/menu_views.xml',
        'data/asset_data.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
