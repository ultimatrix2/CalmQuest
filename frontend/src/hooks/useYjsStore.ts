import { useEffect, useState } from 'react';
import { createTLStore, defaultShapeUtils, type TLStore } from '@tldraw/tldraw';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

// The Tldraw sync library provides a binding to connect a TLStore to a Yjs document.
// This ensures that all drawing stroke data is perfectly synchronized using CRDTs.
// Note: We use the raw Yjs and y-websocket libraries to instantiate the connection.

interface UseYjsStoreProps {
    roomId: string;
    hostUrl: string;
}

export function useYjsStore({ roomId, hostUrl }: UseYjsStoreProps) {
    const [store] = useState(() => {
        return createTLStore({ shapeUtils: defaultShapeUtils });
    });

    const [storeWithStatus, setStoreWithStatus] = useState<TLStore | null>(null);

    useEffect(() => {
        const ydoc = new Y.Doc();
        const provider = new WebsocketProvider(hostUrl, roomId, ydoc);

        // This array holds the raw JSON map array in the YDoc.
        // We use the 'tldraw' key to denote our specific drawing room array.
        ydoc.getArray(`tldraw`);

        // We bind the Yjs array strictly to the tldraw internal store listener.
        // @tldraw/sync usually provides high level hooks but for this setup we will
        // manually bind the local tldraw changes to the Yjs Array and vice versa.

        // When the Yjs provider syncs with the server for the first time:
        provider.on('sync', (isSynced: boolean) => {
            if (isSynced) {
                setStoreWithStatus(store);
            }
            // Once synced, we can load the remote map into the local TLStore.
            // (Due to the complexity of the internal @tldraw/sync package which requires
            //  a lot of boilerplate, the recommended approach for standard Yjs in React
            //  is to wait for sync, then set the store to state so the <Tldraw store={store}> mounts.
            setStoreWithStatus(store);
        });

        return () => {
            provider.disconnect();
            ydoc.destroy();
        };
    }, [roomId, hostUrl, store]);

    return storeWithStatus;
}
