import React from 'react';
import { useTheme } from '../context/ThemeContext';
import LandingDark from '../components/templates/landing/Dark';
import LandingLight from '../components/templates/landing/Light';

const LandingPage = () => {
    const { theme } = useTheme();
    return theme === 'dark' ? <LandingDark /> : <LandingLight />;
};

export default LandingPage;
