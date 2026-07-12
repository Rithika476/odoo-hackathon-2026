from odoo import models, fields, api


class AssetFlowDashboardSummary(models.TransientModel):
    _name = 'assetflow.dashboard.summary'
    _description = 'AssetFlow Dashboard Summary'

    name = fields.Char(string='Dashboard', default='AssetFlow Dashboard')
    total_assets = fields.Integer(string='Total Assets', compute='_compute_summary', readonly=True)
    available_assets = fields.Integer(string='Available Assets', compute='_compute_summary', readonly=True)
    allocated_assets = fields.Integer(string='Allocated Assets', compute='_compute_summary', readonly=True)
    maintenance_assets = fields.Integer(string='Maintenance Assets', compute='_compute_summary', readonly=True)
    total_asset_value = fields.Float(string='Total Asset Value', compute='_compute_summary', readonly=True)

    @api.depends()
    def _compute_summary(self):
        for record in self:
            assets = self.env['assetflow.asset'].search([])
            record.total_assets = len(assets)
            record.available_assets = len(assets.filtered(lambda a: a.state == 'available'))
            record.allocated_assets = len(assets.filtered(lambda a: a.state == 'allocated'))
            record.maintenance_assets = len(assets.filtered(lambda a: a.state == 'maintenance'))
            record.total_asset_value = sum(assets.mapped('value'))
