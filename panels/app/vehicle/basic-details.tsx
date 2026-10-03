import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SellVehicleScreen = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    brand: 'Honda',
    car: 'City',
    year: '2024',
    variant: '1.2 Aspire CVT',
    adDuration: '1 week',
    fuelType: 'Petrol',
    km: '5000',
    color: 'Grey',
  });

  const fields = [
    { label: 'Brand', value: form.brand },
    { label: 'Car', value: form.car },
    { label: 'Year', value: form.year },
    { label: 'Variant', value: form.variant },
    { label: 'Ad Duration', value: form.adDuration },
    { label: 'Fuel Type', value: form.fuelType },
    { label: 'KM', value: form.km },
    { label: 'Color', value: form.color },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020C25" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#B9BED0" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Sell My Vehicle</Text>

        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={25} color="#B9BED0" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Steps */}
        <View style={styles.stepsContainer}>
          {[1, 2, 3, 4, 5, 6, 7].map((step, index) => (
            <React.Fragment key={step}>
              <View style={[styles.stepCircle, step === 2 && styles.activeStep]}>
                <Text style={[styles.stepText, step === 2 && styles.activeStepText]}>
                  {step}
                </Text>
              </View>
              {index !== 6 && <View style={styles.stepLine} />}
            </React.Fragment>
          ))}
        </View>

        {/* Heading */}
        <View style={styles.headingContainer}>
          <Text style={styles.heading}>Basic Details</Text>
          <Text style={styles.subHeading}>Enter your vehicle details</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {fields.map((field) => (
            <View style={styles.fieldContainer} key={field.label}>
              <Text style={styles.label}>{field.label}</Text>
              <TouchableOpacity style={styles.dropdown}>
                <Text style={styles.dropdownText}>{field.value}</Text>
                <Ionicons name="chevron-down" size={21} color="#FF6B00" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SellVehicleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020C25',
  },

  header: {
    height: 65,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '600',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 25,
  },

  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 30,
  },

  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: '#08255E',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  activeStep: {
    backgroundColor: '#153A79',
    borderWidth: 1,
    borderColor: '#A7C7FF',
  },

  stepText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  activeStepText: {
    color: '#FFFFFF',
  },

  stepLine: {
    height: 2,
    backgroundColor: '#092458',
    flex: 1,
    marginHorizontal: -1,
  },

  headingContainer: {
    marginBottom: 24,
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },

  subHeading: {
    color: '#B7B9C7',
    fontSize: 14,
  },

  card: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#5183C9',
    backgroundColor: '#020D29',
    paddingHorizontal: 19,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#1D6BE5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },

  fieldContainer: {
    marginBottom: 13,
  },

  label: {
    color: '#AEB0C1',
    fontSize: 12,
    marginBottom: 8,
  },

  dropdown: {
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0A255A',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
  },

  continueButton: {
    height: 48,
    borderRadius: 25,
    marginTop: 48,
    backgroundColor: '#E96819',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E96819',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
