import { useEffect, useState } from 'react'
import axios from 'axios'
import { Pie, Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  Package,
  CheckCircle,
  User,
  Wrench,
  ArrowRightLeft,
  Clock,
  Calendar,
  Building2,
  TrendingUp,
  Activity
} from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function Dashboard({ user, darkMode }) {
  const [data, setData] = useState({ counts: {}, recent_activity: [], charts: {} })

  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get('/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then(res => setData(res.data))
  }, [])

  const categoryChartData = {
    labels: data.charts.category_distribution?.map(item => item.name) || [],
    datasets: [{
      data: data.charts.category_distribution?.map(item => item.count) || [],
      backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'],
      borderWidth: 1,
    }],
  }

  const departmentChartData = {
    labels: data.charts.department_distribution?.map(item => item.name) || [],
    datasets: [{
      data: data.charts.department_distribution?.map(item => item.count) || [],
      backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'],
      borderWidth: 1,
    }],
  }

  const monthlyGrowthChartData = {
    labels: data.charts.monthly_growth?.map(item => item.month) || [],
    datasets: [{
      label: 'Assets Added',
      data: data.charts.monthly_growth?.map(item => item.count) || [],
      borderColor: '#4e73df',
      backgroundColor: 'rgba(78, 115, 223, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  }

  const maintenanceChartData = {
    labels: data.charts.maintenance_stats?.map(item => item.status) || [],
    datasets: [{
      label: 'Maintenance Requests',
      data: data.charts.maintenance_stats?.map(item => item.count) || [],
      backgroundColor: ['#4e73df', '#1cc88a', '#f6c23e', '#e74a3b'],
    }],
  }

  const bookingChartData = {
    labels: data.charts.booking_stats?.map(item => item.status) || [],
    datasets: [{
      label: 'Bookings',
      data: data.charts.booking_stats?.map(item => item.count) || [],
      backgroundColor: ['#4e73df', '#1cc88a', '#f6c23e', '#e74a3b', '#858796'],
    }],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  }

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div 
      className={`card border-0 shadow-sm transition-all hover-shadow-lg ${darkMode ? 'bg-secondary text-white' : ''}`}
      style={{ cursor: 'default' }}
    >
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h6 className={`mb-2 ${darkMode ? 'text-light' : 'text-muted'}`}>{title}</h6>
            <h3 className={`mb-0 fw-bold ${color}`}>{value}</h3>
          </div>
          <div className={`rounded-circle d-flex align-items-center justify-content-center ${bgColor}`} style={{ width: '50px', height: '50px' }}>
            <Icon size={24} className={color.replace('text-', 'text-')} />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Welcome back, {user?.full_name || 'User'}</h3>
        <p className={`mb-0 ${darkMode ? 'text-light' : 'text-muted'}`}>Here's what's happening with your assets today.</p>
      </div>
      
      {/* Dashboard Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <StatCard 
            title="Total Assets" 
            value={data.counts.assets || 0} 
            icon={Package}
            color="text-primary"
            bgColor="bg-primary bg-opacity-10"
          />
        </div>
        <div className="col-md-3">
          <StatCard 
            title="Available Assets" 
            value={data.counts.available_assets || 0} 
            icon={CheckCircle}
            color="text-success"
            bgColor="bg-success bg-opacity-10"
          />
        </div>
        <div className="col-md-3">
          <StatCard 
            title="Allocated Assets" 
            value={data.counts.allocated_assets || 0} 
            icon={User}
            color="text-info"
            bgColor="bg-info bg-opacity-10"
          />
        </div>
        <div className="col-md-3">
          <StatCard 
            title="Under Maintenance" 
            value={data.counts.under_maintenance || 0} 
            icon={Wrench}
            color="text-warning"
            bgColor="bg-warning bg-opacity-10"
          />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <StatCard 
            title="Pending Transfers" 
            value={data.counts.pending_transfers || 0} 
            icon={ArrowRightLeft}
            color="text-danger"
            bgColor="bg-danger bg-opacity-10"
          />
        </div>
        <div className="col-md-3">
          <StatCard 
            title="Pending Maintenance" 
            value={data.counts.pending_maintenance || 0} 
            icon={Clock}
            color="text-danger"
            bgColor="bg-danger bg-opacity-10"
          />
        </div>
        <div className="col-md-3">
          <StatCard 
            title="Bookings Today" 
            value={data.counts.bookings_today || 0} 
            icon={Calendar}
            color="text-info"
            bgColor="bg-info bg-opacity-10"
          />
        </div>
        <div className="col-md-3">
          <StatCard 
            title="Departments" 
            value={data.counts.departments || 0} 
            icon={Building2}
            color="text-secondary"
            bgColor="bg-secondary bg-opacity-10"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className={`card border-0 shadow-sm ${darkMode ? 'bg-secondary text-white' : ''}`}>
            <div className="card-body">
              <h5 className="card-title mb-3 d-flex align-items-center gap-2">
                <Package size={20} />
                Asset Distribution by Category
              </h5>
              <div style={{ height: '250px' }}>
                <Pie data={categoryChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className={`card border-0 shadow-sm ${darkMode ? 'bg-secondary text-white' : ''}`}>
            <div className="card-body">
              <h5 className="card-title mb-3 d-flex align-items-center gap-2">
                <Building2 size={20} />
                Asset Distribution by Department
              </h5>
              <div style={{ height: '250px' }}>
                <Pie data={departmentChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className={`card border-0 shadow-sm ${darkMode ? 'bg-secondary text-white' : ''}`}>
            <div className="card-body">
              <h5 className="card-title mb-3 d-flex align-items-center gap-2">
                <TrendingUp size={20} />
                Monthly Asset Growth
              </h5>
              <div style={{ height: '250px' }}>
                <Line data={monthlyGrowthChartData} options={lineChartOptions} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className={`card border-0 shadow-sm ${darkMode ? 'bg-secondary text-white' : ''}`}>
            <div className="card-body">
              <h5 className="card-title mb-3 d-flex align-items-center gap-2">
                <Wrench size={20} />
                Maintenance Statistics
              </h5>
              <div style={{ height: '250px' }}>
                <Bar data={maintenanceChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className={`card border-0 shadow-sm ${darkMode ? 'bg-secondary text-white' : ''}`}>
            <div className="card-body">
              <h5 className="card-title mb-3 d-flex align-items-center gap-2">
                <Calendar size={20} />
                Booking Statistics
              </h5>
              <div style={{ height: '250px' }}>
                <Bar data={bookingChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className={`card border-0 shadow-sm ${darkMode ? 'bg-secondary text-white' : ''}`}>
            <div className="card-body">
              <h5 className="card-title mb-3 d-flex align-items-center gap-2">
                <Activity size={20} />
                Recent Activities
              </h5>
              <ul className="list-group list-group-flush">
                {data.recent_activity.map((item, index) => (
                  <li key={index} className={`list-group-item d-flex justify-content-between align-items-start ${darkMode ? 'bg-secondary text-white border-secondary' : ''}`}>
                    <div>
                      <strong className="d-block">{item.action}</strong>
                      <div className={`small ${darkMode ? 'text-light' : 'text-muted'}`}>{item.details}</div>
                    </div>
                    <small className={`badge ${darkMode ? 'bg-primary' : 'bg-light text-dark'}`}>
                      {new Date(item.created_at).toLocaleString()}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
