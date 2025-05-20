export const LoomVideo = ({ url }: { url: string }) => {
  return (
    <iframe
      src={url}
      width="100%"
      height="100%"
      allow="autoplay; fullscreen; microphone; camera; midi; vr; encrypted-media"
    ></iframe>
  );
};
