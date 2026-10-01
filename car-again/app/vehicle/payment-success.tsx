import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useAppColors } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PRIMARY_BTN_COLORS, RingGlow, SavedCardEffect } from "@/components/shared/FigmaEffects";

const BG = "#010a1f";
const WHITE = "#f9fafc";
const SUBTITLE = "#baacb6";
const ORANGE = "#e2671b";
const NAVY_CARD = "#0a2150";
const CARD_BORDER = "rgba(100,160,255,0.5)";

function fmtDT(ts: number) {
  const d = new Date(ts);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${date}, ${h}:${m} ${ap}`;
}

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const aC = useAppColors();
  const insets = useSafeAreaInsets();
  const {
    photo = "",
    title = "Your Vehicle",
    price = "0",
    city = "",
    year = "",
    trans = "",
    dealerPhone = "",
    kind = "",
    company = "",
    providerName = "",
    deviceName = "",
    date = "",
    vid = "",
    time = "",
    center = "",
    home = "/(dealer)",
    demo = "",
  } = useLocalSearchParams<{
    photo: string; title: string; price: string;
    city?: string; year?: string; trans?: string; dealerPhone?: string;
    kind?: string; company?: string;
    providerName?: string; deviceName?: string; date?: string;
    vid?: string; home?: string; demo?: string; time?: string; center?: string;
  }>();

  const isInsurance = kind === "insurance";
  const isDealerExtra = kind === "dealer_extra";
  const isTracker = kind === "tracker";
  const isPromote = kind === "promote";

  if (isPromote) {
    const homeRoute = (home || "/(dealer)") as any;
    const vehiclePrice = Number(String(price).replace(/,/g, "")) || 0;
    const promotedPrice = vehiclePrice >= 10_000_000
      ? `${Number((vehiclePrice / 10_000_000).toFixed(2))} Crore`
      : vehiclePrice >= 100_000
        ? `${Number((vehiclePrice / 100_000).toFixed(2))} Lac`
        : vehiclePrice.toLocaleString();
    const vehicleMeta = [city, year, trans].filter(Boolean).join(" · ");
    async function downloadPromotionInvoice() {
      try {
        const safeTitle = String(title).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
        const html = `<html><body style="font-family:Arial,sans-serif;padding:32px;color:#010a1f"><h1>${demo === '1' ? 'Autowizor Demo Promotion Summary' : 'Autowizor Promotion Invoice'}</h1><p>${demo === '1' ? 'Demo only — no payment was charged' : 'Payment successful'}</p><hr/><p><strong>Vehicle:</strong> ${safeTitle}</p><p><strong>Promotion:</strong> Featured Ad</p><p><strong>Ad Posting Fee:</strong> Rs 1,650</p><p><strong>Featured Fee:</strong> Rs 5,000</p><h3>${demo === '1' ? 'Demo Total' : 'Total Paid'}: Rs 6,650</h3><p>Date: ${new Date().toLocaleDateString('en-PK')}</p></body></html>`;
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Promotion Invoice' });
        } else {
          Alert.alert('Invoice ready', `Saved at ${uri}`);
        }
      } catch {
        Alert.alert('Error', 'Could not generate the invoice. Please try again.');
      }
    }
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: BG, paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />

        {/* Header */}
        <View style={styles.extraHeader}>
          <TouchableOpacity
            style={styles.extraBackBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.extraHeaderTitle}>Processing Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.promoteScroll}>
          <View style={styles.promoteBody}>
            <Text style={styles.promoteEmoji}>🎉</Text>
            <Text style={styles.promoteTitle}>Ad Promoted{"\n"}Successfully!</Text>
            <Text style={styles.promoteSub}>Your ad is now added to the featured listing</Text>
          </View>

          <LinearGradient colors={["#E2671B", "#032A69"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.promoteCardBorder}>
            <View style={styles.promoteCard}>
              <LinearGradient colors={["rgba(22,64,136,0.28)", "transparent", "rgba(226,103,27,0.24)"]} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <View style={styles.promoteImageBox}>
                {photo ? <Image source={{ uri: String(photo) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : <Ionicons name="car-outline" size={35} color={SUBTITLE} />}
              </View>
              <View style={styles.promoteInfo}>
                <Text style={styles.promoteCarName} numberOfLines={2}>{title}</Text>
                <Text style={styles.promoteCarPrice}>PKR {promotedPrice}</Text>
                {!!vehicleMeta && <View style={styles.promoteMetaRow}>
                  <Ionicons name="location-outline" size={13} color={SUBTITLE} />
                  <Text style={styles.promoteMeta} numberOfLines={1}>{vehicleMeta}</Text>
                </View>}
                <View style={styles.promoteStatusRow}>
                  <View style={styles.promoteBadge}><Text style={styles.promoteBadgeText}>·  Active</Text></View>
                  <Text style={styles.promotePosted}>Posted today</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={ORANGE} style={styles.promoteChevron} />
            </View>
          </LinearGradient>

        {/* Bottom buttons */}
        <View style={[styles.extraFooter, styles.promoteFooter]}>
          <TouchableOpacity style={[styles.extraPrimaryBtn, styles.promotePrimaryBtn]} activeOpacity={0.85} onPress={downloadPromotionInvoice}>
            <LinearGradient colors={["#032A69", "#E2671B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
            <Text style={styles.promotePrimaryText}>Download Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.extraSecondaryBtn, styles.promoteSecondaryBtn]}
            activeOpacity={0.85}
            onPress={() => router.replace(homeRoute)}
          >
            <LinearGradient colors={['#16408880', '#0D255480', '#00000001', '#00000001', '#0D255480', '#16408880']} locations={[0, 0.08, 0.22, 0.78, 0.92, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['#16408880', '#0D255480', '#00000001', '#00000001', '#0D255480', '#16408880']} locations={[0, 0.04, 0.12, 0.88, 0.96, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(22,64,136,0.28)', 'rgba(0,0,0,0.36)', 'rgba(0,0,0,0.36)', 'rgba(22,64,136,0.28)']} locations={[0, 0.15, 0.85, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={['rgba(22,64,136,0.24)', 'rgba(0,0,0,0.32)', 'rgba(0,0,0,0.32)', 'rgba(22,64,136,0.24)']} locations={[0, 0.1, 0.9, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <Text style={styles.promoteSecondaryText}>Back to home</Text>
          </TouchableOpacity>
          {!!vid && <TouchableOpacity style={styles.promoteViewAd} onPress={() => router.replace({ pathname: '/buy/car-detail', params: { id: String(vid) } } as any)}><Text style={styles.promoteViewAdText}>View Ad</Text></TouchableOpacity>}
        </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isTracker) {
    const paidAmt = Number(String(price).replace?.(/,/g, "") || price || 0).toLocaleString();
    const bookingId = `#AW-TRK-${String(Date.now()).slice(-5)}`;
    const rows: [string, string][] = [
      ["Tracker Provider",    String(providerName || company || title || "—")],
      ["Installation Date",   String(date || "—")],
      ["Installation Time",   String(time || "—")],
      ["Installation Center", String(center || city || "—")],
    ];
    async function downloadTrackerInvoice() {
      try {
        const esc = (v: string) => String(v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
        const html = `<html><body style="font-family:Arial,sans-serif;padding:32px;color:#010a1f"><h1>Autowizor Tracker Invoice</h1><p>Booking ID: ${esc(bookingId)}</p><hr/><p><strong>Provider:</strong> ${esc(String(providerName || company || title || '—'))}</p><p><strong>Device:</strong> ${esc(String(deviceName || title || '—'))}</p><p><strong>Installation Date:</strong> ${esc(String(date || '—'))}</p><p><strong>Installation Time:</strong> ${esc(String(time || '—'))}</p><p><strong>Installation Center:</strong> ${esc(String(center || city || '—'))}</p><h3>Total Paid: PKR ${esc(paidAmt)}</h3><p>Date: ${new Date().toLocaleDateString('en-PK')}</p></body></html>`;
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Tracker Invoice' });
        } else {
          Alert.alert('Invoice ready', `Saved at ${uri}`);
        }
      } catch {
        Alert.alert('Error', 'Could not generate the invoice. Please try again.');
      }
    }
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: BG, paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />

        {/* Header */}
        <View style={styles.extraHeader}>
          <TouchableOpacity style={styles.extraBackBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={26} color="#C9C6D0" />
          </TouchableOpacity>
          <Text style={[styles.extraHeaderTitle, styles.iHeaderTitle]}>Processing Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 }}>
          <View style={styles.headingBox}>
            <Text style={[styles.celebrationIcon, styles.iCelebration, { textAlign: "center" }]}>🎉</Text>
            <Text style={[styles.heading, styles.iHeading, { color: WHITE }]}>Tracker Purchased{"\n"}Successfully!</Text>
            <Text style={[styles.subHeading, styles.iSubHeading, { color: "#BAB6C4" }]}>Your installation is booked. Our technician will{"\n"}contact you shortly.</Text>
          </View>

          {/* Booking details — saved vehicle-card effect */}
          <View style={[styles.policyCard, styles.iPolicyCard, { backgroundColor: "#010A1F", borderColor: "#82a5d5", shadowColor: "#638ed0", shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 }]}>
            <SavedCardEffect />
            <View style={styles.policyRow}>
              <Text style={[styles.policyLabel, styles.iPolicyTxt, { color: WHITE }]}>Installation Booking ID</Text>
              <Text style={[styles.policyVal, { color: ORANGE, fontSize: 15, fontFamily: "Poppins_600SemiBold" }]} numberOfLines={1}>{bookingId}</Text>
            </View>
            {rows.map(([label, val], i) => (
              <View key={label} style={[styles.policyRow, i === rows.length - 1 && { marginBottom: 0 }]}>
                <Text style={[styles.policyLabel, styles.iPolicyTxt, { color: "#C9C6D0" }]}>{label}</Text>
                <Text style={[styles.policyVal, styles.iPolicyTxt, { color: "#F2F1F5" }]} numberOfLines={1}>{val}</Text>
              </View>
            ))}
          </View>

          <View style={{ flex: 1, minHeight: 50 }} />

          {/* Download Invoice */}
          <TouchableOpacity style={[styles.invoiceBtn, styles.rBigBtn]} onPress={downloadTrackerInvoice} activeOpacity={0.88}>
            <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gradBtn, { height: 48 }]}>
              <Text style={[styles.invoiceTxt, styles.rBigBtnTxt]}>Download Invoice</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to home */}
          <TouchableOpacity
            style={[styles.homeBtn, styles.rHomeBtn, { backgroundColor: "#07142F", borderColor: "#7E9FD6", marginBottom: 10 }]}
            onPress={() => router.replace("/(tabs)" as any)}
            activeOpacity={0.88}
          >
            <RingGlow radius={24} peak={0.5} rings={12} />
            <Text style={[styles.homeBtnTxt, styles.rBigBtnTxt, { color: "#EDEBF0" }]}>Back to home</Text>
          </TouchableOpacity>

          {/* View My Bookings — kept as a link */}
          <TouchableOpacity style={styles.promoteViewAd} onPress={() => router.push("/profile/my-activity" as any)}>
            <Text style={styles.promoteViewAdText}>View My Bookings</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isDealerExtra) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: BG }]}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />

        {/* Header */}
        <View style={styles.extraHeader}>
          <TouchableOpacity
            style={styles.extraBackBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={26} color="#C9C6D0" />
          </TouchableOpacity>
          <Text style={[styles.extraHeaderTitle, { fontSize: 20, fontFamily: "Poppins_500Medium" }]}>Processing Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Center content */}
        <View style={styles.extraBody}>
          <Image source={require("@/assets/images/successful.png")} style={{ width: 88, height: 88, marginBottom: 16 }} resizeMode="contain" />
          <Text style={styles.extraTitle}>
            Ad Payment Done{"\n"}Successfully!
          </Text>
          <Text style={styles.extraSub}>
            Your Extra ad publish successfully.
          </Text>
        </View>

        {/* Bottom buttons */}
        <View style={styles.extraFooter}>
          <TouchableOpacity
            style={styles.extraPrimaryBtn}
            activeOpacity={0.85}
            onPress={() => router.replace("/(dealer)" as any)}
          >
            <LinearGradient
              colors={PRIMARY_BTN_COLORS as any}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.extraPrimaryTxt}>Back to home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.extraSecondaryBtn, { backgroundColor: "#07142F", borderColor: "#7E9FD6", borderWidth: 1 }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(dealer)/plan" as any)}
          >
            <RingGlow radius={24} peak={0.5} rings={12} />
            <Text style={styles.extraSecondaryTxt}>Upgrade Plan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Insurance policy details ──
  const policyNo = useMemo(() => {
    const prefix = (String(company || title || "INS").replace(/[^A-Za-z]/g, "").slice(0, 3) || "INS").toUpperCase();
    const yy = String(new Date().getFullYear()).slice(-2);
    const rand = String(Date.now()).slice(-7);
    return `${prefix}-${yy}-${rand}`;
  }, []);
  const coverageStart = useMemo(() => {
    const d = new Date();
    return `${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })} ${String(d.getFullYear()).slice(-2)}`;
  }, []);
  const coverageEnd = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return `${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })} ${String(d.getFullYear()).slice(-2)}`;
  }, []);

  const [downloading, setDownloading] = useState(false);
  const formattedPrice = Number(price.replace?.(/,/g, "") || price || 0).toLocaleString();
  const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;
  const invoiceDate = new Date().toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });

  // ── 12-hour reservation countdown ──
  const reservedAt = useMemo(() => Date.now(), []);
  const expiresAt = reservedAt + 12 * 3600 * 1000;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remain = Math.max(0, expiresAt - now);
  const rh = Math.floor(remain / 3600000);
  const rm = Math.floor((remain % 3600000) / 60000);
  const rs = Math.floor((remain % 60000) / 1000);

  const metaLine = [city || null, year || null, trans || null].filter(Boolean).join(" • ");

  function handleCallDealer() {
    const ph = String(dealerPhone || "").replace(/\D/g, "");
    if (!ph) {
      Alert.alert("Not Available", "Dealer phone number is not listed.");
      return;
    }
    Linking.openURL(`tel:${ph}`);
  }

  async function handleDownloadInvoice() {
    setDownloading(true);
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8"/>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: #fff; color: #111; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #e2671b; padding-bottom: 20px; margin-bottom: 30px; }
            .brand { font-size: 28px; font-weight: 900; }
            .brand span { color: #e2671b; }
            .invoice-label { font-size: 13px; color: #666; text-align: right; }
            .invoice-no { font-size: 18px; font-weight: 700; color: #032a69; }
            .section-title { font-size: 13px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; margin-top: 24px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .info-item label { font-size: 11px; color: #888; display: block; margin-bottom: 3px; }
            .info-item span { font-size: 13px; font-weight: 600; }
            .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            .table th { background: #032a69; color: #fff; padding: 10px 14px; font-size: 12px; text-align: left; }
            .table td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #eee; }
            .table tr:last-child td { border-bottom: none; }
            .total-row { background: #fef3ee; }
            .total-row td { font-weight: 700; font-size: 15px; color: #e2671b; }
            .status-badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">Auto<span>wizor</span></div>
            <div>
              <div class="invoice-label">PAYMENT INVOICE</div>
              <div class="invoice-no">${invoiceNo}</div>
              <div class="invoice-label">${invoiceDate}</div>
            </div>
          </div>

          <div class="section-title">Vehicle Details</div>
          <div class="info-grid">
            <div class="info-item"><label>Vehicle</label><span>${title}</span></div>
            <div class="info-item"><label>Status</label><span class="status-badge">✓ Paid</span></div>
          </div>

          <div class="section-title">Payment Summary</div>
          <table class="table">
            <thead>
              <tr><th>Description</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>Reservation Deposit — ${title}</td><td>PKR ${formattedPrice}</td></tr>
              <tr class="total-row"><td>Total Paid</td><td>PKR ${formattedPrice}</td></tr>
            </tbody>
          </table>

          <div class="section-title">Transaction Info</div>
          <div class="info-grid">
            <div class="info-item"><label>Invoice No</label><span>${invoiceNo}</span></div>
            <div class="info-item"><label>Date</label><span>${invoiceDate}</span></div>
            <div class="info-item"><label>Payment Method</label><span>SafePay</span></div>
            <div class="info-item"><label>Transaction Status</label><span>Successful</span></div>
          </div>

          <div class="footer">
            <p>Thank you for choosing Autowizor — Pakistan's First Integrated Auto Ecosystem</p>
            <p style="margin-top:4px;">This is a system generated invoice. No signature required.</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice ${invoiceNo}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Downloaded!', `Invoice saved as ${invoiceNo}.pdf`);
      }
    } catch (e) {
      Alert.alert("Error", "Could not generate invoice.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg, paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      {/* Header */}
      {isInsurance ? (
        <View style={styles.insHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={aC.isDark ? "#C9C6D0" : "#010a1f"} />
          </TouchableOpacity>
          <Text style={[styles.insHeaderTitle, styles.iHeaderTitle, { color: aC.isDark ? "#F2F1F5" : "#010a1f" }]}>Processing Payment</Text>
          <View style={{ width: 40 }} />
        </View>
      ) : (
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={aC.isDark ? "#C9C6D0" : "#010a1f"} />
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Celebration */}
        <View style={styles.iconContainer}>
          <Text style={[styles.celebrationIcon, !isInsurance && styles.rCelebration, isInsurance && styles.iCelebration]}>🎉</Text>
        </View>

        {/* Heading */}
        <View style={styles.headingBox}>
          <Text style={[styles.heading, !isInsurance && styles.rHeading, isInsurance && styles.iHeading, { color: aC.isDark ? WHITE : "#010a1f" }]}>
            {isInsurance ? "Insurance Purchased\nSuccessfully!" : "Reservation Submitted\nSuccessfully!"}
          </Text>
          <Text style={[styles.subHeading, !isInsurance && styles.rSubHeading, isInsurance && styles.iSubHeading, { color: aC.isDark ? "#BAB6C4" : "#475569" }]}>
            {isInsurance
              ? "Your insurance policy has been activated\nsuccessfully."
              : "Your reservation request has been\nsuccessfully submitted."}
          </Text>
        </View>

        {isInsurance && (
          <View style={[styles.policyCard, styles.iPolicyCard, aC.isDark ? { backgroundColor: "#010A1F", borderColor: "#82a5d5", shadowColor: "#638ed0", shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 2 } : { backgroundColor: "#ffffff", borderColor: "rgba(3,42,105,0.14)" }]}>
            {aC.isDark ? <SavedCardEffect /> : (
              <>
                <LinearGradient colors={["rgba(22,64,136,0.25)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
                <LinearGradient colors={["transparent", "rgba(29,83,175,0.22)"]} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              </>
            )}
            <View style={styles.policyRow}>
              <Text style={[styles.policyLabel, styles.iPolicyTxt, { color: aC.isDark ? "#C9C6D0" : "#475569" }]}>Policy Number</Text>
              <Text style={[styles.policyVal, styles.iPolicyTxt, { color: aC.isDark ? "#F2F1F5" : "#010a1f" }]}>{policyNo}</Text>
            </View>
            <View style={styles.policyRow}>
              <Text style={[styles.policyLabel, styles.iPolicyTxt, { color: aC.isDark ? "#C9C6D0" : "#475569" }]}>Insurance</Text>
              <Text style={[styles.policyVal, styles.iPolicyTxt, { color: aC.isDark ? "#F2F1F5" : "#010a1f" }]} numberOfLines={1}>{String(company || title)}</Text>
            </View>
            <View style={styles.policyRow}>
              <Text style={[styles.policyLabel, styles.iPolicyTxt, { color: aC.isDark ? "#C9C6D0" : "#475569" }]}>Coverage</Text>
              <Text style={[styles.policyVal, styles.iPolicyTxt, { color: aC.isDark ? "#F2F1F5" : "#010a1f" }]}>{coverageStart} - {coverageEnd}</Text>
            </View>
            <View style={[styles.policyRow, { marginBottom: 0 }]}>
              <Text style={[styles.policyLabel, styles.iPolicyTxt, { color: aC.isDark ? "#C9C6D0" : "#475569" }]}>Premium Paid</Text>
              <Text style={[styles.policyVal, styles.iPolicyTxt, { color: aC.isDark ? "#F2F1F5" : "#010a1f" }]}>PKR {formattedPrice}</Text>
            </View>
          </View>
        )}

        {!isInsurance && (
        <>
        {/* Reservation Card */}
        <View style={[styles.resCard, styles.rCard, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? "#7E9FD6" : "rgba(3,42,105,0.14)" }]}>
          {aC.isDark ? <RingGlow radius={16} peak={0.5} rings={12} /> : (
            <>
              <LinearGradient colors={["rgba(22,64,136,0.25)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
              <LinearGradient colors={["transparent", "rgba(29,83,175,0.22)"]} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            </>
          )}

          {/* Car row */}
          <View style={[styles.carRow, styles.rCarRow]}>
            <View style={[styles.carImageBox, styles.rCarImageBox]}>
              {photo ? (
                <Image source={{ uri: String(photo) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="car-outline" size={32} color={SUBTITLE} />
                </View>
              )}
            </View>
            <View style={[styles.carInfo, { gap: 6 }]}>
              <Text style={[styles.rCarName, { color: aC.isDark ? "#F2F1F5" : "#010a1f" }]} numberOfLines={2}>{title}</Text>
              <Text style={styles.rCarPrice}>PKR {formattedPrice}</Text>
              {!!metaLine && (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={aC.isDark ? "#BAB6C4" : "#94a3b8"} />
                  <Text style={[styles.rMetaText, { color: aC.isDark ? "#BAB6C4" : "#64748b" }]} numberOfLines={1}>{metaLine}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Countdown */}
          <Text style={[styles.rTimeLabel, { color: aC.isDark ? "#D2CFD8" : "#475569" }]}>Time Remaining</Text>
          <Text style={styles.rTimeValue}>{rh}h {rm}m {rs}s</Text>
          <Text style={[styles.rTimeNote, { color: aC.isDark ? "#C9C6D0" : "#475569" }]}>
            Your vehicle is reserved for the next 12 hours. Please complete your booking before the time expires.
          </Text>

          {/* Dates */}
          <View style={styles.rDatesRow}>
            <View style={styles.dateCol}>
              <View style={styles.rDateLabelRow}>
                <Ionicons name="calendar-outline" size={16} color={aC.isDark ? "#C9C6D0" : "#64748b"} />
                <Text style={[styles.rDateLabel, { color: aC.isDark ? "#F2F1F5" : "#010a1f" }]}>Reserved on</Text>
              </View>
              <Text style={[styles.rDateVal, { color: aC.isDark ? "#BAB6C4" : "#475569" }]}>{fmtDT(reservedAt)}</Text>
            </View>
            <View style={styles.dateCol}>
              <View style={styles.rDateLabelRow}>
                <Ionicons name="time-outline" size={16} color={aC.isDark ? "#C9C6D0" : "#64748b"} />
                <Text style={[styles.rDateLabel, { color: aC.isDark ? "#F2F1F5" : "#010a1f" }]}>Expires on</Text>
              </View>
              <Text style={[styles.rDateVal, { color: aC.isDark ? "#BAB6C4" : "#475569" }]}>{fmtDT(expiresAt)}</Text>
            </View>
          </View>

          {/* View Reservation + Call Dealer */}
          <View style={styles.cardBtnRow}>
            <TouchableOpacity style={styles.rCardBtn} activeOpacity={0.85} onPress={() => router.push("/profile/my-activity" as any)}>
              <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.rCardBtnTxt}>View Reservation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rCardBtn, { borderWidth: 1, borderColor: aC.isDark ? "#7E9FD6" : "rgba(3,42,105,0.2)", backgroundColor: aC.isDark ? "#0B1D45" : "#ffffff" }]}
              activeOpacity={0.85}
              onPress={handleCallDealer}
            >
              {aC.isDark && <RingGlow radius={17} peak={0.4} rings={7} />}
              <Text style={[styles.rCardBtnTxt, { color: aC.isDark ? "#F2F1F5" : "#032a69" }]}>Call Dealer</Text>
            </TouchableOpacity>
          </View>
        </View>
        </>
        )}

        {isInsurance && <View style={{ height: 70 }} />}

        {/* Download Invoice */}
        <TouchableOpacity style={[styles.invoiceBtn, styles.rBigBtn]} onPress={handleDownloadInvoice} disabled={downloading} activeOpacity={0.88}>
          <LinearGradient colors={PRIMARY_BTN_COLORS as any} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gradBtn, { height: 48 }]}>
            {downloading
              ? <ActivityIndicator color={WHITE} />
              : <Text style={[styles.invoiceTxt, styles.rBigBtnTxt]}>Download Invoice</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        {/* Back to home */}
        <TouchableOpacity
          style={[styles.homeBtn, { backgroundColor: "transparent", borderColor: aC.isDark ? "rgba(91,152,213,0.5)" : "rgba(3,42,105,0.14)" }, styles.rHomeBtn, aC.isDark && { backgroundColor: "#07142F", borderColor: "#7E9FD6" }]}
          onPress={() => router.push("/(tabs)")}
          activeOpacity={0.88}
        >
          {aC.isDark && <RingGlow radius={24} peak={0.5} rings={12} />}
          <Text style={[styles.homeBtnTxt, styles.rBigBtnTxt, { color: aC.isDark ? "#EDEBF0" : "#032a69" }]}>Back to home</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  backBtn: { width: 40, height: 40, justifyContent: "center", paddingLeft: 12, marginTop: 4 },
  insHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: 12, marginTop: 16 },
  insHeaderTitle: { fontSize: 18, fontFamily: "Poppins_600SemiBold" },

  policyCard: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, overflow: "hidden", marginBottom: 24 },
  policyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 12 },
  policyLabel: { fontSize: 12, fontFamily: "Poppins_400Regular", flex: 1 },
  policyVal: { fontSize: 12, fontFamily: "Poppins_500Medium", textAlign: "right", flex: 1 },

  scroll: { paddingHorizontal: 20, paddingBottom: 30 },

  iconContainer: { alignItems: "center", marginTop: 6, marginBottom: 10 },
  celebrationIcon: { fontSize: 56 },

  headingBox: { alignItems: "center", marginBottom: 18 },
  heading: { color: WHITE, fontSize: 18, fontFamily: "Poppins_700Bold", marginBottom: 8, textAlign: "center", lineHeight: 26 },
  subHeading: { color: SUBTITLE, fontSize: 11, fontFamily: "Poppins_400Regular", lineHeight: 17, textAlign: "center" },

  /* Reservation card */
  resCard: { borderWidth: 1, borderRadius: 16, padding: 14, overflow: "hidden", marginBottom: 16 },
  carRow: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 14 },
  carImageBox: { width: 110, height: 86, borderRadius: 10, backgroundColor: "#f5f5f5", overflow: "hidden", flexShrink: 0, justifyContent: "center", alignItems: "center" },
  placeholderImage: { justifyContent: "center", alignItems: "center" },
  carInfo: { flex: 1, gap: 3 },
  carName: { fontSize: 11, fontFamily: "Poppins_600SemiBold", lineHeight: 16 },
  carPrice: { color: ORANGE, fontSize: 12, fontFamily: "Poppins_700Bold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 10, fontFamily: "Poppins_400Regular", flex: 1 },

  timeLabel: { fontSize: 10, fontFamily: "Poppins_400Regular", textAlign: "center" },
  timeValue: { color: ORANGE, fontSize: 17, fontFamily: "Poppins_700Bold", textAlign: "center", marginTop: 2 },
  timeNote: { fontSize: 10, fontFamily: "Poppins_400Regular", lineHeight: 16, textAlign: "center", marginTop: 6, paddingHorizontal: 8 },

  datesRow: { flexDirection: "row", gap: 12, marginTop: 14, marginBottom: 14 },
  dateCol: { flex: 1, gap: 4 },
  dateLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateLabel: { fontSize: 10, fontFamily: "Poppins_400Regular" },
  dateVal: { fontSize: 10, fontFamily: "Poppins_600SemiBold", lineHeight: 15 },

  cardBtnRow: { flexDirection: "row", gap: 10 },
  cardBtnFlex: { flex: 1, borderRadius: 22, overflow: "hidden" },
  cardBtnGrad: { height: 42, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  cardBtnTxt: { color: WHITE, fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  viewResShadow: { shadowColor: "#e2671b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  viewResGrad: { height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 8 },
  viewResTxt: { color: WHITE, fontSize: 10, fontFamily: "Poppins_700Bold", letterSpacing: 0.3 },
  callDealerBtn: { borderWidth: 1, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 20 },

  /* Buttons */
  invoiceBtn: { borderRadius: 28, overflow: "hidden", marginBottom: 10 },
  gradBtn: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  invoiceTxt: { color: WHITE, fontSize: 13, fontFamily: "Poppins_600SemiBold" },

  homeBtn: { height: 50, borderRadius: 28, borderWidth: 1.5, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  homeBtnTxt: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },

  /* Insurance success — Figma */
  iHeaderTitle:  { fontSize: 19, fontFamily: "Poppins_500Medium" },
  iCelebration:  { fontSize: 58, marginTop: 60 },
  iHeading:      { fontSize: 19, fontFamily: "Poppins_600SemiBold", lineHeight: 27, marginBottom: 6 },
  iSubHeading:   { fontSize: 13, lineHeight: 20 },
  iPolicyCard:   { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, marginTop: 6 },
  iPolicyTxt:    { fontSize: 13, fontFamily: "Poppins_400Regular" },

  /* Reservation success — Figma */
  rCelebration: { fontSize: 50, textAlign: "center", alignSelf: "center" },
  rHeading: { fontSize: 18, fontFamily: "Poppins_600SemiBold", lineHeight: 26, marginBottom: 6 },
  rSubHeading: { fontSize: 13, lineHeight: 19 },
  rCard: { borderRadius: 16, padding: 10, paddingBottom: 12, marginBottom: 14 },
  rCarRow: { gap: 14, marginBottom: 12 },
  rCarImageBox: { width: 124, height: 100, borderRadius: 10 },
  rCarName: { fontSize: 11.5, fontFamily: "Poppins_500Medium", lineHeight: 17 },
  rCarPrice: { color: ORANGE, fontSize: 14, fontFamily: "Poppins_500Medium" },
  rMetaText: { fontSize: 11.5, fontFamily: "Poppins_400Regular", flex: 1 },
  rTimeLabel: { fontSize: 11.5, fontFamily: "Poppins_400Regular", textAlign: "center" },
  rTimeValue: { color: ORANGE, fontSize: 18, fontFamily: "Poppins_500Medium", textAlign: "center", marginTop: 1 },
  rTimeNote: { fontSize: 12.5, fontFamily: "Poppins_400Regular", lineHeight: 18, textAlign: "center", marginTop: 2, paddingHorizontal: 4 },
  rDatesRow: { flexDirection: "row", gap: 12, marginTop: 14, marginBottom: 14, paddingHorizontal: 4 },
  rDateLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rDateLabel: { fontSize: 11.5, fontFamily: "Poppins_400Regular" },
  rDateVal: { fontSize: 10.5, fontFamily: "Poppins_400Regular", lineHeight: 15, marginTop: 1 },
  rCardBtn: { flex: 1, height: 34, borderRadius: 17, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  rCardBtnTxt: { color: "#F2F1F5", fontSize: 11.5, fontFamily: "Poppins_500Medium" },
  rBigBtn: { borderRadius: 24, marginBottom: 12 },
  rBigBtnTxt: { fontSize: 15, fontFamily: "Poppins_400Regular", color: "#EDEBF0" },
  rHomeBtn: { height: 48, borderRadius: 24, borderWidth: 1, overflow: "hidden" },

  /* Dealer extra ad success — matches screenshot */
  extraHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, height: 56,
  },
  extraBackBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  extraHeaderTitle: { color: WHITE, fontSize: 18, fontFamily: "Poppins_600SemiBold" },
  extraBody: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  extraEmoji: { fontSize: 64, marginBottom: 18 },
  extraTitle: {
    color: WHITE, fontSize: 20, fontFamily: "Poppins_700Bold",
    textAlign: "center", lineHeight: 28,
  },
  extraSub: {
    color: SUBTITLE, fontSize: 12, fontFamily: "Poppins_400Regular",
    textAlign: "center", marginTop: 8, lineHeight: 18,
  },
  extraFooter: { paddingHorizontal: 16, paddingBottom: 28, gap: 14 },
  extraPrimaryBtn: {
    height: 52, borderRadius: 26, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  extraPrimaryTxt: { color: WHITE, fontSize: 16, fontFamily: "Poppins_500Medium" },
  extraSecondaryBtn: {
    height: 52, borderRadius: 26, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(3,12,40,0.6)",
    borderWidth: 1, borderColor: "rgba(100,160,255,0.5)",
  },
  extraSecondaryTxt: { color: WHITE, fontSize: 16, fontFamily: "Poppins_400Regular" },
  promoteScroll: { flexGrow: 1, paddingBottom: 22 },
  promoteFooter: { marginTop: 'auto', paddingTop: 32 },
  promotePrimaryBtn: { height: 50 },
  promotePrimaryText: { color: WHITE, fontSize: 16, fontFamily: "Poppins_500Medium" },
  promoteSecondaryBtn: { height: 50, backgroundColor: "#010817", borderColor: "#849dc5", borderWidth: 0.8 },
  promoteSecondaryText: { color: WHITE, fontSize: 16, fontFamily: "Poppins_500Medium" },
  promoteViewAd: { alignSelf: "center", padding: 8 },
  promoteViewAdText: { color: SUBTITLE, fontSize: 12, fontFamily: "Poppins_500Medium", textDecorationLine: "underline" },
  promoteBody: { alignItems: "center", paddingTop: 125, paddingHorizontal: 18, paddingBottom: 14 },
  promoteEmoji: { fontSize: 49, marginBottom: 12 },
  promoteTitle: { color: WHITE, fontSize: 21, fontFamily: "Poppins_700Bold", lineHeight: 30, textAlign: "center" },
  promoteSub: { color: SUBTITLE, fontSize: 12, fontFamily: "Poppins_400Regular", textAlign: "center", marginTop: 9 },
  promoteCardBorder: { marginHorizontal: 18, padding: 1, borderRadius: 17, overflow: "hidden" },
  promoteCard: { flexDirection: "row", minHeight: 120, padding: 7, backgroundColor: BG, borderRadius: 16, overflow: "hidden", alignItems: "center", gap: 9 },
  promoteImageBox: { width: "38%", aspectRatio: 1.28, borderRadius: 10, overflow: "hidden", backgroundColor: "#102348", alignItems: "center", justifyContent: "center" },
  promoteInfo: { flex: 1, alignSelf: "stretch", justifyContent: "center", gap: 5 },
  promoteCarName: { color: WHITE, fontSize: 11, fontFamily: "Poppins_600SemiBold", lineHeight: 16 },
  promoteCarPrice: { color: ORANGE, fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  promoteMetaRow: { flexDirection: "row", gap: 3, alignItems: "center" },
  promoteMeta: { color: SUBTITLE, fontSize: 10, fontFamily: "Poppins_400Regular", flexShrink: 1 },
  promoteStatusRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  promoteBadge: { backgroundColor: "rgba(0,112,74,0.23)", borderRadius: 15, paddingHorizontal: 7, paddingVertical: 2 },
  promoteBadgeText: { color: "#19d273", fontSize: 9, fontFamily: "Poppins_500Medium" },
  promotePosted: { color: SUBTITLE, fontSize: 8, fontFamily: "Poppins_400Regular" },
  promoteChevron: { alignSelf: "flex-end", marginBottom: 4 },
});
