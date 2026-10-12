import { useLayoutEffect, useRef } from 'react';
import { mountEditor, showDocument, unmountEditor } from '../editor/bridge';
import { useApp } from '../store';

export function EditorPane({ hidden }: { hidden: boolean }) {
  const host = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    mountEditor(host.current!);
    // If a document is already open (e.g. after a hot reload), show it again.
    const { currentId, content, settings } = useApp.getState();
    if (currentId) showDocument(currentId, content, settings);
    return unmountEditor;
  }, []);

  return <div ref={host} className="editor-pane" hidden={hidden} />;
}
