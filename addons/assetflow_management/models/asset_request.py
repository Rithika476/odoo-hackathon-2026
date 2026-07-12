from odoo import models, fields, api, exceptions
from datetime import date


class AssetFlowAssetRequest(models.Model):
    _name = 'assetflow.asset.request'
    _description = 'Asset Request'
    _order = 'create_date desc'

    name = fields.Char(string='Request Reference', required=True, copy=False, default='New')
    employee_id = fields.Many2one('assetflow.employee', string='Requested By', required=True)
    department_id = fields.Many2one('assetflow.department', string='Department', related='employee_id.department_id', store=True, readonly=True)
    asset_id = fields.Many2one('assetflow.asset', string='Requested Asset')
    allocation_id = fields.Many2one('assetflow.asset.allocation', string='Allocation', readonly=True)
    request_date = fields.Date(string='Request Date', default=fields.Date.context_today, required=True)
    required_from = fields.Date(string='Required From')
    required_until = fields.Date(string='Required Until')
    reason = fields.Text(string='Reason', required=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('allocated', 'Allocated'),
    ], string='Status', default='draft', tracking=True)
    notes = fields.Text(string='Notes')
    active = fields.Boolean(string='Active', default=True)

    @api.model
    def create(self, vals):
        if vals.get('name', 'New') == 'New':
            vals['name'] = self.env['ir.sequence'].next_by_code('assetflow.asset.request') or 'ARQ0001'
        return super().create(vals)

    @api.constrains('required_from', 'required_until')
    def _check_dates(self):
        for record in self:
            if record.required_from and record.required_until and record.required_from > record.required_until:
                raise exceptions.ValidationError('Required until date cannot be earlier than required from date.')

    def action_submit(self):
        self.ensure_one()
        if self.state != 'draft':
            raise exceptions.UserError('Only draft requests can be submitted.')
        self.write({'state': 'submitted'})

    def action_approve(self):
        self.ensure_one()
        if self.state != 'submitted':
            raise exceptions.UserError('Only submitted requests can be approved.')
        if not self.asset_id:
            raise exceptions.UserError('Please select an asset before approving the request.')
        if self.asset_id.state != 'available':
            raise exceptions.UserError('The selected asset is not available for allocation.')
        self.write({'state': 'approved'})

    def action_reject(self):
        self.ensure_one()
        if self.state not in ('submitted', 'approved'):
            raise exceptions.UserError('Only submitted or approved requests can be rejected.')
        self.write({'state': 'rejected'})

    def action_allocate_asset(self):
        self.ensure_one()
        if self.state != 'approved':
            raise exceptions.UserError('Only approved requests can be allocated.')
        if not self.asset_id:
            raise exceptions.UserError('Please select an asset before allocation.')
        if self.asset_id.state != 'available':
            raise exceptions.UserError('The selected asset is not available for allocation.')

        allocation = self.env['assetflow.asset.allocation'].create({
            'asset_id': self.asset_id.id,
            'employee_id': self.employee_id.id,
            'date_start': date.today(),
            'state': 'active',
            'notes': self.reason,
            'request_id': self.id,
        })
        self.asset_id.write({'state': 'allocated', 'assigned_to': self.employee_id})
        self.write({'state': 'allocated', 'allocation_id': allocation.id})
        return True
