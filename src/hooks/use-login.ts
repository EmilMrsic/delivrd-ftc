import { db } from "@/firebase/config";
import { generateRandomId } from "@/lib/utils";
import axios from "axios";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";
import { z } from "zod";

const emailSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .transform((val) => val.toLowerCase()),
});

export const useLogin = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const sendEmail = async (email: string) => {
    try {
      const emailData = {
        to: email,
      };
      await axios.post(`/api/email`, emailData);

      setNotification(`Email sent to ${email}`);
      setTimeout(() => setNotification(null), 6000);
    } catch (error) {
      console.error("Error sending email:", error);
      setNotification("Something went wrong");
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const sendLoginEmail = async (email: string, loginRowId: string) => {
    try {
      const emailData = {
        to: email,
        loginRowId,
      };
      await axios.post(`/api/login`, emailData);
      setNotification(`Login email sent to ${email}`);
      setTimeout(() => setNotification(null), 6000);
    } catch (error) {
      console.error("Error sending email:", error);
      setNotification("Something went wrong");
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedData = emailSchema.parse({ email });
      const { email: parsedEmail } = parsedData;

      const loginRowId = generateRandomId();
      const loginObject = {
        id: loginRowId,
        email: parsedEmail,
        loginInitiationTimestamp: serverTimestamp(),
        host: window.location.hostname,
      };
      const q = query(
        collection(db, "users"),
        where("email", "==", parsedEmail)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        await setDoc(doc(db, "delivrd_user_logins", loginRowId), {
          ...loginObject,
          emailFound: true,
          userId: userData.id,
          userType: userData.privilege,
        });
        const user = {
          email: userData.email,
        };

        localStorage.setItem("currentEmail", user.email);

        sendLoginEmail(user.email, loginRowId);
      } else {
        await setDoc(doc(db, "delivrd_user_logins", loginRowId), {
          ...loginObject,
          emailFound: false,
        });

        await sendEmail(parsedEmail);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message);
      } else {
        console.error("Error occurred: ", err);
        setError("An error occurred. Please try again.");
      }
    }
  };

  return {
    email,
    setEmail,
    error,
    notification,
    handleSubmit,
  };
};
