import React from 'react';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaExclamationTriangle, FaBrain, FaUsers, FaChartLine } from 'react-icons/fa';
import { useLanguage } from '../../hooks/useLanguage';

export const WeeklyIncomeWidget: React.FC = () => {
  const { t } = useLanguage();
  const weekData = [
    { date: t('mon'), plan: 120000, fact: 125000 },
    { date: t('tue'), plan: 115000, fact: 118000 },
    { date: t('wed'), plan: 125000, fact: 122000 },
    { date: t('thu'), plan: 130000, fact: 135000 },
    { date: t('fri'), plan: 140000, fact: 145000 },
  ];

  return (
    <div className="space-y-4">
      {weekData.map((day, index) => (
        <motion.div
          key={day.date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-50 rounded-lg p-3"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">{day.date}</div>
            <div className="text-sm text-gray-500">
              <span className="mr-2">{t('plan')}: {day.plan.toLocaleString()}</span>
              <span>{t('fact')}: {day.fact.toLocaleString()}</span>
            </div>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(day.fact / day.plan) * 100}%` }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const ClassDebtsWidget: React.FC = () => {
  const { t } = useLanguage();
  const debtsData = [
    { class: '11A', amount: 45000, students: 3 },
    { class: '10B', amount: 75000, students: 5 },
    { class: '9A', amount: 30000, students: 2 },
    { class: '11B', amount: 60000, students: 4 },
  ];

  return (
    <div className="space-y-3">
      {debtsData.map((item, index) => (
        <motion.div
          key={item.class}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-50 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{item.class}</div>
              <div className="text-sm text-gray-500">
                {item.students} {t('students')}
              </div>
            </div>
            <div className="text-red-500 font-medium">
              {item.amount.toLocaleString()}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const AIRevenueWidget: React.FC = () => {
  const { t } = useLanguage();
  const months = [t('sep'), t('oct'), t('nov'), t('dec')];
  const data = {
    actual: [850000, 920000, 980000],
    forecast: [, , , 1050000]
  };

  return (
    <div className="relative h-48">
      <div className="absolute inset-0 flex items-end">
        {months.map((month, index) => (
          <motion.div
            key={month}
            className="flex-1 flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="w-full px-1">
              {data.actual[index] && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.actual[index] / 1100000) * 100}%` }}
                  className="bg-purple-500 rounded-t-lg"
                  style={{ maxHeight: '150px' }}
                />
              )}
              {data.forecast[index] && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.forecast[index] / 1100000) * 100}%` }}
                  className="bg-purple-200 rounded-t-lg border-2 border-dashed border-purple-500"
                  style={{ maxHeight: '150px' }}
                />
              )}
            </div>
            <div className="text-sm font-medium mt-2">{month}</div>
            <div className="text-xs text-gray-500">
              {data.actual[index]?.toLocaleString() || data.forecast[index]?.toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const SalaryFundWidget: React.FC = () => {
  const { t } = useLanguage();
  const departments = [
    { name: t('teachers'), budget: 2500000, used: 2100000 },
    { name: t('administration'), budget: 800000, used: 750000 },
    { name: t('techStaff'), budget: 600000, used: 580000 },
    { name: t('psychologists'), budget: 400000, used: 350000 },
  ];

  return (
    <div className="space-y-4">
      {departments.map((dept, index) => (
        <motion.div
          key={dept.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-50 rounded-lg p-3"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">{dept.name}</div>
            <div className="text-sm text-gray-500">
              {((dept.used / dept.budget) * 100).toFixed(1)}% {t('used')}
            </div>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(dept.used / dept.budget) * 100}%` }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const ExpenseDeviationsWidget: React.FC = () => {
  const { t } = useLanguage();
  const expenses = [
    { category: t('utilities'), plan: 300000, fact: 320000 },
    { category: t('materials'), plan: 250000, fact: 240000 },
    { category: t('equipment'), plan: 500000, fact: 520000 },
    { category: t('food'), plan: 400000, fact: 380000 },
  ];

  return (
    <div className="space-y-4">
      {expenses.map((expense, index) => {
        const deviation = ((expense.fact - expense.plan) / expense.plan) * 100;
        const isPositive = deviation > 0;

        return (
          <motion.div
            key={expense.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 rounded-lg p-3"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{expense.category}</div>
              <div className={`text-sm font-medium ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
                {isPositive ? '+' : ''}{deviation.toFixed(1)}%
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="mr-4">{t('plan')}: {expense.plan.toLocaleString()}</span>
              <span>{t('fact')}: {expense.fact.toLocaleString()}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}; 