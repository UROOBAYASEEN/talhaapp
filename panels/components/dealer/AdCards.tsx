// Figma ad cards shared by the dealer and insurance "Active Advertisements" screens.
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Trash2 } from 'lucide-react-native';

const { width: SW } = Dimensions.get('window');
const ORANGE = '#E2671B';

function daysLeft(expiresAt?: string) {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

/* ── Banner Card (Figma: image + "Top" badge, navy info panel, "Details >>") ── */
export function BannerCard({ banner, onDelete, onDetail, activeLabel = 'Top' }: { banner: any; onDelete: () => void; onDetail: () => void; activeLabel?: string }) {
  const left   = daysLeft(banner.expires_at);
  const target = [banner.target_user_type || banner.user_type, banner.status === 'active' ? `Ends in ${left} days` : banner.status]
    .filter(Boolean).join(' • ');

  return (
    <View style={bc.card}>
      <TouchableOpacity style={bc.thumb} onPress={onDetail} activeOpacity={0.85}>
        {banner.banner_image_url ? (
          <Image source={{ uri: banner.banner_image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#374151','#1f2937','#000']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject}/>
        )}
        <View style={bc.topBadge}>
          <Text style={bc.topTxt}>{banner.status === 'pending' ? 'Pending' : banner.status === 'active' ? activeLabel : String(banner.status || 'Ad')}</Text>
        </View>
        <TouchableOpacity style={bc.circleBtn} onPress={onDelete}>
          <Trash2 size={15} color={ORANGE}/>
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={bc.info}>
        <Text style={bc.title} numberOfLines={1}>{banner.title}</Text>
        <Text style={bc.sub} numberOfLines={2}>{target ? `Targeting: ${target}` : (banner.display_location || banner.campaign_name || 'Banner Ad')}</Text>
        <TouchableOpacity onPress={onDetail} style={{ alignSelf: 'flex-end' }}>
          <Text style={bc.detailsLink}>{'Details >>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const bc = StyleSheet.create({
  card:        { width: SW * 0.84, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0B2358' },
  thumb:       { height: 176, position: 'relative' },
  topBadge:    { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(226,103,27,0.45)', borderWidth: 1, borderColor: ORANGE, paddingHorizontal: 14, paddingVertical: 3, borderRadius: 16 },
  topTxt:      { color: '#FFB8A8', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  circleBtn:   { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: '#0B2358', alignItems: 'center', justifyContent: 'center' },
  info:        { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, gap: 4 },
  title:       { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_500Medium' },
  sub:         { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  detailsLink: { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_400Regular' },
});

/* ── Video Card (Figma: tall thumb, PROMOTED badge, orange play, "Details >>") ── */
export function VideoCard({ video, onDelete, onPlay, onDetail }: { video: any; onDelete: () => void; onPlay: () => void; onDetail: () => void }) {
  return (
    <View style={vc.card}>
      <TouchableOpacity style={vc.thumb} onPress={onPlay} activeOpacity={0.85}>
        {video.media_url ? (
          <Image source={{ uri: video.media_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#374151','#1f2937','#000']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFillObject}/>
        )}
        {video.status === 'active' && (
          <View style={vc.promotedBadge}>
            <Text style={vc.promotedText}>PROMOTED</Text>
          </View>
        )}
        <TouchableOpacity style={vc.deleteCircle} onPress={onDelete}>
          <Trash2 size={14} color={ORANGE}/>
        </TouchableOpacity>
        <View style={vc.playBtn}>
          <Play size={18} color="#FF8A3D" fill="#FF8A3D" style={{ marginLeft: 3 }}/>
        </View>
        <TouchableOpacity onPress={onDetail} style={vc.details}>
          <Text style={vc.detailsLink}>{'Details >>'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const vc = StyleSheet.create({
  card:          { width: (SW - 32 - 16) / 2, maxWidth: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  thumb:         { height: 250, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  promotedBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(226,103,27,0.45)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  promotedText:  { color: '#FF9A5A', fontSize: 11, fontFamily: 'Poppins_500Medium', letterSpacing: 1 },
  deleteCircle:  { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: '#0B2358', alignItems: 'center', justifyContent: 'center' },
  playBtn:       { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(226,103,27,0.45)', alignItems: 'center', justifyContent: 'center' },
  details:       { position: 'absolute', right: 12, bottom: 12 },
  detailsLink:   { color: ORANGE, fontSize: 13, fontFamily: 'Poppins_400Regular' },
});

