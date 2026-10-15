// Dropdown data for Add Vehicle (Dealer / Seller / Become_a_Seller).
// Car lists are the same as the customer Sell flow (app/vehicle/create.tsx).
// Brands come from the backend `/brands` API first — these maps are the fallback + model lists.

export const VEHICLE_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad',
  'Sialkot', 'Gujranwala', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Gujrat', 'Jhang', 'Sahiwal', 'Sukkur',
  'Larkana', 'Mardan', 'Sheikhupura', 'Kasur', 'Okara', 'Dera Ghazi Khan', 'Jhelum', 'Wah Cantt',
  'Muzaffarabad', 'Gilgit', 'Gwadar',
];

export const CAR_MODELS: Record<string, string[]> = {
  'Suzuki':        ['Alto', 'Cultus', 'Swift', 'Wagon R', 'Jimny', 'Vitara', 'Bolan', 'Ravi', 'APV', 'Every', 'Ertiga', 'Baleno', 'Ciaz'],
  'Honda':         ['Civic', 'City', 'HR-V', 'BR-V', 'Accord', 'CR-V', 'Fit', 'Jazz', 'Freed', 'Vezel'],
  'Toyota':        ['Corolla', 'Camry', 'Prius', 'Fortuner', 'Hilux', 'Land Cruiser', 'Yaris', 'Vitz', 'Rush', 'Prado', 'Aqua', 'Raize', 'C-HR'],
  'Kia':           ['Sportage', 'Picanto', 'Sorento', 'Stonic', 'Carnival', 'Cerato'],
  'Hyundai':       ['Tucson', 'Elantra', 'Sonata', 'Santa Fe', 'Grand i10', 'Ioniq'],
  'Changan':       ['Alsvin', 'Oshan X7', 'CS35 Pro', 'CS55 Pro', 'Uni-T', 'Uni-V'],
  'MG':            ['HS', 'ZS', 'MG5', 'MG6', 'Extender'],
  'Proton':        ['Saga', 'X70', 'X50', 'Aman'],
  'DFSK':          ['Glory 580', 'Glory 500', 'Glory 580 Pro'],
  'Prince':        ['Pearl', 'Rana'],
  'FAW':           ['V2', 'Carrier'],
  'BMW':           ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X6', 'M3', 'M5'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'A-Class'],
  'Audi':          ['A3', 'A4', 'A5', 'A6', 'A8', 'Q3', 'Q5', 'Q7'],
  'Volkswagen':    ['Polo', 'Golf', 'Passat', 'Tiguan'],
  'Daihatsu':      ['Cuore', 'Mira', 'Move', 'Boon'],
  'Mitsubishi':    ['Lancer', 'Pajero', 'Outlander', 'ASX', 'Eclipse Cross'],
  'Nissan':        ['Sunny', 'Dayz', 'Juke', 'X-Trail', 'Patrol'],
  'Isuzu':         ['D-Max', 'MU-X'],
  'Peugeot':       ['207', '301', '408', '2008'],
  'Renault':       ['Duster', 'Clio'],
  'Haval':         ['H6', 'Jolion'],
  'Sazgar':        ['BAIC D20', 'BAIC BJ40'],
  'Master':        ['Chery Tiggo 4', 'Chery Tiggo 8'],
  'Regal':         ['Frontier'],
};

export const BIKE_MODELS: Record<string, string[]> = {
  'Honda':       ['CD 70', 'CD 70 Dream', 'Pridor', 'CG 125', 'CB 125F', 'CB 150F'],
  'Suzuki':      ['GD 110S', 'GS 150', 'GR 150', 'GSX 125'],
  'Yamaha':      ['YB 125Z', 'YB 125Z-DX', 'YBR 125', 'YBR 125G'],
  'United':      ['US 70', 'US 100', 'US 125'],
  'Road Prince': ['RP 70', 'RP 110', 'RP 125'],
  'Super Power': ['SP 70', 'SP 100', 'SP 125'],
  'Unique':      ['UD 70', 'UD 100', 'UD 125'],
  'Hi Speed':    ['SR 70', 'Infinity 150'],
  'Crown':       ['CR 70', 'CR 125'],
};

export const CAR_VARIANTS = [
  '1.0 MT', '1.0 CVT', '1.2 MT', '1.2 CVT', '1.3 MT', '1.3 CVT', '1.5 MT', '1.5 CVT', '1.8 MT', '2.0 MT',
  'Standard', 'GL', 'GLi', 'XLi', 'Grande', 'Alpha', 'Sport', 'AWD',
];
export const BIKE_VARIANTS = ['Standard', 'Self Start', 'Kick Start', 'Special Edition'];

// Backend enums: transmission = automatic | manual, fuel_type = petrol | diesel | electric | hybrid | cng
export const TRANSMISSIONS = ['Automatic', 'Manual'];
export const FUEL_TYPES    = ['Petrol', 'Diesel', 'CNG', 'Hybrid', 'Electric'];

export const CAR_BODY_TYPES  = ['Sedan', 'Hatchback', 'SUV', 'Crossover', 'MPV', 'Pickup', 'Coupe', 'Convertible', 'Van', 'Mini Van'];
export const BIKE_BODY_TYPES = ['Standard', 'Sports', 'Cruiser', 'Scooter', 'Commuter'];

// 2026 → 1970 (latest first)
export const VEHICLE_YEARS = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => String(2026 - i));

// Shown at the end of brand / vehicle / variant lists — picking it lets the user type their own value
export const OTHER = 'Other';
