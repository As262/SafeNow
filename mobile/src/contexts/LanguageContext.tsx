import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, LanguageContextType } from '../types';
import { translations } from '../utils/translations';

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load language preference from AsyncStorage on app start
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('appLanguage');
        if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'hi')) {
          setLanguageState(storedLanguage as Language);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language): Promise<void> => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('appLanguage', lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
