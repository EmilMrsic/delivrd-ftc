import { db } from "@/firebase/config";
import { cacheBidTypeCounts } from "@/lib/helpers/bids";
import { NegotiationDataType } from "@/lib/models/team";
import { collection, getDocs } from "firebase/firestore";

export const main = async () => {
  let allNegotiations: (NegotiationDataType & { archived?: boolean })[] = [];
  const negotiationSnapshot = await getDocs(
    collection(db, "delivrd_negotiations")
  );
  const negotiationArchivedSnapshot = await getDocs(
    collection(db, "delivrd_archive")
  );

  allNegotiations = negotiationSnapshot.docs.map(
    (doc) => doc.data() as NegotiationDataType
  );
  allNegotiations = allNegotiations.concat(
    negotiationArchivedSnapshot.docs.map((doc) => ({
      ...(doc.data() as NegotiationDataType),
      archived: true,
    }))
  );

  for (const negotiation of allNegotiations) {
    if (negotiation.id && negotiation.totalRegularBids === undefined) {
      console.log("running for negotiation: ", negotiation.id);
      try {
        await cacheBidTypeCounts(negotiation.id, negotiation.archived || false);
      } catch (error) {
        console.error(
          "--> error caching bid type counts for negotiation: ",
          negotiation.id,
          "!!"
        );
        console.error(error);
      }
    }
  }
  //   await cacheBidTypeCounts("recH85js7w4MRVDru");
};

main().then(() => {
  console.log("done");
  process.exit(0);
});
