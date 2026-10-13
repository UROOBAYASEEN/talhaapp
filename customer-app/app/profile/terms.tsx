import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppColors } from "@/constants/theme";

const BG_COLOR = "#010a1f";
const TEXT_PRIMARY = "#E9E9EE";
const TEXT_SECONDARY = "#C4C5CD";
const ORANGE = "#E2671B";

export default function TermsOfUseScreen() {
  const router = useRouter();
  const aC = useAppColors();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: aC.bg }]}>
      <StatusBar
        barStyle={aC.isDark ? "light-content" : "dark-content"}
        backgroundColor={aC.bg}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: aC.divider }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: aC.isDark ? "rgba(6,17,60,0.85)" : "#F2F4F8" }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={aC.textPrimary} />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={[styles.logoWhite, !aC.isDark && { color: '#032a69' }]}>Auto</Text>
          <Text style={styles.logoOrange}>wizor</Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: aC.bg }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Acceptance of Terms */}
        <Section title="Acceptance of Terms">
          <Paragraph>
            By creating an account or using Autowizor, you agree to
            these Terms & Conditions and our Privacy Policy. If you do
            not agree, please discontinue use of the platform.
          </Paragraph>
        </Section>

        {/* Description */}
        <Section title="Description of Service">
          <Paragraph>
            Autowizor is an automotive marketplace and service platform
            that connects buyers, sellers, dealerships, banks, insurance
            providers, and tracker services.
          </Paragraph>

          <Paragraph>
            Through the platform, users can:
          </Paragraph>

          <Bullet text="Buy new and used vehicles" />
          <Bullet text="Sell vehicles by creating listings" />
          <Bullet text="Compare vehicles, banks, and financing options" />
          <Bullet text="Apply for auto financing" />
          <Bullet text="Purchase vehicle insurance" />
          <Bullet text="Book test drives" />
          <Bullet text="Connect with dealerships and individual sellers" />
          <Bullet text="Use vehicle tracking services" />
        </Section>

        {/* User Accounts */}
        <Section title="User Accounts">
          <Paragraph>
            Users must provide accurate and complete information while
            creating an account.
          </Paragraph>

          <Paragraph>
            You are responsible for:
          </Paragraph>

          <Bullet text="Maintaining the confidentiality of your account credentials" />
          <Bullet text="All activities performed under your account" />
          <Bullet text="Ensuring your personal details remain updated" />
        </Section>

        {/* Buying Vehicles */}
        <Section title="Buying Vehicles">
          <Paragraph>
            Autowizor provides a platform to connect buyers with
            dealerships and sellers.
          </Paragraph>

          <Paragraph>
            By purchasing a vehicle, you agree that:
          </Paragraph>

          <Bullet text="Vehicle details are provided by sellers/dealerships" />
          <Bullet text="Prices and availability may change without notice" />
          <Bullet text="Reservation amounts and payments may be non-refundable based on seller policies" />
          <Bullet text="Final agreements are between buyer and seller/dealership" />
        </Section>

        {/* Selling Vehicles */}
        <Section title="Selling Vehicles">
          <Paragraph>
            Users posting vehicle listings must:
          </Paragraph>

          <Bullet text="Provide accurate vehicle details" />
          <Bullet text="Upload original and clear images" />
          <Bullet text="Disclose any damage, modifications, or legal issues" />
          <Bullet text="Ensure they have the legal right to sell the vehicle" />
        </Section>

        <Paragraph>
          Autowizor reserves the right to remove misleading, fake,
          or incomplete listings.
        </Paragraph>

        {/* Financing */}
        <Section title="Financing Services">
          <Paragraph>
            Autowizor allows users to compare and apply for vehicle
            financing through partner banks.
          </Paragraph>

          <Paragraph>
            Please note:
          </Paragraph>

          <Bullet text="Financing approvals depend solely on partner banks" />
          <Bullet text="EMI calculations are estimates only" />
          <Bullet text="Markup rates may vary" />
          <Bullet text="Users must provide valid documents" />
        </Section>

        <Paragraph>
          Autowizor is not responsible for financing rejection.
        </Paragraph>

        {/* Insurance */}
        <Section title="Insurance Services">
          <Paragraph>
            Insurance plans are offered by third-party insurance
            providers.
          </Paragraph>

          <Paragraph>
            Autowizor does not guarantee:
          </Paragraph>

          <Bullet text="Claim approvals" />
          <Bullet text="Policy terms" />
          <Bullet text="Coverage decisions" />
        </Section>

        <Paragraph>
          All insurance matters are subject to the insurance
          provider's terms.
        </Paragraph>

        {/* Payments */}
        <Section title="Payment Terms">
          <Paragraph>
            Users may be required to make payments for:
          </Paragraph>

          <Bullet text="Ad posting" />
          <Bullet text="Vehicle reservation" />
          <Bullet text="Financing processing" />
          <Bullet text="Insurance purchases" />
          <Bullet text="Premium listing boosts" />

          <Paragraph>
            Payments can be made via:
          </Paragraph>

          <Bullet text="Credit/Debit Cards" />
          <Bullet text="JazzCash" />
          <Bullet text="Easypaisa" />
          <Bullet text="Bank Transfer" />
        </Section>

        <Paragraph>
          All payments are subject to verification.
        </Paragraph>

        {/* User Responsibilities */}
        <Section title="User Responsibilities">
          <Paragraph>
            By using Autowizor, you agree to:
          </Paragraph>

          <Bullet text="Provide accurate information" />
          <Bullet text="Use the platform lawfully" />
          <Bullet text="Respect buyers, sellers, and dealers" />
          <Bullet text="Avoid fraudulent activities" />
          <Bullet text="Maintain honest communication" />
        </Section>

        {/* Prohibited Activities */}
        <Section title="Prohibited Activities">
          <Paragraph>
            You may not:
          </Paragraph>

          <Bullet text="Post fake vehicle listings" />
          <Bullet text="Misrepresent ownership" />
          <Bullet text="Use false documents" />
          <Bullet text="Attempt to hack or disrupt the platform" />
          <Bullet text="Abuse other users" />
        </Section>

        {/* Dealer Responsibilities */}
        <Section title="Dealer Responsibilities">
          <Paragraph>
            Registered dealerships must:
          </Paragraph>

          <Bullet text="Maintain accurate inventory" />
          <Bullet text="Provide genuine pricing" />
          <Bullet text="Deliver vehicles as promised" />
          <Bullet text="Respond to customer inquiries professionally" />
        </Section>

        {/* Limitation */}
        <Section title="Limitation of Liability">
          <Paragraph>
            Autowizor acts only as a platform and is not responsible
            for:
          </Paragraph>

          <Bullet text="Vehicle defects" />
          <Bullet text="Fraud by sellers or buyers" />
          <Bullet text="Delays in financing or insurance approvals" />
          <Bullet text="Payment disputes" />
          <Bullet text="Delivery delays" />
        </Section>

        {/* Account Suspension */}
        <Section title="Account Suspension">
          <Paragraph>
            We may suspend or terminate accounts if:
          </Paragraph>

          <Bullet text="Terms are violated" />
          <Bullet text="Fraudulent activity is detected" />
          <Bullet text="Fake listings are reported" />
          <Bullet text="Users misuse the platform" />
        </Section>

        {/* Privacy */}
        <Section title="Privacy & Data">
          <Paragraph>
            Your use of Autowizor is also governed by our Privacy
            Policy. We take reasonable steps to protect your personal
            information.
          </Paragraph>
        </Section>

        {/* Changes */}
        <Section title="Changes to Terms">
          <Paragraph>
            Autowizor may update these Terms at any time. Continued use
            of the platform means you accept the revised terms.
          </Paragraph>
        </Section>

        {/* Contact */}
        <Section title="Contact Us">
          <Paragraph>
            For questions or support:
          </Paragraph>

          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.contact}>
              ✉ support@autowizor.com
            </Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.contact}>
              🌐 www.autowizor.com
            </Text>
          </TouchableOpacity>
        </Section>

        <View style={styles.bottomSpace} />
      </ScrollView>

    </SafeAreaView>
  );
}

