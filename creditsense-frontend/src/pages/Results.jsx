import React from 'react';
import { useTheme } from '../context/ThemeContext';
import ResultsDark from '../components/templates/results/Dark';
import ResultsLight from '../components/templates/results/Light';

const Results = () => {
    const { theme } = useTheme();
    return theme === 'dark' ? <ResultsDark /> : <ResultsLight />;
};

export default Results;
