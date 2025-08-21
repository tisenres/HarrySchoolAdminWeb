import { useState, useEffect } from 'react';

interface IslamicCalendarData {
  hijriDate: string;
  isPrayerTime: boolean;
  nextPrayerTime: string;
  currentPrayer?: string;
}

export function useIslamicCalendar(): IslamicCalendarData {
  const [hijriDate, setHijriDate] = useState('');
  const [isPrayerTime, setIsPrayerTime] = useState(false);
  const [nextPrayerTime, setNextPrayerTime] = useState('');
  const [currentPrayer, setCurrentPrayer] = useState<string>();

  useEffect(() => {
    updateIslamicCalendar();
    
    // Update every minute to check prayer times
    const interval = setInterval(updateIslamicCalendar, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const updateIslamicCalendar = () => {
    // For development, using simplified logic
    // In production, integrate with Islamic calendar API like IslamicFinder or Aladhan API
    
    // Mock Hijri date calculation
    const gregorianDate = new Date();
    const mockHijriDate = convertToHijri(gregorianDate);
    setHijriDate(mockHijriDate);

    // Prayer times for Tashkent (approximate)
    const prayerTimes = getPrayerTimesForTashkent();
    const currentTime = new Date();
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    // Check if current time is within 10 minutes of any prayer time
    const prayerWindow = 10; // minutes
    let isPrayer = false;
    let nextPrayer = '';
    let activePrayer = '';

    for (const [prayerName, prayerMinutes] of Object.entries(prayerTimes)) {
      if (Math.abs(currentMinutes - prayerMinutes) <= prayerWindow) {
        isPrayer = true;
        activePrayer = prayerName;
        break;
      }
      
      if (prayerMinutes > currentMinutes) {
        nextPrayer = `${prayerName} at ${minutesToTime(prayerMinutes)}`;
        break;
      }
    }

    // If no prayer found for today, next is Fajr tomorrow
    if (!nextPrayer) {
      nextPrayer = `Fajr tomorrow at ${minutesToTime(prayerTimes.Fajr)}`;
    }

    setIsPrayerTime(isPrayer);
    setCurrentPrayer(activePrayer);
    setNextPrayerTime(nextPrayer);
  };

  const convertToHijri = (gregorianDate: Date): string => {
    // Simplified Hijri conversion - in production use proper Islamic calendar library
    // This is just for UI demonstration
    const hijriMonths = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
      'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];
    
    // Mock calculation - approximately 579 years difference
    const hijriYear = gregorianDate.getFullYear() - 579;
    const hijriMonth = hijriMonths[gregorianDate.getMonth()];
    const hijriDay = gregorianDate.getDate();
    
    return `${hijriDay} ${hijriMonth} ${hijriYear} AH`;
  };

  const getPrayerTimesForTashkent = () => {
    // Approximate prayer times for Tashkent in minutes from midnight
    // In production, calculate based on actual location and date
    return {
      Fajr: 5 * 60 + 30,      // 5:30 AM
      Dhuhr: 12 * 60 + 30,    // 12:30 PM
      Asr: 15 * 60 + 45,      // 3:45 PM
      Maghrib: 18 * 60 + 15,  // 6:15 PM
      Isha: 19 * 60 + 45,     // 7:45 PM
    };
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return {
    hijriDate,
    isPrayerTime,
    nextPrayerTime,
    currentPrayer,
  };
}