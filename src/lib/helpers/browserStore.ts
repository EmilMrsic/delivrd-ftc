import { db } from "@/firebase/config";
import { onSnapshot, collection } from "firebase/firestore";
import { useNegotiationStore } from "../state/negotiation";
import { NegotiationDataType } from "../models/team";
// import { db } from "./firebase";
// import { useStore } from "./store";

let started = false;
let initialized = false;

export function startFirestoreSync() {
  if (started) return;
  started = true;

  onSnapshot(collection(db, "delivrd_negotiations"), (snap) => {
    if (!initialized) {
      initialized = true;
      return;
    }

    const updateNegotiationsObject = {
      ...useNegotiationStore.getState().negotiations,
    };

    let count = 0;
    snap.docChanges().forEach((change) => {
      const id = change.doc.id;
      const data = change.doc.data();
      if (change.type === "added" || change.type === "modified") {
        updateNegotiationsObject[id] = { ...data } as NegotiationDataType;
        count += 1;
      } else if (change.type === "removed") {
        delete updateNegotiationsObject[id];
      }
    });

    useNegotiationStore.setState({
      negotiations: updateNegotiationsObject,
    });

    console.log(`Firestore sync: processed ${count} negotiation changes.`);
  });
}
