import { Redirect } from 'expo-router';

// Seller panel is merged into Become_a_Seller (single seller panel).
// This screen only forwards to its counterpart.
export default function SellerChatsRedirect() {
  return <Redirect href="/Become_a_Seller/chats" />;
}
