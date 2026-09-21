import { getToken } from "firebase/messaging";
import { messaging } from "./firebaseConfig";

const VAPID_KEY = "BO0j2hd9WvMFwuAj-K9nT1Xt_l5izcDzV9PxeydCvmhKFLxB9CBV0oVh7BH7Y1XgjCdQ0ZSl3oqjd1FKxTS94rE";

export async function getFcmToken(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("User deny notification permission");
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      console.log("✅ FCM Token:", token);
      return token;
    } else {
      console.log("Token generate error");
      return null;
    }
  } catch (error) {
    console.error("FCM token error:", error);
    return null;
  }
}