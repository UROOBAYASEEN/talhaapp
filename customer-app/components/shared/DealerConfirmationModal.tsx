import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onClose: () => void;
  onCallDealer: () => void;
  onCancel?: () => void;
};

const DealerConfirmationModal = ({
  visible,
  onClose,
  onCallDealer,
  onCancel,
}: Props) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* app/profile/saved.tsx — vehicle card effect */}
          <LinearGradient
            colors={['#16408880', 'transparent', 'transparent', '#16408880']}
            locations={[0, 0.08, 0.92, 1]}
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

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={22}
              color="#BAACB6"
            />
          </TouchableOpacity>

          {/* Light Bulb Circle */}
          <View style={styles.iconCircle}>
            <Ionicons
              name="bulb"
              size={26}
              color="#E0672A"
            />
          </View>

          {/* Message */}
          <Text style={styles.message}>
            Before reserving, please call the dealership{"\n"}
            to verify the vehicle's availability. Once{"\n"}
            confirmed, your reservation amount will be{"\n"}
            adjusted against the final purchase price.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>

            {/* Call Dealer */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onCallDealer}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={["#0A2D65", "#DB662A"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.callButton}
              >
                <Text style={styles.callButtonText}>
                  Call Dealer
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel ?? onClose}
              style={styles.cancelButton}
            >
              {/* app/profile/saved.tsx — search input effect */}
              <LinearGradient
                colors={['#163565', '#061124', '#061124', '#0D2146']}
                locations={[0, 0.24, 0.76, 1]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['#24518F8F', '#16356552', 'transparent', 'transparent', '#16356552', '#24518F8F']}
                locations={[0, 0.025, 0.075, 0.925, 0.975, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DealerConfirmationModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 0,
  },

  // Figma — screen width - 32, saved.tsx vehicle card background
  modalContainer: {
    width: width - 32,
    backgroundColor: "#010A1F",
    borderRadius: 15,

    borderWidth: 1,
    borderColor: "#163A75",

    paddingTop: 23,
    paddingHorizontal: 25,
    paddingBottom: 26,
    overflow: "hidden",

    // Android shadow
    elevation: 20,

    // iOS shadow
    shadowColor: "#1761C9",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.45,
    shadowRadius: 25,
  },

  closeButton: {
    position: "absolute",
    top: 1,
    right: 6,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,

    backgroundColor: "#071C49",

    justifyContent: "center",
    alignItems: "center",

    alignSelf: "center",

    marginBottom: 10,
  },

  message: {
    color: "#BAACB6",
    fontSize: 12.5,
    lineHeight: 18.5,
    fontFamily: "Poppins_400Regular",
    textAlign: "left",

    marginBottom: 15,
  },

  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginHorizontal: 9,
  },

  buttonWrapper: {
    flex: 1,
  },

  callButton: {
    height: 36,
    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",

    overflow: "hidden",
  },

  callButtonText: {
    color: "#D2D2D2",
    fontSize: 10.5,
    fontFamily: "Poppins_600SemiBold",
  },

  cancelButton: {
    flex: 1,
    height: 36,

    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#061124",

    borderWidth: 1,
    borderColor: "#7A93BD",
    overflow: "hidden",
  },

  cancelText: {
    color: "#C1C5CC",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
});
