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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useAppColors } from "@/constants/theme";

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
    home = "/(dealer)",
  } = useLocalSearchParams<{
    photo: string; title: string; price: string;
    city?: string; year?: string; trans?: string; dealerPhone?: string;
    kind?: string; company?: string;
    providerName?: string; deviceName?: string; date?: string;
    vid?: string; home?: string;
  }>();

  const isInsurance = kind === "insurance";
  const isDealerExtra = kind === "dealer_extra";
  const isTracker = kind === "tracker";
  const isPromote = kind === "promote";

  if (isPromote) {
    const homeRoute = (home || "/(dealer)") as any;
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
            <Ionicons name="chevron-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.extraHeaderTitle}>Promotion</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Center content */}
        <View style={styles.extraBody}>
          <Text style={styles.extraEmoji}>🎉</Text>
          <Text style={styles.extraTitle}>
            Vehicle Promoted{"\n"}Successfully!
          </Text>
          <Text style={styles.extraSub} numberOfLines={2}>
            {title || "Your vehicle"} is now live and promoted.
          </Text>
        </View>

        {/* Bottom buttons */}
        <View style={styles.extraFooter}>
          {!!vid && (
            <TouchableOpacity
              style={styles.extraPrimaryBtn}
              activeOpacity={0.85}
              onPress={() => router.replace({ pathname: '/buy/car-detail', params: { id: String(vid) } } as any)}
            >
              <LinearGradient
                colors={["#032a69", "#e2671b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.extraPrimaryTxt}>View Ad</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.extraSecondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.replace(homeRoute)}
          >
            <LinearGradient
              colors={["rgba(22,64,136,0.2)", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.6 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <LinearGradient
              colors={["transparent", "rgba(29,83,175,0.2)"]}
              start={{ x: 0.5, y: 0.4 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <Text style={styles.extraSecondaryTxt}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isTracker) {
    const paidAmt = Number(String(price).replace?.(/,/g, "") || price || 0).toLocaleString();
    const rows: [string, string][] = [
      ["Provider", String(providerName || company || title || "—")],
      ["Device", String(deviceName || title || "—")],
      ["City", String(city || "—")],
      ["Install Date", String(date || "—")],
      ["Amount Paid", `PKR ${paidAmt}`],
    ];
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
            <Ionicons name="chevron-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.extraHeaderTitle}>Tracker Booking</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
          {/* Center content */}
          <View style={[styles.extraBody, { flex: 0, paddingTop: 24, paddingBottom: 8 }]}>
            <Text style={styles.extraEmoji}>🎉</Text>
            <Text style={styles.extraTitle}>
              Tracker Booked{"\n"}Successfully!
            </Text>
            <Text style={styles.extraSub}>
              Your installation booking has been confirmed.
            </Text>
          </View>

          {/* Booking details */}
          <View style={[styles.policyCard, { backgroundColor: "#010A1F", borderColor: CARD_BORDER }]}>
            <LinearGradient colors={["rgba(22,64,136,0.25)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={["transparent", "rgba(29,83,175,0.22)"]} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            {rows.map(([label, val], i) => (
              <View key={label} style={[styles.policyRow, i === rows.length - 1 && { marginBottom: 0 }]}>
                <Text style={[styles.policyLabel, { color: SUBTITLE }]}>{label}</Text>
                <Text style={[styles.policyVal, { color: WHITE }]} numberOfLines={1}>{val}</Text>
              </View>
            ))}
          </View>

          {/* Bottom buttons */}
          <View style={[styles.extraFooter, { paddingHorizontal: 0, paddingBottom: 0 }]}>
            <TouchableOpacity
              style={styles.extraPrimaryBtn}
              activeOpacity={0.85}
              onPress={() => router.replace("/(tabs)" as any)}
            >
              <LinearGradient
                colors={["#032a69", "#e2671b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.extraPrimaryTxt}>Back to home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.extraSecondaryBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/profile/my-activity" as any)}
            >
              <LinearGradient
                colors={["rgba(22,64,136,0.2)", "transparent"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.6 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <LinearGradient
                colors={["transparent", "rgba(29,83,175,0.2)"]}
                start={{ x: 0.5, y: 0.4 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <Text style={styles.extraSecondaryTxt}>View My Bookings</Text>
            </TouchableOpacity>
          </View>
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
            <Ionicons name="chevron-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.extraHeaderTitle}>Processing Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Center content */}
        <View style={styles.extraBody}>
          <Text style={styles.extraEmoji}>🎉</Text>
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
              colors={["#032a69", "#e2671b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.extraPrimaryTxt}>Back to home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.extraSecondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/(dealer)/plan" as any)}
          >
            <LinearGradient
              colors={["rgba(22,64,136,0.2)", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.6 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <LinearGradient
              colors={["transparent", "rgba(29,83,175,0.2)"]}
              start={{ x: 0.5, y: 0.4 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
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
    <SafeAreaView style={[styles.safe, { backgroundColor: aC.bg }]}>
      <StatusBar barStyle={aC.isDark ? "light-content" : "dark-content"} backgroundColor={aC.bg} />

      {/* Header */}
      {isInsurance ? (
        <View style={styles.insHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={aC.isDark ? WHITE : "#010a1f"} />
          </TouchableOpacity>
          <Text style={[styles.insHeaderTitle, { color: aC.isDark ? WHITE : "#010a1f" }]}>Processing Payment</Text>
          <View style={{ width: 40 }} />
        </View>
      ) : (
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={aC.isDark ? WHITE : "#010a1f"} />
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Celebration */}
        <View style={styles.iconContainer}>
          <Text style={styles.celebrationIcon}>🎉</Text>
        </View>

        {/* Heading */}
        <View style={styles.headingBox}>
          <Text style={[styles.heading, { color: aC.isDark ? WHITE : "#010a1f" }]}>
            {isInsurance ? "Insurance Purchased\nSuccessfully!" : "Reservation Submitted\nSuccessfully!"}
          </Text>
          <Text style={[styles.subHeading, { color: aC.isDark ? SUBTITLE : "#475569" }]}>
            {isInsurance
              ? "Your insurance policy has been activated\nsuccessfully."
              : "Your reservation request has been\nsuccessfully submitted."}
          </Text>
        </View>

        {isInsurance && (
          <View style={[styles.policyCard, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? CARD_BORDER : "rgba(3,42,105,0.14)" }]}>
            <LinearGradient colors={["rgba(22,64,136,0.25)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <LinearGradient colors={["transparent", "rgba(29,83,175,0.22)"]} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
            <View style={styles.policyRow}>
              <Text style={[styles.policyLabel, { color: aC.isDark ? SUBTITLE : "#475569" }]}>Policy Number</Text>
              <Text style={[styles.policyVal, { color: aC.isDark ? WHITE : "#010a1f" }]}>{policyNo}</Text>
            </View>
            <View style={styles.policyRow}>
              <Text style={[styles.policyLabel, { color: aC.isDark ? SUBTITLE : "#475569" }]}>Insurance</Text>
              <Text style={[styles.policyVal, { color: aC.isDark ? WHITE : "#010a1f" }]} numberOfLines={1}>{String(company || title)}</Text>
            </View>
            <View style={styles.policyRow}>
              <Text style={[styles.policyLabel, { color: aC.isDark ? SUBTITLE : "#475569" }]}>Coverage</Text>
              <Text style={[styles.policyVal, { color: aC.isDark ? WHITE : "#010a1f" }]}>{coverageStart} - {coverageEnd}</Text>
            </View>
            <View style={[styles.policyRow, { marginBottom: 0 }]}>
              <Text style={[styles.policyLabel, { color: aC.isDark ? SUBTITLE : "#475569" }]}>Premium Paid</Text>
              <Text style={[styles.policyVal, { color: aC.isDark ? WHITE : "#010a1f" }]}>PKR {formattedPrice}</Text>
            </View>
          </View>
        )}

        {!isInsurance && (
        <>
        {/* Reservation Card */}
        <View style={[styles.resCard, { backgroundColor: aC.isDark ? "#010A1F" : "#ffffff", borderColor: aC.isDark ? CARD_BORDER : "rgba(3,42,105,0.14)" }]}>
          <LinearGradient colors={["rgba(22,64,136,0.25)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
          <LinearGradient colors={["transparent", "rgba(29,83,175,0.22)"]} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

          {/* Car row */}
          <View style={styles.carRow}>
            <View style={styles.carImageBox}>
              {photo ? (
                <Image source={{ uri: String(photo) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="car-outline" size={32} color={SUBTITLE} />
                </View>
              )}
            </View>
            <View style={styles.carInfo}>
              <Text style={[styles.carName, { color: aC.isDark ? WHITE : "#010a1f" }]} numberOfLines={2}>{title}</Text>
              <Text style={styles.carPrice}>PKR {formattedPrice}</Text>
              {!!metaLine && (
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={12} color={aC.isDark ? SUBTITLE : "#94a3b8"} />
                  <Text style={[styles.metaText, { color: aC.isDark ? SUBTITLE : "#64748b" }]} numberOfLines={1}>{metaLine}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Countdown */}
          <Text style={[styles.timeLabel, { color: aC.isDark ? SUBTITLE : "#475569" }]}>Time Remaining</Text>
          <Text style={styles.timeValue}>{rh}h {rm}m {rs}s</Text>
          <Text style={[styles.timeNote, { color: aC.isDark ? SUBTITLE : "#475569" }]}>
            Your vehicle is reserved for the next 12 hours. Please complete your booking before the time expires.
          </Text>

          {/* Dates */}
          <View style={styles.datesRow}>
            <View style={styles.dateCol}>
              <View style={styles.dateLabelRow}>
                <Ionicons name="calendar-outline" size={13} color={aC.isDark ? SUBTITLE : "#64748b"} />
                <Text style={[styles.dateLabel, { color: aC.isDark ? SUBTITLE : "#64748b" }]}>Reserved on</Text>
              </View>
              <Text style={[styles.dateVal, { color: aC.isDark ? WHITE : "#010a1f" }]}>{fmtDT(reservedAt)}</Text>
            </View>
            <View style={styles.dateCol}>
              <View style={styles.dateLabelRow}>
                <Ionicons name="time-outline" size={13} color={aC.isDark ? SUBTITLE : "#64748b"} />
                <Text style={[styles.dateLabel, { color: aC.isDark ? SUBTITLE : "#64748b" }]}>Expires on</Text>
              </View>
              <Text style={[styles.dateVal, { color: aC.isDark ? WHITE : "#010a1f" }]}>{fmtDT(expiresAt)}</Text>
            </View>
          </View>

          {/* View Reservation + Call Dealer */}
          <View style={styles.cardBtnRow}>
            <TouchableOpacity style={[styles.cardBtnFlex, styles.viewResShadow]} activeOpacity={0.85} onPress={() => router.push("/profile/my-activity" as any)}>
              <LinearGradient colors={["#0d2f7a", "#e2671b", "#ff8c42"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.viewResGrad}>
                <Text style={styles.viewResTxt}>View Reservation</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cardBtnFlex, styles.callDealerBtn, { borderColor: aC.isDark ? CARD_BORDER : "rgba(3,42,105,0.2)" }]}
              activeOpacity={0.85}
              onPress={handleCallDealer}
            >
              <Text style={[styles.cardBtnTxt, { color: aC.isDark ? WHITE : "#032a69" }]}>Call Dealer</Text>
            </TouchableOpacity>
          </View>
        </View>
        </>
        )}

        {/* Download Invoice */}
        <TouchableOpacity style={styles.invoiceBtn} onPress={handleDownloadInvoice} disabled={downloading} activeOpacity={0.88}>
          <LinearGradient colors={["#032a69", ORANGE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtn}>
            {downloading
              ? <ActivityIndicator color={WHITE} />
              : <Text style={styles.invoiceTxt}>Download Invoice</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        {/* Back to home */}
        <TouchableOpacity
          style={[styles.homeBtn, { backgroundColor: "transparent", borderColor: aC.isDark ? "rgba(91,152,213,0.5)" : "rgba(3,42,105,0.14)" }]}
          onPress={() => router.push("/(tabs)")}
          activeOpacity={0.88}
        >
          <Text style={[styles.homeBtnTxt, { color: aC.isDark ? WHITE : "#032a69" }]}>Back to home</Text>
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
  extraFooter: { paddingHorizontal: 20, paddingBottom: 28, gap: 12 },
  extraPrimaryBtn: {
    height: 52, borderRadius: 26, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  extraPrimaryTxt: { color: WHITE, fontSize: 14, fontFamily: "Poppins_500Medium" },
  extraSecondaryBtn: {
    height: 52, borderRadius: 26, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(3,12,40,0.6)",
    borderWidth: 1, borderColor: "rgba(100,160,255,0.5)",
  },
  extraSecondaryTxt: { color: WHITE, fontSize: 14, fontFamily: "Poppins_500Medium" },
});
