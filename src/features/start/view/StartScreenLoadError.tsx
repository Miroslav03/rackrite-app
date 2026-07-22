import { Screen } from "@/shared/components/layout/Screen";
import { AppText } from "@/shared/components/ui/AppText";

type StartScreenLoadErrorProps = {
  error: Error;
};

export function StartScreenLoadError({ error }: StartScreenLoadErrorProps) {
  return (
    <Screen
      className="items-center justify-center"
      scroll={false}
      withHeader={false}
    >
      <AppText variant="title" className="text-center text-error">
        Couldn&apos;t Load Workout
      </AppText>
      <AppText className="mt-4 max-w-sm text-center">
        Your workout data could not be loaded. Close and reopen the app to try
        again.
      </AppText>

      {__DEV__ ? (
        <AppText className="mt-4 max-w-sm text-center text-xs text-error">
          {error.message}
        </AppText>
      ) : null}
    </Screen>
  );
}