/* ============================================================
   Reusable Components
============================================================ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const aC = useAppColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: aC.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  const aC = useAppColors();
  return (
    <Text style={[styles.paragraph, { color: aC.textSecondary }]}>{children}</Text>
  );
}

function Bullet({ text }: { text: string }) {
  const aC = useAppColors();
  return (
    <Text style={[styles.bullet, { color: aC.textSecondary }]}>{"➤ "}{text}</Text>
  );
}

/* ============================================================
   Styles
============================================================ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },

  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(49,95,173,0.4)",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(6,17,60,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  logoWhite: {
    color: "#F2F2F5",
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },

  logoOrange: {
    color: ORANGE,
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },

  headerSpacer: {
    width: 40,
  },

  /* Page */

  pageTitle: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    lineHeight: 30,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 16,
    marginBottom: 4,
  },

  updated: {
    color: ORANGE,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Poppins_400Regular",
    marginBottom: 14,
  },

  /* Sections */

  section: {
    marginBottom: 10,
  },

  sectionTitle: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 6,
  },

  paragraph: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Poppins_400Regular",
    marginBottom: 6,
  },

  bullet: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Poppins_400Regular",
    paddingLeft: 4,
    marginBottom: 2,
  },

  contact: {
    color: ORANGE,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Poppins_400Regular",
    textDecorationLine: "underline",
    marginBottom: 4,
  },

  bottomSpace: {
    height: 40,
  },
});