import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const options = {
  headerShown: false,
};

export default function EducationScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalImage, setModalImage] = React.useState(null);

  const handleImagePress = (imgSrc: any) => {
    setModalImage(imgSrc);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalImage(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={28} color="#263A13" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo landscape.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={{ width: 28 }} />
      </View>
      {/* Banner - static at the top */}
      <View style={styles.bannerWrapper}>
        <ImageBackground source={require('../../assets/images/blend.jpg')} style={styles.bannerBg} imageStyle={styles.bannerImage}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerPill}><Text style={styles.bannerPillText}>Be Educated</Text></View>
          </View>
        </ImageBackground>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* What is Waste */}
        <View style={styles.sectionRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>What Is Waste?</Text>
            <Text style={styles.sectionText}>
              Waste is anything we throw away: plastic wrappers, leftover food, old clothes, broken gadgets, or even garden trimmings. How we handle waste matters more than we think.
            </Text>
          </View>
          <Image source={require('../../assets/images/environment.jpg')} style={styles.sectionImage} />
        </View>

        {/* Why Proper Waste Disposal Matters */}
        <View style={styles.sectionCard}>
          <Image source={require('../../assets/images/disposal.jpg')} style={styles.cardImage} />
          <Text style={styles.sectionTitle}>Why Proper Waste Disposal Matters;</Text>
          <Text style={styles.sectionText}>
            - Protects the Environment: Improper disposal pollutes our land, rivers, and air.{"\n"}
            - Keeps Us Healthy: Waste attracts pests and spreads disease when left unmanaged.{"\n"}
            - Fights Climate Change: Waste that rots in landfills emits harmful gases like methane.{"\n"}
            - Creates Jobs: Recycling and composting create green jobs and support local communities.
          </Text>
        </View>

        {/* Did You Know */}
        <View style={styles.sectionRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Did You Know?</Text>
            <Text style={styles.sectionText}>
              Ghana generates over 12,000 tonnes of solid waste every day, and a significant portion is not properly managed. This leads to pollution, flooding, and serious health risks especially in urban communities.
            </Text>
          </View>
          <Image source={require('../../assets/images/schedule.jpg')} style={styles.sectionImage} />
        </View>

        {/* What You Can Do */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What You Can Do?</Text>
          <View style={styles.actionRow}>
            <View style={styles.actionTextContainer}>
              <Text style={styles.sectionText}>• Schedule waste pickups with EcoWasteGo.</Text>
            </View>
            <Pressable onPress={() => handleImagePress(require('../../assets/images/schedule.jpg'))} style={styles.imageWrapper}>
              <Image source={require('../../assets/images/schedule.jpg')} style={styles.actionImage} />
            </Pressable>
          </View>
          <View style={styles.actionRow}>
            <View style={styles.actionTextContainer}>
              <Text style={styles.sectionText}>• Separate your waste at home.</Text>
            </View>
            <Pressable onPress={() => handleImagePress(require('../../assets/images/disposal.jpg'))} style={styles.imageWrapper}>
              <Image source={require('../../assets/images/disposal.jpg')} style={styles.actionImage} />
            </Pressable>
          </View>
          <View style={styles.actionRow}>
            <View style={styles.actionTextContainer}>
              <Text style={styles.sectionText}>• Compost your food scraps.</Text>
            </View>
            <Pressable onPress={() => handleImagePress(require('../../assets/images/compost.jpg'))} style={styles.imageWrapper}>
              <Image source={require('../../assets/images/compost.jpg')} style={styles.actionImage} />
            </Pressable>
          </View>
          <View style={styles.actionRow}>
            <View style={styles.actionTextContainer}>
              <Text style={styles.sectionText}>• Teach someone what you’ve learned.</Text>
            </View>
            <Pressable onPress={() => handleImagePress(require('../../assets/images/teach.jpg'))} style={styles.imageWrapper}>
              <Image source={require('../../assets/images/teach.jpg')} style={styles.actionImage} />
            </Pressable>
          </View>
        </View>

        {/* Full Image Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCloseModal}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
            <View style={styles.modalContent}>
              {modalImage && (
                <Image source={modalImage} style={styles.fullImage} resizeMode="contain" />
              )}
              <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Explore More */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Explore More</Text>
          <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.google.com/maps/search/recyclers+near+me/')}>🔑 &quot;Nearby Recyclers&quot;</Text>
          <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.epa.gov/recycle/frequent-questions-recycling')}>📘 &quot;More Waste Facts&quot;</Text>
          <Text style={styles.sectionTitle}>🎥 &quot;Watch Tutorials&quot;</Text>
          <Pressable style={styles.youtubePlayerPlaceholder} onPress={() => Linking.openURL('https://youtu.be/AJVky2Fzl54?si=rjfF5WIgltkpwEMj')}>
            <Image source={require('../../assets/images/videoImage.png')} style={styles.youtubeThumbnail} />
            <Image source={require('../../assets/images/youtube-logo.png')} style={styles.youtubeLogoLarge} />
            <View style={styles.youtubePlayButtonContainer}>
              <View style={styles.youtubePlayButton}>
                <View style={styles.youtubePlayTriangle} />
              </View>
            </View>
            <View style={styles.youtubeGradient} />
          </Pressable>
          <Text style={styles.youtubeVideoTitle}>EcoWasteGo: How to Use the App (Tutorial)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 0,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#263A13',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  bannerWrapper: {
    marginHorizontal: 0,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    height: 80,
  },
  bannerBg: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerImage: {
    borderRadius: 20,
    height: 80,
    opacity: 0.2,
  },
  bannerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPill: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  bannerPillText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263A13',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginLeft: 12,
  },
  sectionCard: {
    backgroundColor: '#F6F8F3',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    alignItems: 'flex-start',
  },
  cardImage: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#263A13',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 15,
    color: '#222',
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  actionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actionImage: {
    width: 70,
    height: 48,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  imageWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  linkText: {
    fontSize: 15,
    color: '#007AFF',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  videoPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#222',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  videoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullImage: {
    width: 300,
    height: 300,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#263A13',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  videoPlayer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#000',
    marginTop: 12,
  },
  youtubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  youtubeLogo: {
    width: 32,
    height: 32,
    marginRight: 10,
    resizeMode: 'contain',
  },
  youtubeButtonText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: 'bold',
  },
  youtubePlayerPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#181818',
    borderRadius: 16,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    borderWidth: 2,
    borderColor: '#222',
    overflow: 'hidden',
    position: 'relative',
  },
  youtubeLogoLarge: {
    width: 64,
    height: 64,
    position: 'absolute',
    top: 24,
    left: 24,
    opacity: 0.18,
    zIndex: 1,
  },
  youtubePlayButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  youtubePlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(229,57,53,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  youtubePlayTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: '#fff',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderStyle: 'solid',
    marginLeft: 6,
  },
  youtubeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 1,
  },
  youtubeButtonTextLarge: {
    display: 'none',
  },
  youtubeVideoTitle: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  youtubeThumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
    zIndex: 0,
  },
  logo: {
    width: 200,
    height: 60,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
}); 