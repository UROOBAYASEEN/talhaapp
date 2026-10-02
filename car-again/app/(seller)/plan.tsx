import React from 'react';
import PlanScreen from '@/components/shared/PlanScreen';

export default function SellerPlanScreen() {
  return (
    <PlanScreen
      role="seller"
      dealerColors
      promoTitle={'Boost Your\nSales with\nAutoWizor'}
      promoDesc={'Choose the best plan to\nlist more vehicles and\nreach thousands of\nserious buyers.'}
    />
  );
}
