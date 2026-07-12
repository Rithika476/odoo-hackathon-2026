from odoo import models, fields, api, exceptions


class AssetFlowAssetAllocation(models.Model):
    _name = 'assetflow.asset.allocation'
    _description = 'Asset Allocation'
    _order = 'date_start desc'

    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True)
    employee_id = fields.Many2one('assetflow.employee', string='Assigned To', required=True)
    department_id = fields.Many2one('assetflow.department', string='Department', related='employee_id.department_id', store=True, readonly=True)
    date_start = fields.Date(string='Start Date', required=True)
    date_end = fields.Date(string='End Date')
    state = fields.Selection([
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('active', 'Active'),
        ('returned', 'Returned')
    ], string='Status', default='draft')
    notes = fields.Text(string='Notes')
    active = fields.Boolean(string='Active', default=True)

    @api.constrains('date_start', 'date_end')
    def _check_dates(self):
        for record in self:
            if record.date_end and record.date_start > record.date_end:
                raise exceptions.ValidationError('End date cannot be earlier than start date.')

    @api.constrains('asset_id', 'state')
    def _check_duplicate_allocation(self):
        for record in self:
            if record.state in ('approved', 'active'):
                existing = self.search([
                    ('asset_id', '=', record.asset_id.id),
                    ('state', 'in', ('approved', 'active')),
                    ('id', '!=', record.id),
                ])
                if existing:
                    raise exceptions.ValidationError('This asset already has an active allocation.')

    def action_approve(self):
        self.ensure_one()
        if self.asset_id.state != 'available':
            raise exceptions.UserError('Only available assets can be approved for allocation.')
        self.write({'state': 'approved'})
        self.asset_id.write({'state': 'allocated', 'assigned_to': self.employee_id})

    def action_return(self):
        self.ensure_one()
        if self.state not in ('approved', 'active'):
            raise exceptions.UserError('Only approved or active allocations can be returned.')
        self.write({'state': 'returned'})
        self.asset_id.write({'state': 'available', 'assigned_to': False})
