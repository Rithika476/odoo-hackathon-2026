from odoo import models, fields


class AssetFlowDepartment(models.Model):
    _name = 'assetflow.department'
    _description = 'Department'
    _order = 'name'

    name = fields.Char(string='Department Name', required=True)
    code = fields.Char(string='Code', required=True)
    manager_id = fields.Many2one('assetflow.employee', string='Manager')
    employee_ids = fields.One2many('assetflow.employee', 'department_id', string='Employees')
    asset_ids = fields.One2many('assetflow.asset', 'department_id', string='Assets')
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'Department code must be unique.'),
    ]
