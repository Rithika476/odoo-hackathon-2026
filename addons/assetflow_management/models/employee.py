from odoo import models, fields


class AssetFlowEmployee(models.Model):
    _name = 'assetflow.employee'
    _description = 'Employee'
    _order = 'name'

    name = fields.Char(string='Employee Name', required=True)
    employee_code = fields.Char(string='Employee Code', required=True)
    department_id = fields.Many2one('assetflow.department', string='Department')
    job_title = fields.Char(string='Job Title')
    email = fields.Char(string='Email')
    phone = fields.Char(string='Phone')
    asset_request_ids = fields.One2many('assetflow.asset.request', 'employee_id', string='Asset Requests')
    allocation_ids = fields.One2many('assetflow.asset.allocation', 'employee_id', string='Allocations')
    managed_department_id = fields.Many2one('assetflow.department', string='Managed Department')
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('employee_code_unique', 'unique(employee_code)', 'Employee code must be unique.'),
    ]
