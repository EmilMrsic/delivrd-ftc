import useEmblaCarousel from "embla-carousel-react";
import { NextButton, PrevButton, usePrevNextButtons } from "./prev-next-button";
import { DotButton, useDotButton } from "./dot-buttons";
import { cn } from "@/lib/utils";

export const ImageCarousel = ({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <div
      className={cn(`relative overflow-hidden w-full`, className && className)}
      ref={emblaRef}
    >
      <div className="embla__container flex w-full">
        {images.map((url, index) => (
          <div className="flex-[0_0_100%]" key={index}>
            <img
              src={url}
              alt={`image-${index}`}
              className="w-[100%] min-h-[300px] aspect-[16/9] object-cover block"
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <div className="flex gap-1">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              selected={index === selectedIndex}
            />
          ))}
        </div>
      </div>
      <PrevButton
        onClick={onPrevButtonClick}
        disabled={prevBtnDisabled}
        //   className="absolute top-1/2 -translate-y-1/2 left-[-50px]"
        className="absolute left-0 top-1/2 bg-[#7F7F7F] rounded-full p-2"
      />
      <NextButton
        onClick={onNextButtonClick}
        disabled={nextBtnDisabled}
        className="absolute right-0 top-1/2 bg-[#7F7F7F] rounded-full p-2"
      />
    </div>
  );
};
