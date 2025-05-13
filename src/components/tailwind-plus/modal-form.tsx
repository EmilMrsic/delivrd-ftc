import { TailwindPlusModal } from "./modal";

export const ModalForm = ({
  open,
  setOpen,
  onClose,
  title,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
  title: string;
}) => {
  return (
    <TailwindPlusModal close={onClose} width={50} height={50}>
      test
    </TailwindPlusModal>
  );
};
