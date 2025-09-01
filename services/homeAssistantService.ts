import type { HaEntity } from '../types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'authenticating';
type OnStateUpdateCallback = (entities: { [entityId: string]: HaEntity }) => void;
type OnStatusChangeCallback = (status: ConnectionStatus) => void;

interface HassMessage {
    id?: number;
    type: string;
    [key: string]: any;
}

export class HomeAssistantService {
    private socket: WebSocket | null = null;
    private messageId = 1;
    private entities: { [entityId: string]: HaEntity } = {};
    
    private onStateUpdate: OnStateUpdateCallback;
    private onStatusChange: OnStatusChangeCallback;

    constructor(onStateUpdate: OnStateUpdateCallback, onStatusChange: OnStatusChangeCallback) {
        this.onStateUpdate = onStateUpdate;
        this.onStatusChange = onStatusChange;
    }

    public connect(url: string, token: string) {
        if (this.socket) {
            this.disconnect();
        }

        this.onStatusChange('connecting');
        
        try {
            // Basic URL validation
            if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
                throw new Error("Invalid URL format. Must start with ws:// or wss://");
            }
            this.socket = new WebSocket(url);
        } catch (e: any) {
            console.error("WebSocket connection error:", e);
            this.onStatusChange('error');
            return;
        }

        this.socket.onmessage = (event) => this.handleMessage(event, token);
        this.socket.onopen = () => console.log("HA WebSocket connection opened.");
        this.socket.onclose = () => {
            console.log("HA WebSocket connection closed.");
            this.onStatusChange('disconnected');
        };
        this.socket.onerror = (error) => {
            console.error("HA WebSocket error:", error);
            this.onStatusChange('error');
        };
    }

    public disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.entities = {};
        this.onStateUpdate(this.entities);
        this.onStatusChange('disconnected');
    }

    private handleMessage(event: MessageEvent, token: string) {
        const msg = JSON.parse(event.data) as HassMessage;

        switch (msg.type) {
            case 'auth_required':
                this.onStatusChange('authenticating');
                this.sendMessage({ type: 'auth', access_token: token });
                break;
            case 'auth_ok':
                this.onStatusChange('connected');
                this.subscribeToStateChanges();
                this.fetchStates();
                break;
            case 'auth_invalid':
                this.onStatusChange('error');
                this.disconnect();
                break;
            case 'result':
                if (msg.success && msg.result) {
                    if (Array.isArray(msg.result)) { // Assuming this is the result of fetchStates
                        const initialEntities: { [entityId: string]: HaEntity } = {};
                        for (const entity of msg.result as HaEntity[]) {
                            initialEntities[entity.entity_id] = entity;
                        }
                        this.entities = initialEntities;
                        this.onStateUpdate(this.entities);
                    }
                }
                break;
            case 'event':
                if (msg.event?.event_type === 'state_changed') {
                    const entity = msg.event.data.new_state as HaEntity;
                    if (entity) {
                        this.entities[entity.entity_id] = entity;
                        // For performance, we can send a deep copy to ensure React re-renders.
                        this.onStateUpdate({ ...this.entities });
                    }
                }
                break;
        }
    }
    
    private sendMessage(message: HassMessage) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            if (!message.id) {
                message.id = this.messageId++;
            }
            this.socket.send(JSON.stringify(message));
        }
    }

    private subscribeToStateChanges() {
        this.sendMessage({ type: 'subscribe_events', event_type: 'state_changed' });
    }

    private fetchStates() {
        this.sendMessage({ type: 'get_states' });
    }

    public callService(domain: string, service: string, serviceData: { entity_id: string, [key: string]: any }) {
        this.sendMessage({
            type: 'call_service',
            domain,
            service,
            service_data: serviceData,
        });
    }
}
