import {
  collection,
  doc,
  FieldValue,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useUserState } from "../state/user";
import { db } from "@/firebase/config";
import { generateRandomId } from "../utils";

export type ClientEventType =
  | "work_log"
  | "incoming_bid"
  | "login"
  | "bid_accepted"
  | "bid_cancelled"
  | "message_sent"
  | "bid_comment";
export interface EventDataType<T = object> {
  id: string;
  at: FieldValue;
  type: ClientEventType;
  data: T;
  actor_uid: string;
  actor_name: string;
  // summary: string;
  // details:
  ref_user_login_event_id: string;
}

/**
 * Log events for a negotiation, e.g. if a client or coordinator does something we have a log
 */
export const logClientEvent = async <T = object>(
  type: ClientEventType,
  negotiationId: string,
  data: T
) => {
  const userState = useUserState.getState();
  if (!userState.userId || !userState.loginId) {
    console.warn("No user ID or login ID set, cannot log event");
    return;
  }

  console.log("Client event logged", { type, data, userState });
  console.log("userState:", userState);
  const eventObject: EventDataType<T> = {
    id: generateRandomId(),
    at: serverTimestamp(),
    type: type,
    data,
    actor_uid: userState.userId,
    actor_name: userState.name || "Unknown",
    ref_user_login_event_id: userState.loginId,
  };

  const eventTable = collection(
    db,
    `delivrd_negotiations/${negotiationId}/activity`
  );

  const docRef = doc(eventTable, eventObject.id);
  await setDoc(docRef, eventObject);
  return eventObject;
};
