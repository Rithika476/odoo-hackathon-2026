from odoo import models, fields, api, exceptions


class AssetFlowAsset(models.Model):
    _name = 'assetflow.asset'
    _description = 'Asset'
    _order = 'name'

    name = fields.Char(string='Asset Name', required=True)
    asset_tag = fields.Char(string='Asset Tag', required=True, copy=False, index=True)
    serial_number = fields.Char(string='Serial Number', required=True)
    category_id = fields.Many2one('assetflow.asset.category', string='Category', required=True)
    department_id = fields.Many2one('assetflow.department', string='Department')
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
    assigned_to = fields.Many2one('assetflow.employee', string='Assigned To')
    description = fields.Text(string='Description')
    allocation_ids = fields.One2many('assetflow.asset.allocation', 'asset_id', string='Allocations')
    maintenance_ids = fields.One2many('assetflow.maintenance.request', 'asset_id', string='Maintenance Requests')
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('asset_tag_unique', 'unique(asset_tag)', 'Asset tag must be unique.'),
        ('serial_unique', 'unique(serial_number)', 'Serial number must be unique.'),
    ]

    @api.constrains('warranty_end')
    def _check_warranty_end(self):
        for record in self:
            if record.purchase_date and record.warranty_end and record.warranty_end < record.purchase_date:
                raise exceptions.ValidationError('Warranty end date cannot be earlier than purchase date.')

    def action_allocate(self):
        self.ensure_one()
        if self.state != 'available':
            raise exceptions.UserError('Only available assets can be allocated.')
        self.write({'state': 'allocated'})

    def action_return(self):
        self.ensure_one()
        if self.state != 'allocated':
            raise exceptions.UserError('Only allocated assets can be returned.')
        self.write({'state': 'available', 'assigned_to': False})

    def action_send_to_maintenance(self):
        self.ensure_one()
        if self.state == 'retired':
            raise exceptions.UserError('Retired assets cannot be sent to maintenance.')
        self.write({'state': 'maintenance'})

    def action_complete_maintenance(self):
        self.ensure_one()
        if self.state != 'maintenance':
            raise exceptions.UserError('Only assets under maintenance can be completed.')
        self.write({'state': 'available'})

    def action_view_allocations(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': 'Asset Allocations',
            'res_model': 'assetflow.asset.allocation',
            'view_mode': 'tree,form',
            'domain': [('asset_id', '=', self.id)],
            'context': {'default_asset_id': self.id},
        }

    def action_view_maintenance(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': 'Maintenance Requests',
            'res_model': 'assetflow.maintenance.request',
            'view_mode': 'tree,form',
            'domain': [('asset_id', '=', self.id)],
            'context': {'default_asset_id': self.id},
        }
