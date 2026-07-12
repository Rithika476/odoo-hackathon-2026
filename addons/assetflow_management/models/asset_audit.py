from odoo import models, fields


class AssetFlowAssetAudit(models.Model):
    _name = 'assetflow.asset.audit'
    _description = 'Asset Audit'
    _order = 'audit_date desc'

    name = fields.Char(string='Audit Name', required=True)
    audit_date = fields.Date(string='Audit Date', required=True)
    department_id = fields.Many2one('assetflow.department', string='Department')
    asset_ids = fields.Many2many('assetflow.asset', string='Assets')
    auditor_id = fields.Many2one('assetflow.employee', string='Auditor')
    state = fields.Selection([
        ('draft', 'Draft'),
        ('in_progress', 'In Progress'),
        ('done', 'Done')
    ], string='Status', default='draft')
    notes = fields.Text(string='Notes')
    active = fields.Boolean(string='Active', default=True)
