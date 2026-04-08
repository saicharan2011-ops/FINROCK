import React from 'react';
import { useTheme } from '../context/ThemeContext';
import AuditDark from '../components/templates/audit/Dark';
import AuditLight from '../components/templates/audit/Light';

const Audit = () => {
    const { theme } = useTheme();
    return theme === 'dark' ? <AuditDark /> : <AuditLight />;
};

export default Audit;
