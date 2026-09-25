import { useCallback, useRef, useState } from "react";

import type { TemplateSetId } from "@/domain/templates/editor/templates.types";

import type { TemplateEditorPanel } from "./templateEditorDock.types";

type RequestedPanel = {
  templateSetId: TemplateSetId;
  panel: TemplateEditorPanel;
};

export function useTemplateEditorDockController(
  activeSetId: TemplateSetId | null,
) {
  const [requestedPanel, setRequestedPanel] = useState<RequestedPanel | null>(
    null,
  );

  const requestedPanelRef = useRef<RequestedPanel | null>(null);

  const openPanel = useCallback(
    (templateSetId: TemplateSetId, panel: TemplateEditorPanel) => {
      const requested = { templateSetId, panel };
      requestedPanelRef.current = requested;
      setRequestedPanel(requested);
    },
    [],
  );

  const closePanel = useCallback(() => {
    requestedPanelRef.current = null;
    setRequestedPanel(null);
  }, []);

  const getRequestedPanel = useCallback(() => requestedPanelRef.current, []);

  return {
    panel:
      requestedPanel?.templateSetId === activeSetId
        ? requestedPanel.panel
        : null,
    openPanel,
    closePanel,
    getRequestedPanel,
  };
}
