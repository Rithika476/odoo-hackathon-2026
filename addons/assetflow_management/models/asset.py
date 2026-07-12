from odoo import models, fields, api


class AssetFlowAsset(models.Model):
    _name = 'assetflow.asset'
    _description = 'Asset'
    _order = 'name'

    name = fields.Char(string='Asset Name', required=True)
    asset_tag = fields.Char(string='Asset Tag', required=True, copy=False, index=True)
    serial_number = fields.Char(string='Serial Number', required=True)
    category_id = fields.Many2one('assetflow.asset.category', string='Category', required=True)
    state = fields.Selection([
        ('available', 'Available'),
        ('allocated', 'Allocated'),
        ('maintenance', 'Under Maintenance'),
        ('retired', 'Retired')
    ], string='Status', default='available')
    purchase_date = fields.Date(string='Purchase Date')
    warranty_end = fields.Date(string='Warranty End')
    value = fields.Float(string='Value')
    location = fields.Char(string='Location')
    assigned_to = fields.Many2one('res.partner', string='Assigned To')
    description = fields.Text(string='Description')
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('asset_tag_unique', 'unique(asset_tag)', 'Asset tag must be unique.'),
        ('serial_unique', 'unique(serial_number)', 'Serial number must be unique.'),
    ]
