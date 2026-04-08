import React from 'react';
import { useTheme } from '../context/ThemeContext';
import DashboardDark from '../components/templates/dashboard/Dark';
import DashboardLight from '../components/templates/dashboard/Light';

const Dashboard = () => {
    const { theme } = useTheme();
    return theme === 'dark' ? <DashboardDark /> : <DashboardLight />;
};

export default Dashboard;
