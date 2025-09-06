import React, { useState, useEffect } from 'react';
import { aiOrchestrator } from '../services/aiOrchestrator';
import type { WeatherData } from '../types';
import { SunIcon, CloudIcon, RainIcon, SnowIcon, CloudyIcon } from './Icons';

const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            aiOrchestrator.getWeatherInfo(latitude, longitude)
                .then(data => {
                    setWeather(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to get weather data:", err);
                    setError("Could not fetch weather data.");
                    setIsLoading(false);
                });
        };

        const handleError = (err: GeolocationPositionError) => {
            console.warn(`Geolocation error: ${err.code} - ${err.message}`);
            setError("Location access denied.");
            setIsLoading(false);
        };

        navigator.geolocation.getCurrentPosition(fetchWeather, handleError, {
            enableHighAccuracy: false,
            timeout: 10000,
        });
    }, []);

    const getWeatherIcon = (condition: string) => {
        const lowerCaseCondition = condition.toLowerCase();
        const iconClass = "w-10 h-10 text-text-primary";
        if (lowerCaseCondition.includes('sunny') || lowerCaseCondition.includes('clear')) {
            return <SunIcon className={iconClass} />;
        }
        if (lowerCaseCondition.includes('cloud')) {
            if (lowerCaseCondition.includes('partly') || lowerCaseCondition.includes('broken')) {
                 return <CloudyIcon className={iconClass} />;
            }
            return <CloudIcon className={iconClass} />;
        }
        if (lowerCaseCondition.includes('rain') || lowerCaseCondition.includes('shower') || lowerCaseCondition.includes('drizzle')) {
            return <RainIcon className={iconClass} />;
        }
        if (lowerCaseCondition.includes('snow')) {
            return <SnowIcon className={iconClass} />;
        }
        // Default icon
        return <CloudIcon className={iconClass} />;
    };

    if (isLoading) {
        return <div className="text-sm text-text-muted animate-pulse">Fetching weather...</div>;
    }

    if (error) {
        return <div className="text-sm text-yellow-400">{error}</div>;
    }

    if (!weather) {
        return null;
    }

    return (
        <div className="h-full flex items-center gap-4 animate-fade-in-fast text-text-primary">
            <div className="flex-shrink-0">
                {getWeatherIcon(weather.condition)}
            </div>
            <div className="text-left">
                <p className="text-3xl font-light">
                    {Math.round(weather.temperature)}<span className="text-xl align-top">°C</span>
                </p>
                <p className="text-sm text-text-muted -mt-1">{weather.condition}</p>
            </div>
             <div className="h-10 w-px bg-primary-t-20 mx-2"></div>
            <div className="text-sm text-left">
                <p>H: {Math.round(weather.high)}° &nbsp; L: {Math.round(weather.low)}°</p>
                <p className="text-text-muted">Precip: {weather.precipitation}%</p>
            </div>
             <div className="h-10 w-px bg-primary-t-20 mx-2"></div>
             <div className="text-sm text-left font-sans">
                <p className="font-semibold">{weather.day}</p>
                <p className="text-text-muted">{weather.city}</p>
            </div>
        </div>
    );
};

export default WeatherWidget;
