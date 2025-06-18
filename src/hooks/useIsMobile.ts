import { useEffect, useState } from "react";

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenSize(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};

export const useIsMobile = () => {
  const screenSize = useScreenSize();
  const [isMobile, setIsMobile] = useState(screenSize < 768);

  useEffect(() => {
    setIsMobile(screenSize < 768);
  }, [screenSize]);

  return isMobile;
};
