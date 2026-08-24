import Button, {
  type ButtonProps,
} from "@/components/ui/Button";

type PrimaryButtonProps = Omit<
  ButtonProps,
  "variant"
>;

export default function PrimaryButton(
  props: PrimaryButtonProps,
) {
  return (
    <Button
      variant="primary"
      {...props}
    />
  );
}