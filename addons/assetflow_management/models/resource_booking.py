from odoo import models, fields


class AssetFlowResourceBooking(models.Model):
    _name = 'assetflow.resource.booking'
    _description = 'Resource Booking'
    _order = 'start_datetime desc'

    resource_type = fields.Selection([
        ('room', 'Meeting Room'),
        ('vehicle', 'Vehicle'),
        ('equipment', 'Equipment')
    ], string='Resource Type', required=True)
    resource_name = fields.Char(string='Resource Name', required=True)
    employee_id = fields.Many2one('assetflow.employee', string='Booked By')
    start_datetime = fields.Datetime(string='Start Date/Time', required=True)
    end_datetime = fields.Datetime(string='End Date/Time', required=True)
    purpose = fields.Text(string='Purpose')
    state = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='draft')
    active = fields.Boolean(string='Active', default=True)
