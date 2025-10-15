import { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { SalesTable, Sale } from "@/components/SalesTable";
import { AddSaleDialog } from "@/components/AddSaleDialog";
import { RevenueChart } from "@/components/RevenueChart";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";

// Sample data
const initialSales: Sale[] = [
  {
    id: '1',
    customerName: 'Acme Corp',
    date: '2025-10-10',
    revenue: 15000,
    commission: 1500,
    status: 'closed',
  },
  {
    id: '2',
    customerName: 'TechStart Inc',
    date: '2025-10-12',
    revenue: 8500,
    commission: 850,
    status: 'closed',
  },
  {
    id: '3',
    customerName: 'GlobalSoft',
    date: '2025-10-14',
    revenue: 12000,
    commission: 1200,
    status: 'pending',
  },
  {
    id: '4',
    customerName: 'DataFlow Ltd',
    date: '2025-10-13',
    revenue: 0,
    commission: 0,
    status: 'no-show',
  },
];

const chartData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 8500 },
  { name: 'Fri', revenue: 6000 },
  { name: 'Sat', revenue: 7500 },
  { name: 'Sun', revenue: 4500 },
];

const Index = () => {
  const [sales, setSales] = useState<Sale[]>(initialSales);

  const handleAddSale = (newSale: Omit<Sale, 'id'>) => {
    const sale: Sale = {
      ...newSale,
      id: Date.now().toString(),
    };
    setSales([sale, ...sales]);
  };

  // Calculate metrics
  const totalRevenue = sales
    .filter(s => s.status === 'closed')
    .reduce((sum, sale) => sum + sale.revenue, 0);
  
  const totalCommissions = sales
    .filter(s => s.status === 'closed')
    .reduce((sum, sale) => sum + sale.commission, 0);
  
  const closeRate = sales.length > 0 
    ? ((sales.filter(s => s.status === 'closed').length / sales.length) * 100).toFixed(1)
    : '0';
  
  const showUpRate = sales.length > 0
    ? ((sales.filter(s => s.status !== 'no-show').length / sales.length) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Tracker</h1>
            <p className="text-muted-foreground mt-1">
              Track your sales performance and commissions
            </p>
          </div>
          <AddSaleDialog onAddSale={handleAddSale} />
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="+12.5% from last month"
            trendUp
          />
          <MetricCard
            title="Total Commissions"
            value={`$${totalCommissions.toLocaleString()}`}
            icon={TrendingUp}
            trend="+8.2% from last month"
            trendUp
          />
          <MetricCard
            title="Close Rate"
            value={`${closeRate}%`}
            icon={Users}
            trend="+4.3% from last month"
            trendUp
          />
          <MetricCard
            title="Show Up Rate"
            value={`${showUpRate}%`}
            icon={Calendar}
            trend="-2.1% from last month"
            trendUp={false}
          />
        </div>

        {/* Chart */}
        <RevenueChart data={chartData} />

        {/* Sales Table */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Sales</h2>
          <SalesTable sales={sales} />
        </div>
      </div>
    </div>
  );
};

export default Index;
