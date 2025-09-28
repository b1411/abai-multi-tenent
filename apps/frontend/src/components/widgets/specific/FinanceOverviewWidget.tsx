import React from 'react';
import { Widget } from '../../../types/widget';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, PieChart } from 'lucide-react';
import { formatNumberShort } from '../base/numberFormat';

interface FinanceOverviewData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  unpaidFees: number;
  monthlyGrowth: number;
}

interface FinanceOverviewWidgetProps {
  data: FinanceOverviewData | null;
  widget: Widget;
}

const FinanceOverviewWidget: React.FC<FinanceOverviewWidgetProps> = ({ data, widget }) => {
  // Use data from props - WidgetRenderer handles loading
  const widgetData = data;

  const totalRevenue = widgetData?.totalRevenue ?? 0;
  const totalExpenses = widgetData?.totalExpenses ?? 0;
  const netProfit = widgetData?.netProfit ?? 0;
  const unpaidFees = widgetData?.unpaidFees ?? 0;
  const monthlyGrowth = widgetData?.monthlyGrowth ?? 0;

  if (!totalRevenue && totalRevenue !== 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Нет финансовых данных</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

  const formatMoneySmart = (amount: number) => {
    if (widget.size.height === 'small' || Math.abs(amount) >= 1000) {
      return formatNumberShort(amount, { currency: true });
    }
    return formatCurrency(amount);
  };

  const metrics: { label: string; value: number; icon: JSX.Element; color: string; border: string; textColor: string }[] = [
    {
      label: 'Доходы',
  value: totalRevenue,
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      color: 'from-green-50 to-emerald-50',
      border: 'border-green-200/60',
      textColor: 'text-green-700'
    },
    {
      label: 'Расходы',
  value: totalExpenses,
      icon: <TrendingDown className="h-5 w-5 text-red-600" />,
      color: 'from-red-50 to-rose-50',
      border: 'border-red-200/60',
      textColor: 'text-red-700'
    },
    {
      label: 'Прибыль',
  value: netProfit,
      icon: <PieChart className="h-5 w-5 text-blue-600" />,
      color: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200/60',
      textColor: 'text-blue-700'
    },
    {
      label: 'Задолженности',
  value: unpaidFees,
      icon: <CreditCard className="h-5 w-5 text-orange-600" />,
      color: 'from-orange-50 to-amber-50',
      border: 'border-orange-200/60',
      textColor: 'text-orange-700'
    }
  ];

  return (
  <div className="h-full relative overflow-hidden">
      {/* Beautiful gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-blue-50/20 to-purple-50/30 rounded-lg"></div>
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Growth indicator */}
    <div className="flex items-center justify-between mb-4 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-blue-400"></div>
      <span className="text-sm font-semibold text-gray-700 truncate max-w-[140px]" title="Финансовый обзор">Финансовый обзор</span>
          </div>
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${monthlyGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {monthlyGrowth >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
      <span className="whitespace-nowrap">{monthlyGrowth}%</span>
          </div>
        </div>

        {/* Financial metrics grid */}
        <div className={`grid ${widget.size.height === 'small' ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-2'} flex-1 min-w-0`}>
          {metrics.slice(0, 4).map((metric, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden min-w-0"
            >
              <div className="flex items-center justify-between mb-2 min-w-0">
                <div className="p-1.5 rounded-md bg-gray-50 flex-shrink-0">
                  {metric.icon}
                </div>
                <div className="text-right flex-1 min-w-0 ml-2">
                  <div className="text-sm font-bold text-gray-900 truncate" title={formatCurrency(metric.value)}>{formatMoneySmart(metric.value)}</div>
                </div>
              </div>
              <div className="text-xs font-medium text-gray-600 truncate" title={metric.label}>{metric.label}</div>
              
              {/* Simple progress indicator */}
              <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === 0 ? 'bg-green-500' :
                    index === 1 ? 'bg-red-500' :
                    index === 2 ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (metric.value / (totalRevenue || 1)) * 100)}%` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Additional summary for larger widgets */}
        {widget.size.height === 'large' && (
          <div className="mt-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200 overflow-hidden">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-700 truncate" title="Рентабельность">Рентабельность</div>
                <div className="text-xs text-gray-600 truncate" title="Прибыль к доходам">Прибыль к доходам</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-indigo-700 whitespace-nowrap">{totalRevenue ? Math.round((netProfit / totalRevenue) * 100) : 0}%</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FinanceOverviewWidget;
