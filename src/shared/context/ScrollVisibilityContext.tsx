import { createContext, useCallback, useContext, useRef } from "react";
import { View } from "react-native";

type LayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MeasureFn = () => Promise<LayoutRect | null>;
type ScrollByFn = (delta: number) => void;

type ScrollVisibilityContextValue = {
  registerTarget: (measure: MeasureFn) => () => void;
  registerOccluder: (measure: MeasureFn) => () => void;
  registerScroller: (scrollBy: ScrollByFn) => () => void;
  ensureVisible: () => void;
};

const ScrollVisibilityContext =
  createContext<ScrollVisibilityContextValue | null>(null);

export function useScrollVisibility() {
  const context = useContext(ScrollVisibilityContext);

  if (!context) {
    throw new Error(
      "useScrollVisibility must be used inside ScrollVisibilityProvider",
    );
  }

  return context;
}

export function ScrollVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const targetMeasureRef = useRef<MeasureFn | null>(null);
  const occluderMeasureRef = useRef<MeasureFn | null>(null);
  const scrollByRef = useRef<ScrollByFn | null>(null);

  const registerTarget = useCallback((measure: MeasureFn) => {
    targetMeasureRef.current = measure;

    return () => {
      targetMeasureRef.current = null;
    };
  }, []);

  const registerOccluder = useCallback((measure: MeasureFn) => {
    occluderMeasureRef.current = measure;

    return () => {
      occluderMeasureRef.current = null;
    };
  }, []);

  const registerScroller = useCallback((scrollBy: ScrollByFn) => {
    scrollByRef.current = scrollBy;

    return () => {
      scrollByRef.current = null;
    };
  }, []);

  const ensureVisible = useCallback(async () => {
    const measureTarget = targetMeasureRef.current;
    const measureOccluder = occluderMeasureRef.current;

    if (!measureTarget || !measureOccluder) {
      return;
    }

    const [target, occluder] = await Promise.all([
      measureTarget(),
      measureOccluder(),
    ]);

    if (!target || !occluder) {
      return;
    }

    const targetBottom = target.y + target.height;
    const occluderTop = occluder.y;

    const gap = 10;
    const allowedBottom = occluderTop - gap;

    if (targetBottom <= allowedBottom) {
      return;
    }

    const scrollDelta = targetBottom - allowedBottom;

    if (scrollDelta > 0) {
      scrollByRef.current?.(scrollDelta);
    }
  }, []);

  return (
    <ScrollVisibilityContext.Provider
      value={{
        registerTarget,
        registerOccluder,
        registerScroller,
        ensureVisible,
      }}
    >
      {children}
    </ScrollVisibilityContext.Provider>
  );
}

export function measureView(view: View | null): Promise<LayoutRect | null> {
  return new Promise((resolve) => {
    if (!view) {
      resolve(null);
      return;
    }

    view.measureInWindow((x, y, width, height) => {
      resolve({ x, y, width, height });
    });
  });
}
