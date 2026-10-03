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

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={20}
              color="#B7B4C2"
            />
          </TouchableOpacity>

          {/* Light Bulb Circle */}
          <View style={styles.iconCircle}>
            <Ionicons
              name="bulb"
              size={26}
              color="#FF7415"
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
                colors={["#073A89", "#FF6B12"]}
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

  modalContainer: {
    width: width * 0.85,
    backgroundColor: "#020D25",
    borderRadius: 24,

    borderWidth: 1,
    borderColor: "#12458C",

    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,

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
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,

    backgroundColor: "#06235B",

    justifyContent: "center",
    alignItems: "center",

    alignSelf: "center",

    marginBottom: 14,

    shadowColor: "#1260D0",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },

  message: {
    color: "#C3C0CB",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "400",
    textAlign: "center",

    marginBottom: 16,
  },

  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonWrapper: {
    flex: 1,
  },

  callButton: {
    height: 46,
    borderRadius: 23,

    justifyContent: "center",
    alignItems: "center",

    overflow: "hidden",
  },

  callButtonText: {
    color: "#EDEBF0",
    fontSize: 14,
    fontWeight: "700",
  },

  cancelButton: {
    flex: 1,
    height: 46,

    borderRadius: 23,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#0B2856",

    borderWidth: 1,
    borderColor: "#4E80C5",

    shadowColor: "#2E65A9",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },

  cancelText: {
    color: "#C7C5CF",
    fontSize: 14,
    fontWeight: "400",
  },
});
