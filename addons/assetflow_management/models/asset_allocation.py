from odoo import models, fields


class AssetFlowAssetAllocation(models.Model):
    _name = 'assetflow.asset.allocation'
    _description = 'Asset Allocation'
    _order = 'date_start desc'

    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True)
    partner_id = fields.Many2one('res.partner', string='Assigned To', required=True)
    date_start = fields.Date(string='Start Date', required=True)
    date_end = fields.Date(string='End Date')
    state = fields.Selection([
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('returned', 'Returned')
    ], string='Status', default='draft')
    notes = fields.Text(string='Notes')
