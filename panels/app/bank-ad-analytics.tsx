// Bank panel uses the same Advertisements Analytics screen (Figma) — same data endpoint
import React from 'react';
import AdvertisementAnalyticsScreen from './dealer-panel/advertisement-analytics';

export default function BankAdAnalyticsScreen() {
  return <AdvertisementAnalyticsScreen forceVariant="insurance" />;
}
