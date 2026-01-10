import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  href?: string;
}

export function ChartCard({ title, description, className, children, href }: ChartCardProps) {
  const cardContent = (
    <Card className={cn(
      'transition-all',
      href && 'cursor-pointer hover:shadow-md',
      className
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {href && <ArrowRight className="h-5 w-5 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{cardContent}</Link>;
  }

  return cardContent;
}

// Pre-configured chart components

interface LineChartData {
  date: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineChartData[];
  lines: {
    key: string;
    name: string;
    color: string;
  }[];
  height?: number;
}

export function StatsLineChart({ data, lines, height = 300 }: LineChartProps) {
  // Format date for display
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface BarChartData {
  name: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  color?: string;
  height?: number;
}

export function StatsBarChart({ data, color = '#6366f1', height = 300 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PieChartDataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface PieChartProps {
  data: PieChartDataItem[];
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function StatsPieChart({ data, colors = DEFAULT_COLORS, height = 300 }: PieChartProps) {
  // Add index signature to data items
  const chartData: PieChartDataItem[] = data.map((item) => ({ ...item }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
