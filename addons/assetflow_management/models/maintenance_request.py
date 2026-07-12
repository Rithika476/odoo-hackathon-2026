from odoo import models, fields, api, exceptions


class AssetFlowMaintenanceRequest(models.Model):
    _name = 'assetflow.maintenance.request'
    _description = 'Maintenance Request'
    _order = 'create_date desc'

    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True)
    employee_id = fields.Many2one('assetflow.employee', string='Requested By')
    issue_description = fields.Text(string='Issue Description', required=True)
    priority = fields.Selection([
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    ], string='Priority', default='medium')
    state = fields.Selection([
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('done', 'Done')
    ], string='Status', default='draft')
    notes = fields.Text(string='Notes')
    maintenance_cost = fields.Float(string='Maintenance Cost', default=0.0)
    active = fields.Boolean(string='Active', default=True)

    @api.constrains('asset_id', 'state')
    def _check_maintenance_state(self):
        for record in self:
            if record.state == 'done' and not record.notes:
                raise exceptions.ValidationError('Maintenance completion requires notes.')

    def action_send_to_maintenance(self):
        self.ensure_one()
        self.write({'state': 'pending'})
        self.asset_id.write({'state': 'maintenance'})

    def action_start_maintenance(self):
        self.ensure_one()
        self.write({'state': 'in_progress'})

    def action_complete_maintenance(self):
        self.ensure_one()
        if not self.notes:
            raise exceptions.UserError('Please add completion notes before closing the request.')
        self.write({'state': 'done'})
        self.asset_id.write({'state': 'available'})
