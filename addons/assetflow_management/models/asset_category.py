from odoo import models, fields


class AssetFlowAssetCategory(models.Model):
    _name = 'assetflow.asset.category'
    _description = 'Asset Category'
    _order = 'name'

    name = fields.Char(string='Category Name', required=True)
    code = fields.Char(string='Code', required=True)
    description = fields.Text(string='Description')
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'Category code must be unique.'),
    ]
