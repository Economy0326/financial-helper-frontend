import Button, {
  type ButtonProps,
} from "@/components/ui/Button";

type SecondaryButtonProps = Omit<
  ButtonProps,
  "variant"
>;

export default function SecondaryButton(
  props: SecondaryButtonProps,
) {
  return (
    <Button
      variant="secondary"
      {...props}
    />
  );
}