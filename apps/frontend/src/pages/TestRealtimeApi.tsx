import { spsChatApi } from '../api-legacy/sps-chat';
import { useState } from 'react';

export default function TestRealtimeApi() {
    const [session, setSession] = useState<any | null>(null);

    return (
        <div>
            <h1>Test Realtime API</h1>
            <button onClick={async () => {
                const data = await spsChatApi.initSession();
                setSession(data);
            }} className='bg-blue-500 text-white p-2 rounded-md'>Init Session</button>
            <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
    )
}