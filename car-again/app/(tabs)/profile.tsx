import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useAppColors } from "@/constants/theme";
import {
  Alert,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE } from "@/constants/api";

const IMG_LOGO = require('@/assets/images/autowizor-logo-text.png');
const ORANGE   = "#e2671b";
const RED      = "#ff383c";
const SHADOW_C = "#1D53AF";

// ── Menu Data ──────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { title: "My Activity",   icon: "car-outline",           route: '/profile/my-activity'   },
  { title: "Claim",         icon: "construct-outline",     route: '/profile/claim'          },
  { title: "My Ads",        icon: "megaphone-outline",     route: '/profile/my-listings'   },
  { title: "Transactions",  icon: "receipt-outline",       route: '/profile/transactions'  },
  { title: "Notifications", icon: "notifications-outline", toggle: true, route: null        },
  { title: "Documents",     icon: "document-text-outline", route: '/profile/documents'     },
  { title: "My Favorites",  icon: "heart-outline",         route: '/profile/saved'         },
];

// ──────────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router  = useRouter();
  const C       = useAppColors();
  const { user, logout, refreshUser } = useAuth();
  const [notifOn,    setNotifOn]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  }

  const displayName  = user?.full_name || 'User';
  const displayEmail = user?.email    || '';
  const displayPhone = user?.phone    || '';
  const displayLocation = (user as any)?.city || (user as any)?.location || 'Karachi';
  const initials     = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const BASE_URL      = API_BASE.replace('/api/v1', '');
  const displayAvatar = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${BASE_URL}${user.avatar_url}`)
    : null;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={["top"]}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn}>
          <Ionicons name="arrow-back-outline" size={24} color={C.textPrimary} />
        </TouchableOpacity>

        <View style={s.logoWrap} pointerEvents="none">
          {C.isDark ? (
            <Image source={IMG_LOGO} style={s.logo} resizeMode="contain" />
          ) : (
            <Text style={s.logoTextLight}>
              <Text style={{ color: '#032a69' }}>Auto</Text>
              <Text style={{ color: '#e2671b' }}>wizor</Text>
            </Text>
          )}
        </View>

        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/alert' as any)}>
            <Ionicons name="notifications-outline" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/profile/settings' as any)}>
            <Ionicons name="settings-outline" size={20} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[s.scrollView, { backgroundColor: C.bg }]}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={ORANGE}
            colors={[ORANGE]}
          />
        }
      >

        {/* ── Profile Card — Figma top section / Ads vehicle-card treatment ── */}
        <View style={[s.glowWrap, { backgroundColor: C.bg }] }>
        <View style={[s.profileCard, {
          borderColor: C.isDark ? '#82a5d5' : 'rgba(3,42,105,0.12)',
          backgroundColor: C.isDark ? '#010A1F' : '#ffffff',
          shadowColor: C.isDark ? '#638ed0' : 'rgba(3,42,105,0.12)',
          shadowOpacity: C.isDark ? 0.15 : 0.08,
          shadowRadius: C.isDark ? 5 : 8,
          elevation: C.isDark ? 2 : 3,
        }]}>
          {C.isDark && (
            <>
              <LinearGradient
                colors={['#16408880', 'transparent', 'transparent', '#16408880']}
                locations={[0, 0.12, 0.88, 1]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['#16408880', 'transparent', 'transparent', '#16408880']}
                locations={[0, 0.05, 0.95, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
            </>
          )}
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={s.avatar} resizeMode="cover" />
          ) : (
            <View style={[s.avatar, s.avatarInitials]}>
              <Text style={s.avatarInitialsTxt}>{initials}</Text>
            </View>
          )}

          <View style={s.userInfo}>
            <Text style={[s.userName, { color: C.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{displayName}</Text>
            {displayEmail ? <Text style={[s.userSub, { color: C.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{displayEmail}</Text> : null}
            {(displayPhone || displayLocation) ? (
              <Text style={[s.userSub, { color: C.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                {displayPhone}{displayPhone && displayLocation ? ' • ' : ''}{displayLocation}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity style={[s.editBtn, { borderColor: 'transparent', backgroundColor: C.isDark ? '#151b31' : '#eef1f8' }]} onPress={() => router.push('/profile/edit' as any)}>
            <Text style={[s.editTxt, { color: C.textPrimary }]}>Edit</Text>
          </TouchableOpacity>
        </View>
        </View>

        {/* ── Menu Card — Figma exact / Ads vehicle-card treatment ── */}
        <View style={[s.glowWrap, { backgroundColor: C.bg }] }>
        <View style={[s.menuCard, {
          borderColor: C.isDark ? '#82a5d5' : 'rgba(3,42,105,0.12)',
          backgroundColor: C.isDark ? '#010A1F' : '#ffffff',
          shadowColor: C.isDark ? '#638ed0' : 'rgba(3,42,105,0.12)',
          shadowOpacity: C.isDark ? 0.15 : 0.08,
          shadowRadius: C.isDark ? 5 : 8,
          elevation: C.isDark ? 2 : 3,
        }]}>
          {C.isDark && (
            <>
              <LinearGradient
                colors={['#16408868', 'transparent', 'transparent', '#16408868']}
                locations={[0, 0.12, 0.88, 1]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['#16408880', 'transparent', 'transparent', '#16408880']}
                locations={[0, 0.05, 0.95, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
            </>
          )}
          {MENU_ITEMS.map((item, i) => (
            <React.Fragment key={item.title}>
              <TouchableOpacity
                style={s.menuRow}
                activeOpacity={0.7}
                onPress={() => item.route && router.push(item.route as any)}
              >
                <View style={s.menuLeft}>
                  <Ionicons name={item.icon as any} size={24} color={ORANGE} />
                  <Text style={[s.menuTxt, { color: C.textPrimary }]}>{item.title}</Text>
                </View>

                {(item as any).toggle ? (
                  <Switch
                    value={notifOn}
                    onValueChange={setNotifOn}
                    trackColor={{ false: C.isDark ? "#555" : "#ccc", true: ORANGE }}
                    thumbColor={C.textPrimary}
                    ios_backgroundColor={C.isDark ? "#555" : "#ccc"}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
                )}
              </TouchableOpacity>

              {i < MENU_ITEMS.length - 1 && (
                <View style={[s.divider, { backgroundColor: C.isDark ? 'rgba(34,82,160,0.72)' : 'rgba(3,42,105,0.12)' }]} />
              )}
            </React.Fragment>
          ))}

          <View style={[s.divider, { backgroundColor: C.isDark ? 'rgba(34,82,160,0.72)' : 'rgba(3,42,105,0.12)' }]} />
          {/* Logout */}
          <TouchableOpacity
            style={s.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
              ]);
            }}
          >
            <View style={s.menuLeft}>
              <Ionicons name="log-out-outline" size={24} color={RED} />
              <Text style={s.logoutTxt}>Logout</Text>
            </View>
          </TouchableOpacity>

        </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles (Figma pixel-perfect) ──────────────────────────────────────────
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#010a1f",
    
  },

  header: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  logoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 112,
    height: 21,
  },
  logoTextLight: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 1,
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#010a1f",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },

  glowWrap: {
    borderRadius: 18,
    backgroundColor: "#010a1f",
  },

  profileCard: {
    height: 104,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "#020d25",
    paddingHorizontal: 19,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(249,250,252,0.95)",
    overflow: "hidden",
  },
  avatarInitials: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#032a69",
  },
  avatarInitialsTxt: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#f9fafc",
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    textTransform: "capitalize",
    flexShrink: 1,
  },
  userSub: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    flexShrink: 1,
  },

  editBtn: {
    width: 68,
    height: 28,
    borderRadius: 18,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "#151b31",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 7,
    paddingRight: 8,
    paddingTop: 2,
    paddingBottom: 3,
  },
  editTxt: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },

  menuCard: {
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "#010B1E",
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
  },

  menuRow: {
    height: 46,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  menuTxt: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },

  logoutTxt: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#ff383c",
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(34,82,160,0.72)',
    marginHorizontal: 0,
  },
});
